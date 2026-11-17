import {
  Body,
  Controller,
  HttpCode,
  Post,
  UploadedFile,
  UseInterceptors,
  HttpStatus,
  UseGuards,
  Patch,
  Req,
  Param,
  Get,
} from '@nestjs/common';
import { CreateUsuariosDto } from './dto/create-usuarios.dto/create-usuarios.dto';
import { AuthService } from '../auth/auth.service'; // 👈 Importamos AuthService en vez de UsuariosService
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { AuthGuard } from '../auth/auth-guard';

@Controller('auth')
export class UsuariosController {
  // 👈 Inyectamos AuthService
  constructor(private readonly authService: AuthService) {}

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
    return await this.authService.crear(registroDto, imagenUrl); // 👈 Usamos authService.crear
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: any) {
    const identificador = body.identificador || body.correo || body.email || body.username;
    const password = body.password || body.contrasena || body.clave;

    return await this.authService.login(identificador, password); // 👈 Usamos authService.login
  }

@Patch('perfil')
@UseGuards(AuthGuard)
@UseInterceptors(
  FileInterceptor('imagen', {
    storage: diskStorage({
      destination: './uploads',
      filename: (req, file, callback) => {
        const uniqueSuffix =
          Date.now() + '-' + Math.round(Math.random() * 1e9);

        callback(
          null,
          `${uniqueSuffix}${extname(file.originalname)}`
        );
      }
    })
  })
)
async actualizarPerfil(
  @Req() req: Request,
  @Body() body: any,
  @UploadedFile() file?: Express.Multer.File
) {
  const usuarioId = (req as any).user.sub;

  const imagenUrl = file
    ? `/uploads/${file.filename}`
    : undefined;

  return await this.authService.actualizarPerfil(
    usuarioId,
    body,
    imagenUrl
  );
}

// Listar usuarios (solo administradores)
@Get('usuarios')
@UseGuards(AuthGuard)
async listarUsuarios(@Req() req: any) {
  const adminId = req.user.sub;

  return await this.authService.listarUsuarios(adminId);
}

// Cambiar el rol de un usuario
@Patch('usuarios/:id/rol')
@UseGuards(AuthGuard)
async cambiarRol(
  @Req() req: any,
  @Param('id') id: string,
  @Body('rol') rol: string
) {
  const adminId = req.user.sub;

  return await this.authService.cambiarRol(
    adminId,
    id,
    rol
  );
}


}