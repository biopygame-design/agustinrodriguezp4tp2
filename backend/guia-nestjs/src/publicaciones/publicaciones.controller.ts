import { Body, Controller, Get, Param, Post, UseInterceptors, UploadedFile, Delete, Query } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { PublicacionesService } from './publicaciones.service';
import { CreatePublicacionDto } from './dto/create-publicacion.dto/create-publicacion.dto';

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
}