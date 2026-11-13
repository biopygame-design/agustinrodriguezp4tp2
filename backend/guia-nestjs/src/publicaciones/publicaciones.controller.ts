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
      // 📂 Configuramos el almacenamiento físico en disco
      storage: diskStorage({
        destination: './uploads', // Carpeta en la raíz de tu proyecto backend
        filename: (req, file, callback) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          callback(null, uniqueSuffix + extname(file.originalname)); // Nombre único con extensión original
        },
      }),
    }),
  )
  async crear(
    @Body() datos: CreatePublicacionDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    console.log('ARCHIVO RECIBIDO:', file); // 👈 Verifica en tu terminal que aquí aparezca el archivo con su filename

    const datosFinales = {
      ...datos,
      // Guardamos únicamente el nombre del archivo generado por multer
      imagen_publicacion: file ? file.filename : null, 
    };

    return await this.publicacionesService.crear(datosFinales);
  }

  @Get('perfil/:id')
  async obtenerPerfil(@Param('id') id: string) {
    return await this.publicacionesService.obtenerPerfilUsuario(id);
  }
  @Post(':id/like')
  async toggleLike(@Param('id') id: string, @Body('usuarioId') usuarioId: string) {
    console.log('🟢 LLEGÓ LIKE - Post ID:', id);
    console.log('🟢 LLEGÓ LIKE - Usuario ID:', usuarioId);
    return await this.publicacionesService.toggleLike(id, usuarioId);
  }

  // 🗑️ 👇 ENDPOINT PARA ELIMINAR UNA PUBLICACIÓN
  @Delete(':id')
  async eliminar(
    @Param('id') id: string, 
    @Body('usuarioId') usuarioId: string
  ) {
    console.log('🗑️ Intentando eliminar Post ID:', id, 'por Usuario ID:', usuarioId);
    return await this.publicacionesService.eliminar(id, usuarioId);
  }
  @Get(':id')
  async obtenerPorId(@Param('id') id: string) {
    return await this.publicacionesService.obtenerPorId(id);
  }

  // 💬 OBTENER COMENTARIOS PAGINADOS DE UNA PUBLICACIÓN
  @Get(':id/comentarios')
  async obtenerComentarios(
    @Param('id') id: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return await this.publicacionesService.obtenerComentarios(id, limit, offset);
  }

  // ✍️ CREAR UN COMENTARIO EN UNA PUBLICACIÓN
  @Post(':id/comentarios')
  async agregarComentario(
    @Param('id') id: string,
    @Body('usuarioId') usuarioId: string,
    @Body('texto') texto: string,
  ) {
    return await this.publicacionesService.agregarComentario(id, usuarioId, texto);
  }
}