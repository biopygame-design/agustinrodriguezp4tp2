import { Body, Controller, Get, Param, Post, UseInterceptors, UploadedFile, Delete, Query, UseGuards, Req } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { PublicacionesService } from './publicaciones.service';
import { CreatePublicacionDto } from './dto/create-publicacion.dto/create-publicacion.dto';
import { Put } from '@nestjs/common';
import { AuthGuard } from '../auth/auth-guard';
import { ForbiddenException } from '@nestjs/common';
@Controller('publicaciones')
export class PublicacionesController {
  constructor(private readonly publicacionesService: PublicacionesService) {}

  @Get()
  listar(
    @Query('orden') orden?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) { 
    console.log('🔍 Parámetros de paginación -> Limit:', limit, '| Offset:', offset);
    return this.publicacionesService.listar(orden, limit, offset);
  }

  @Post()
  @UseInterceptors(
    FileInterceptor('imagen', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, callback) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          callback(null, uniqueSuffix + extname(file.originalname));
        },
      }),
    }),
  )
  async crear(
    @Body() datos: CreatePublicacionDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const datosFinales = {
      ...datos,
      imagen_publicacion: file ? file.filename : null, 
    };
    return await this.publicacionesService.crear(datosFinales);
  }

  // 📂 1. RUTAS ESPECÍFICAS CON ID PRIMERO (Para que NestJS no las confunda)
  @Get('perfil/:id')
  async obtenerPerfil(@Param('id') id: string) {
    return await this.publicacionesService.obtenerPerfilUsuario(id);
  }
  // 📊 ESTADÍSTICAS: publicaciones por usuario
@Get('estadisticas/publicaciones-por-usuario')
@UseGuards(AuthGuard)
async publicacionesPorUsuario(
  @Query('fechaInicio') fechaInicio: string,
  @Query('fechaFin') fechaFin: string,
  @Req() req: any
) {
  await this.validarAdmin(req);

  return this.publicacionesService.estadisticasPublicacionesPorUsuario(
    fechaInicio,
    fechaFin
  );
}

// 📊 ESTADÍSTICAS: cantidad total de comentarios
@Get('estadisticas/cantidad-comentarios')
@UseGuards(AuthGuard)
async cantidadComentarios(
  @Query('fechaInicio') fechaInicio: string,
  @Query('fechaFin') fechaFin: string,
  @Req() req: any
) {
  await this.validarAdmin(req);

  return this.publicacionesService.estadisticasCantidadComentarios(
    fechaInicio,
    fechaFin
  );
}

// 📊 ESTADÍSTICAS: comentarios por publicación
@Get('estadisticas/comentarios-por-publicacion')
@UseGuards(AuthGuard)
async comentariosPorPublicacion(
  @Query('fechaInicio') fechaInicio: string,
  @Query('fechaFin') fechaFin: string,
  @Req() req: any
) {
  await this.validarAdmin(req);

  return this.publicacionesService.estadisticasComentariosPorPublicacion(
    fechaInicio,
    fechaFin
  );
}

  // 📌 2. RUTA GENERAL DE DETALLE POR ID
  @Get(':id')
  async obtenerPorId(@Param('id') id: string) {
    return await this.publicacionesService.obtenerPorId(id);
  }

  // 💬 3. SUB-RUTAS Y ACCIONES DEPENDIENTES DE UN POST ID
  @Get(':id/comentarios')
  async obtenerComentarios(
    @Param('id') id: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return await this.publicacionesService.obtenerComentarios(id, limit, offset);
  }

  @Post(':id/comentarios')
  async agregarComentario(
    @Param('id') id: string,
    @Body('usuarioId') usuarioId: string,
    @Body('texto') texto: string,
  ) {
    return await this.publicacionesService.agregarComentario(id, usuarioId, texto);
  }

  @Post(':id/like')
  async toggleLike(@Param('id') id: string, @Body('usuarioId') usuarioId: string) {
    return await this.publicacionesService.toggleLike(id, usuarioId);
  }

  @Delete(':id')
  async eliminar(
    @Param('id') id: string, 
    @Body('usuarioId') usuarioId: string
  ) {
    return await this.publicacionesService.eliminar(id, usuarioId);
  }
  @Put(':postId/comentarios/:comentarioId')
  @UseGuards(AuthGuard) // Asegurate de tener tu guard de autenticación
  async actualizarComentario(
    @Param('postId') postId: string,
    @Param('comentarioId') comentarioId: string,
    @Body('texto') texto: string,
    @Req() req: any // O tu decorador para extraer el usuario autenticado del token
  ) {
    console.log('🚀 RUTA PUT EJECUTADA');
    console.log('POST:', postId);
    console.log('COMENTARIO:', comentarioId);
    console.log('USUARIO:', req.user);
    const usuarioId = req.user.sub || req.user.id; // Depende de cómo armes el payload del JWT
    return await this.publicacionesService.modificarComentario(postId, comentarioId, usuarioId, texto);
  }
  @Delete(':postId/comentarios/:comentarioId')
@UseGuards(AuthGuard)
async eliminarComentario(
  @Param('postId') postId: string,
  @Param('comentarioId') comentarioId: string,
  @Req() req: any
) {
  const usuarioId = req.user.sub || req.user.id;

  return await this.publicacionesService.eliminarComentario(
    postId,
    comentarioId,
    usuarioId
  );
}
private async validarAdmin(req: any) {
  const usuarioId = req.user?.sub || req.user?.id || req.user?._id;

  if (!usuarioId) {
    throw new ForbiddenException('Usuario no autorizado');
  }

  await this.publicacionesService.verificarAdmin(usuarioId);

  return usuarioId;
}

}