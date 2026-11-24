import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../service/authservice/authservice';

export const adminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const usuario = authService.currentUserData();

  if (!usuario) {
    router.navigate(['/login']);
    return false;
  }

  if (usuario.rol !== 'admin') {
    router.navigate(['/publicaciones']);
    return false;
  }

  return true;
};