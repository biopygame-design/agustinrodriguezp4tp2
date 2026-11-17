
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException
} from '@nestjs/common';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const usuario = request.user;

    if (!usuario || usuario.rol !== 'admin') {
      throw new ForbiddenException(
        'No tenés permisos de administrador'
      );
    }

    return true;
  }
}
