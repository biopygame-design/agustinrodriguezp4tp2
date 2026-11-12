import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  HttpStatus,
} from '@nestjs/common';
import type { Request } from 'express';
import { CreateUsuariosDto } from './dto/create-usuarios.dto/create-usuarios.dto';
import { UsuariosService } from './usuarios.service';
import { LoginUsuarioDto } from './dto/login-usuario.dto/login-usuario.dto';
import { Throttle } from '@nestjs/throttler';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('auth')
export class UsuariosController {
  // ✅ Declarado correctamente como 'usuariosService' para que coincida en todo el controlador
  constructor(private readonly usuariosService: UsuariosService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor('imagen', { 
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, callback) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          callback(null, `${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  async register(
    @Body() registroDto: CreateUsuariosDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const imagenUrl = file ? `/uploads/${file.filename}` : '';
    return await this.usuariosService.crear(registroDto, imagenUrl);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: any) {
    const identificador = body.identificador || body.correo || body.email || body.username;
    const password = body.password || body.contrasena || body.clave;

    // ✅ Ahora sí usa 'this.usuariosService' correctamente
    return await this.usuariosService.login(identificador, password);
  }
}