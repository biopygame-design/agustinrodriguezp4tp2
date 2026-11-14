import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Publicacion } from './publicaciones.schema';
import { Usuario } from '../usuarios/usuario.schema';

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
    const objectId = new Types.ObjectId(id);

    const usuario = await this.usuarioModel.findById(objectId).select('-contrasena').lean().exec();
    
    const publicaciones = await this.publicacionModel.find({ usuario: objectId, activo: { $ne: false } })
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    return {
      usuario,
      publicaciones
    };
  }

  async toggleLike(postId: string, usuarioId: string) {
    const objectPostId = new Types.ObjectId(postId);
    const publicacion = await this.publicacionModel.findById(objectPostId);
    
    if (!publicacion) throw new NotFoundException('Publicación no encontrada');

    if (!publicacion.me_gusta) {
      publicacion.me_gusta = [];
    }

    const index = publicacion.me_gusta.findIndex(
      (id) => id.toString() === usuarioId.toString()
    );

    if (index > -1) {
      publicacion.me_gusta.splice(index, 1);
    } else {
      publicacion.me_gusta.push(usuarioId as any);
    }

    return await publicacion.save();
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
}
 


