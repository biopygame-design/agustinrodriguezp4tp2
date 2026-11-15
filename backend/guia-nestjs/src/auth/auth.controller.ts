import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth-guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  @Post('registro')
  async registro(@Body() body: any) {
    return await this.authService.crear(body);
  }

  // 🔑 Ruta de Login
  @Post('login')
  async login(@Body() body: { correo?: string; identificador?: string; contrasena?: string; password?: string }) {
    const id = body.correo || body.identificador || '';
    const pass = body.contrasena || body.password || '';
    return await this.authService.login(id, pass);
  }

  // 🛡️ Ruta Autorizar: Aquí es donde pega Angular al abrir la app para verificar el token
  @UseGuards(AuthGuard)
  @Post('autorizar')
  async autorizar(@Req() req: Request) {
    return { ok: true, usuario: (req as any).user };
  }

  // 🔄 Ruta Refrescar: Genera un nuevo token de 15 minutos
  @UseGuards(AuthGuard)
  @Post('refrescar')
  async refrescar(@Req() req: Request) {
    return await this.authService.refrescarToken((req as any).user);
  }

}
