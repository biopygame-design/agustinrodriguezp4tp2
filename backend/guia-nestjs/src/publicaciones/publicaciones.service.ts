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
    console.log('🚨 ORDEN LIMPIO:', JSON.stringify(ordenLimpio));

    const limit = limitStr ? parseInt(limitStr, 10) : 10;
    const offset = offsetStr ? parseInt(offsetStr, 10) : 0;

    if (ordenLimpio === 'likes') {
      console.log('✅ ENTRÓ AL IF DE LIKES');
      const publicaciones = await this.publicacionModel.aggregate([
        { 
          $match: { activo: { $ne: false } } // 👈 ¡Faltaba este filtro acá!
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

      console.log('📊 CANTIDAD DE REGRESADOS POR AGGREGATE:', publicaciones.length);

      return await this.publicacionModel.populate(publicaciones, {
        path: 'usuario',
        select: '-contrasena',
      });
    }
    console.log('⚙️ ENTRÓ AL ELSE DE FECHA');
    return await this.publicacionModel
      .find({ activo: { $ne: false } })
      .sort({ _id: -1 })
      .skip(offset)   
      .limit(limit)   
      .populate('usuario', '-contrasena')
      .lean()
      .exec();
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
    
    const publicaciones = await this.publicacionModel.find({ usuario: objectId })
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

    // Buscamos al usuario en la BD para verificar su rol de forma segura
    const usuarioAccion = await this.usuarioModel.findById(usuarioId);
    const rol = usuarioAccion?.rol;
    
    const esAdmin = rol === 'admin' || rol === 'administrador';
    const esCreador = publicacion.usuario.toString() === usuarioId.toString();

    // Validamos permisos: solo el creador o un administrador pueden eliminar
    if (!esCreador && !esAdmin) {
      throw new ForbiddenException('No tenés permisos para eliminar esta publicación');
    }

    // Baja lógica en lugar de borrado físico
    return await this.publicacionModel.findByIdAndUpdate(
      objectId,
      { activo: false },
      { new: true }
    );
  }
}