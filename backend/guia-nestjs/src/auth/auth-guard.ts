import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('No se proporcionó el token de autenticación');
    }

    try {
      // Verifica el token con la misma clave secreta que usas en tu JwtModule
      const payload = await this.jwtService.verifyAsync(token, {
        secret: 'TU_CLAVE_SECRETA_SUPER_SEGURA', // Asegúrate de usar la misma clave que pusiste en tu AuthModule
      });
      
      // Adjuntamos el usuario decodificado al request para usarlo en el controlador
      (request as any).user = payload;
    } catch {
      throw new UnauthorizedException('Token inválido o expirado');
    }

    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}