
import { Routes } from '@angular/router';
import { Login } from './features/auth/login/login';
import { Register } from './features/auth/register/register';
import { PublicacionesComponent } from './features/publicaciones/publicaciones';
import { MiPerfilComponent } from './pages/miperfil/miperfil';
import { authGuard } from './core/guards/authguard/authguard';
import { CrearUsuarioAdminComponent } from './features/crear-usuario-admin/crear-usuario-admin';
import { Estadisticas } from './features/estadisticas/estadisticas';

export const routes: Routes = [
  { path: 'login', component: Login, pathMatch: 'full' },
  { path: 'register', component: Register, pathMatch: 'full' },

  {
    path: 'publicaciones',
    component: PublicacionesComponent,
    pathMatch: 'full',
    canActivate: [authGuard]
  },
  {
    path: 'publicaciones/:id',
    loadComponent: () =>
      import('./features/detalle-publicacion/detalle-publicacion')
        .then(m => m.DetallePublicacionComponent),
    canActivate: [authGuard]
  },
  {
    path: 'miperfil',
    component: MiPerfilComponent,
    pathMatch: 'full',
    canActivate: [authGuard]
  },
  {
    path: 'admin/usuarios',
    loadComponent: () =>
      import('./features/usuario-admin/usuario-admin')
        .then(m => m.UsuariosAdminComponent),
    canActivate: [authGuard]
  },

  { path: '', redirectTo: 'publicaciones', pathMatch: 'full' },
  {
  path: 'admin/crear-usuario',
  loadComponent: () =>
    import('./features/crear-usuario-admin/crear-usuario-admin')
      .then(m => m.CrearUsuarioAdminComponent),
  canActivate: [authGuard]
},
{
  path: 'admin/estadisticas',
  loadComponent: () =>
    import('./features/estadisticas/estadisticas')
      .then(m => m.Estadisticas),
  canActivate: [authGuard]
},

];

