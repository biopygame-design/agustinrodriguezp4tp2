import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);

  // Verificamos si en el localStorage existe el usuario (o el ID) que guardaste al loguearse
  // Por ejemplo, si al hacer login pusiste: localStorage.setItem('usuario', JSON.stringify(res))
  const usuarioActivo = localStorage.getItem('usuario'); 

  if (usuarioActivo) {
    // Si hay datos del usuario, lo dejamos pasar a la ruta privada (como el muro)
    return true;
  } else {
    // Si no hay nada, lo rebotamos al login
    router.navigate(['/login']);
    return false;
  }
};