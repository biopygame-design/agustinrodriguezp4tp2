import { Routes } from '@angular/router';
import { Login } from './features/auth/login/login';
import { Register } from './features/auth/register/register';
import { PublicacionesComponent } from './features/publicaciones/publicaciones';
import { MiPerfilComponent } from './pages/miperfil/miperfil';
import { authGuard } from './core/guards/authguard/authguard';

export const routes: Routes = [
  { path: 'login', component: Login, pathMatch: 'full' },
  { path: 'register', component: Register, pathMatch: 'full' },
  { 
    path: 'publicaciones', 
    component: PublicacionesComponent, 
    pathMatch: 'full', 
    canActivate: [authGuard] 
  },
  // 🚀 NUEVA RUTA CON LAZY LOADING PARA EL DETALLE (recibe el ID por parámetro)
  {
    path: 'publicaciones/:id',
    loadComponent: () => import('./features/detalle-publicacion/detalle-publicacion').then(m => m.DetallePublicacionComponent),
    canActivate: [authGuard]
  },
  { 
    path: 'miperfil', 
    component: MiPerfilComponent, 
    pathMatch: 'full', 
    canActivate: [authGuard] 
  },
  { path: '', redirectTo: 'publicaciones', pathMatch: 'full' }
];