
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  const token = localStorage.getItem('token');

  console.log('🔍 INTERCEPTOR EJECUTADO:', req.url);
  console.log('🔑 TOKEN ENCONTRADO:', !!token);
  console.log('📤 ENVIANDO AUTH:', !!token);

  let clonedReq = req;

  if (token) {
    clonedReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(clonedReq).pipe(
    catchError((error: HttpErrorResponse) => {
      const esRutaAuth =
        req.url.includes('/auth/login') ||
        req.url.includes('/auth/register') ||
        req.url.includes('/auth/refrescar');

      if (error.status === 401 && !esRutaAuth) {
        console.warn('⚠️ Token rechazado por el servidor.');

        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
        localStorage.removeItem('sesion_activa');

        router.navigate(['/login'], {
          replaceUrl: true
        });
      }

      return throwError(() => error);
    })
  );
};
