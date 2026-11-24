import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Publicacion } from './publicaciones.schema';
import { Usuario } from '../usuarios/usuario.schema';
 import { BadRequestException } from '@nestjs/common';

@Injectable()
export class PublicacionesService {
  constructor(
    @InjectModel(Publicacion.name) 
    private readonly publicacionModel: Model<Publicacion>,
    @InjectModel(Usuario.name) 
    private readonly usuarioModel: Model<Usuario>
  ) {}

  async listar(orden: string = 'fecha', limitStr?: string, offsetStr?: string) {
    console.log('🚨 VALOR CRUDO DE ORDEN:', JSON.stringify(orden));
    
    const ordenLimpio = orden ? orden.trim().toLowerCase() : 'fecha';
    const limit = limitStr ? parseInt(limitStr, 10) : 10;
    const offset = offsetStr ? parseInt(offsetStr, 10) : 0;

    if (ordenLimpio === 'likes') {
      const publicaciones = await this.publicacionModel.aggregate([
        { 
          $match: { activo: { $ne: false } } 
        },
        { 
          $addFields: { 
            totalLikes: { $size: { $ifNull: ["$me_gusta", []] } } 
          } 
        },
        { $sort: { totalLikes: -1, _id: -1 } },
        { $skip: offset }, 
        { $limit: limit }, 
      ]);

      return await this.publicacionModel.populate(publicaciones, {
        path: 'usuario',
        select: '-contrasena',
      });
    }

    return await this.publicacionModel
      .find({ activo: { $ne: false } })
      .sort({ _id: -1 })
      .skip(offset)   
      .limit(limit)   
      .populate('usuario', '-contrasena')
      .lean()
      .exec();
  }

  // 🔍 Obtener una publicación individual por ID
  async obtenerPorId(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('ID de publicación inválido');
    }

    const publicacion = await this.publicacionModel
      .findOne({ _id: new Types.ObjectId(id), activo: { $ne: false } })
      .populate('usuario', '-contrasena')
      .lean()
      .exec();

    if (!publicacion) {
      throw new NotFoundException('Publicación no encontrada');
    }

    return publicacion;
  }

  // 💬 Obtener comentarios paginados de una publicación
  async obtenerComentarios(postId: string, limitStr?: string, offsetStr?: string) {
    if (!Types.ObjectId.isValid(postId)) {
      throw new NotFoundException('ID de publicación inválido');
    }

    const limit = limitStr ? parseInt(limitStr, 10) : 5;
    const offset = offsetStr ? parseInt(offsetStr, 10) : 0;
    const objectId = new Types.ObjectId(postId);

    const resultado = await this.publicacionModel.aggregate([
      { $match: { _id: objectId, activo: { $ne: false } } },
      { 
        $project: { 
          comentarios: { 
            $slice: [{ $ifNull: ["$comentarios", []] }, offset, limit] 
          } 
        } 
      }
    ]);

    if (!resultado || resultado.length === 0) {
      throw new NotFoundException('Publicación no encontrada');
    }

    const comentarios = resultado[0].comentarios || [];

    return await this.publicacionModel.populate(comentarios, {
      path: 'usuario',
      select: '-contrasena'
    });
  }

  // ✍️ Agregar un comentario (Tipado como `any` para evitar conflictos de TypeScript en el build)
  async agregarComentario(postId: string, usuarioId: string, texto: string) {
    if (!Types.ObjectId.isValid(postId) || !Types.ObjectId.isValid(usuarioId)) {
      throw new NotFoundException('IDs inválidos');
    }

    const publicacion: any = await this.publicacionModel.findById(postId);
    if (!publicacion || publicacion.activo === false) {
      throw new NotFoundException('Publicación no encontrada');
    }

    if (!publicacion.comentarios) {
      publicacion.comentarios = [];
    }

    const nuevoComentario = {
      _id: new Types.ObjectId(),
      usuario: new Types.ObjectId(usuarioId),
      texto,
      createdAt: new Date(),
      editado: false
    };

    publicacion.comentarios.unshift(nuevoComentario);
    await publicacion.save();

    await this.publicacionModel.populate(publicacion, {
      path: 'comentarios.usuario',
      select: '-contrasena'
    });

    return publicacion.comentarios[0];
  }

  async crear(createPublicacionDto: any) {
    if (createPublicacionDto.usuario && typeof createPublicacionDto.usuario === 'string') {
      createPublicacionDto.usuario = new Types.ObjectId(createPublicacionDto.usuario);
    }

    const nuevaPublicacion = new this.publicacionModel(createPublicacionDto);
    return await nuevaPublicacion.save();
  }

  
async obtenerPerfilUsuario(id: string) {
  if (!Types.ObjectId.isValid(id)) {
    throw new NotFoundException('ID de usuario inválido');
  }

  const objectId = new Types.ObjectId(id);

  const usuario = await this.usuarioModel
    .findById(objectId)
    .select('-contrasena')
    .lean()
    .exec();

  if (!usuario) {
    throw new NotFoundException('Usuario no encontrado');
  }

  const publicaciones = await this.publicacionModel
    .find({
      usuario: objectId,
      activo: { $ne: false }
    })
    .sort({ createdAt: -1 })
    .limit(3)
    .lean()
    .exec();

  return {
    usuario,
    publicaciones
  };
}

  
// 

// POST: agregar Me gusta
async agregarLike(postId: string, usuarioId: string) {
  if (
    !Types.ObjectId.isValid(postId) ||
    !Types.ObjectId.isValid(usuarioId)
  ) {
    throw new BadRequestException('IDs inválidos');
  }

  const objectPostId = new Types.ObjectId(postId);
  const objectUsuarioId = new Types.ObjectId(usuarioId);

  const publicacion = await this.publicacionModel.findOneAndUpdate(
    {
      _id: objectPostId,
      activo: { $ne: false }
    },
    {
      $addToSet: { me_gusta: objectUsuarioId }
    },
    { new: true }
  );

  if (!publicacion) {
    throw new NotFoundException('Publicación no encontrada');
  }

  return publicacion;
}

// DELETE: quitar Me gusta
async eliminarLike(postId: string, usuarioId: string) {
  if (
    !Types.ObjectId.isValid(postId) ||
    !Types.ObjectId.isValid(usuarioId)
  ) {
    throw new BadRequestException('IDs inválidos');
  }

  const objectPostId = new Types.ObjectId(postId);
  const objectUsuarioId = new Types.ObjectId(usuarioId);

  const publicacion = await this.publicacionModel.findOneAndUpdate(
    {
      _id: objectPostId,
      activo: { $ne: false },
      me_gusta: objectUsuarioId
    },
    {
      $pull: { me_gusta: objectUsuarioId }
    },
    { new: true }
  );

  if (publicacion) {
    return publicacion;
  }

  const existe = await this.publicacionModel.exists({
    _id: objectPostId,
    activo: { $ne: false }
  });

  if (!existe) {
    throw new NotFoundException('Publicación no encontrada');
  }

  throw new BadRequestException(
    'No podés quitar un Me gusta que no realizaste previamente'
  );
}


  async eliminar(id: string, usuarioId: string) {
    const objectId = new Types.ObjectId(id);
    const publicacion = await this.publicacionModel.findById(objectId);
    
    if (!publicacion) {
      throw new NotFoundException('Publicación no encontrada');
    }

    const usuarioAccion = await this.usuarioModel.findById(usuarioId);
    const rol = usuarioAccion?.rol;
    
    const esAdmin = rol === 'admin' || rol === 'administrador';
    const esCreador = publicacion.usuario.toString() === usuarioId.toString();

    if (!esCreador && !esAdmin) {
      throw new ForbiddenException('No tenés permisos para eliminar esta publicación');
    }

    return await this.publicacionModel.findByIdAndUpdate(
      objectId,
      { activo: false },
      { new: true }
    );
  }
  // ✏️ Modificar un comentario existente (Por PUT)
  


async modificarComentario(
  postId: string,
  comentarioId: string,
  usuarioId: string,
  nuevoTexto: string
) {
  console.log('POST ID:', postId);
  console.log('COMENTARIO ID:', comentarioId);
  console.log('USUARIO ID:', usuarioId);

  if (
    !Types.ObjectId.isValid(postId) ||
    !Types.ObjectId.isValid(comentarioId) ||
    !Types.ObjectId.isValid(usuarioId)
  ) {
    throw new NotFoundException('IDs inválidos');
  }

  const publicacion: any = await this.publicacionModel.findById(postId);

  if (!publicacion || publicacion.activo === false) {
    throw new NotFoundException('Publicación no encontrada');
  }

  console.log('COMENTARIOS:', publicacion.comentarios);

  // Buscar directamente por el identificador
  const comentario = publicacion.comentarios.find(
    (c: any) => c._id.toString() === comentarioId.toString()
  );

  console.log('COMENTARIO ENCONTRADO:', !!comentario);

  if (!comentario) {
    throw new NotFoundException('Comentario no encontrado');
  }

  // Verificar que sea el autor del comentario
  const esCreadorComentario =
    comentario.usuario.toString() === usuarioId.toString();

  if (!esCreadorComentario) {
    throw new ForbiddenException(
      'No tenés permisos para editar este comentario'
    );
  }

  // Modificar el comentario
  comentario.texto = nuevoTexto;
  comentario.editado = true;

  // Asegurar que Mongoose registre los cambios
  publicacion.markModified('comentarios');

  await publicacion.save();

  console.log('✅ COMENTARIO MODIFICADO CORRECTAMENTE');

  await this.publicacionModel.populate(publicacion, {
    path: 'comentarios.usuario',
    select: '-contrasena'
  });

  return publicacion.comentarios.find(
    (c: any) => c._id.toString() === comentarioId.toString()
  );
}

async eliminarComentario(
  postId: string,
  comentarioId: string,
  usuarioId: string
) {
  if (
    !Types.ObjectId.isValid(postId) ||
    !Types.ObjectId.isValid(comentarioId) ||
    !Types.ObjectId.isValid(usuarioId)
  ) {
    throw new NotFoundException('IDs inválidos');
  }

  const publicacion: any = await this.publicacionModel.findById(postId);

  if (!publicacion || publicacion.activo === false) {
    throw new NotFoundException('Publicación no encontrada');
  }

  const comentario = publicacion.comentarios.find(
    (c: any) => c._id.toString() === comentarioId.toString()
  );

  if (!comentario) {
    throw new NotFoundException('Comentario no encontrado');
  }

  const esCreadorComentario =
    comentario.usuario.toString() === usuarioId.toString();

  if (!esCreadorComentario) {
    throw new ForbiddenException(
      'No tenés permisos para eliminar este comentario'
    );
  }

  publicacion.comentarios = publicacion.comentarios.filter(
    (c: any) => c._id.toString() !== comentarioId.toString()
  );

  publicacion.markModified('comentarios');

  await publicacion.save();

  return {
    mensaje: 'Comentario eliminado correctamente',
    comentarioId
  };
}
  // Validar y preparar el rango de fechas
  private obtenerRangoFechas(fechaInicio: string, fechaFin: string) {
    const inicio = /^\d{4}-\d{2}-\d{2}$/.test(fechaInicio)
      ? new Date(`${fechaInicio}T00:00:00.000Z`)
      : new Date(fechaInicio);

    const fin = /^\d{4}-\d{2}-\d{2}$/.test(fechaFin)
      ? new Date(`${fechaFin}T23:59:59.999Z`)
      : new Date(fechaFin);

    if (
      isNaN(inicio.getTime()) ||
      isNaN(fin.getTime()) ||
      inicio > fin
    ) {
      throw new NotFoundException('Rango de fechas inválido');
    }

    return { inicio, fin };
  }

  // 1. Cantidad de publicaciones por usuario
  async estadisticasPublicacionesPorUsuario(
    fechaInicio: string,
    fechaFin: string
  ) {
    const { inicio, fin } = this.obtenerRangoFechas(fechaInicio, fechaFin);

    const resultado = await this.publicacionModel.aggregate([
      {
        $match: {
          activo: { $ne: false },
          createdAt: { $gte: inicio, $lte: fin }
        }
      },
      {
        $group: {
          _id: '$usuario',
          totalPublicaciones: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          usuario: '$_id',
          totalPublicaciones: 1
        }
      },
      {
        $sort: { totalPublicaciones: -1 }
      }
    ]);

    return await this.publicacionModel.populate(resultado, {
      path: 'usuario',
      select: '-contrasena'
    });
  }

  // 2. Cantidad total de comentarios en un período
  async estadisticasCantidadComentarios(
    fechaInicio: string,
    fechaFin: string
  ) {
    const { inicio, fin } = this.obtenerRangoFechas(fechaInicio, fechaFin);

    const resultado = await this.publicacionModel.aggregate([
      {
        $match: {
          activo: { $ne: false }
        }
      },
      {
        $unwind: '$comentarios'
      },
      {
        $match: {
          'comentarios.createdAt': {
            $gte: inicio,
            $lte: fin
          }
        }
      },
      {
        $count: 'totalComentarios'
      }
    ]);

    return {
      totalComentarios: resultado[0]?.totalComentarios || 0
    };
  }

  // 3. Cantidad de comentarios por publicación
  async estadisticasComentariosPorPublicacion(
    fechaInicio: string,
    fechaFin: string
  ) {
    const { inicio, fin } = this.obtenerRangoFechas(fechaInicio, fechaFin);

    return await this.publicacionModel.aggregate([
      {
        $match: {
          activo: { $ne: false }
        }
      },
      {
        $unwind: '$comentarios'
      },
      {
        $match: {
          'comentarios.createdAt': {
            $gte: inicio,
            $lte: fin
          }
        }
      },
      {
        $group: {
          _id: '$_id',
          titulo: { $first: '$titulo' },
          totalComentarios: { $sum: 1 }
        }
      },
      {
        $sort: { totalComentarios: -1 }
      }
    ]);
  }
  async verificarAdmin(usuarioId: string) {
  if (!Types.ObjectId.isValid(usuarioId)) {
    throw new ForbiddenException('Usuario no autorizado');
  }

  const usuario = await this.usuarioModel
    .findById(usuarioId)
    .select('rol')
    .lean()
    .exec();

  if (!usuario || !['admin', 'administrador'].includes(usuario.rol)) {
    throw new ForbiddenException(
      'Solamente un administrador puede consultar las estadísticas'
    );
  }

  return true;
}




}
 


