import { Component, inject, input, output } from '@angular/core';
import { PublicacionesService } from '../../../core/service/publicacionservice/publicacionservice';
import { AuthService } from '../../../core/service/authservice/authservice';
import { DatePipe } from '@angular/common';
import { ImagenUrlPipe } from '../../../pipes/imagen-url-pipe';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-tarjeta-publicaciones',
  standalone: true,
  imports: [DatePipe,ImagenUrlPipe,RouterLink],
  styleUrl: './tarjeta-publicaciones.css',
  templateUrl: './tarjeta-publicaciones.html',
})
export class TarjetaPublicaciones {
  post = input.required<any>();
  refresh = output<void>();

  private publicacionesService = inject(PublicacionesService);
  private authService = inject(AuthService);

  // 👇 Valida si el usuario actual es el creador O si es administrador
  puedeEliminar(): boolean {
    let currentUser = this.authService.currentUserData() as { _id?: string; id?: string; rol?: string };
    
    if (!currentUser) {
      const savedUser = localStorage.getItem('usuario');
      if (savedUser) {
        try {
          currentUser = JSON.parse(savedUser);
        } catch (e) {
          console.error('Error al parsear el usuario del localStorage', e);
        }
      }
    }
    console.log('🔍 USUARIO ACTUAL DETECTADO:', currentUser)

    const usuarioId = currentUser?._id || currentUser?.id;
    const rol = currentUser?.rol;
    
    const esAdmin = rol === 'admin' || rol === 'administrador';

    const postObj = this.post();
    const postUserId = postObj?.usuario?._id || postObj?.usuario;

    const esDueño = Boolean(usuarioId && postUserId && usuarioId === postUserId);

    return esAdmin || esDueño;
  }

  darLike(): void {
    let currentUser = this.authService.currentUserData() as { _id?: string; id?: string };
    
    if (!currentUser) {
      const savedUser = localStorage.getItem('usuario');
      if (savedUser) {
        try {
          currentUser = JSON.parse(savedUser);
        } catch (e) {
          console.error('Error al parsear el usuario del localStorage', e);
        }
      }
    }

    const usuarioId = currentUser?._id || currentUser?.id;
    if (!usuarioId) return;

    const postId = this.post()._id || this.post().id;

    this.publicacionesService.toggleLike(postId, usuarioId).subscribe({
      next: () => this.refresh.emit(),
      error: (err) => console.error('❌ Error HTTP al dar like:', err)
    });
  }

  eliminar(): void {
    let currentUser = this.authService.currentUserData() as { _id?: string; id?: string };
    
    if (!currentUser) {
      const savedUser = localStorage.getItem('usuario');
      if (savedUser) {
        try {
          currentUser = JSON.parse(savedUser);
        } catch (e) {
          console.error('Error al parsear el usuario', e);
        }
      }
    }

    const usuarioId = currentUser?._id || currentUser?.id;
    if (!usuarioId) return;

    const postId = this.post()._id || this.post().id;

    // 👇 Pasamos el ID del usuario actual al servicio para que el backend valide el rol
    this.publicacionesService.eliminar(postId, usuarioId).subscribe({
      next: () => this.refresh.emit(),
      error: (err) => console.error('Error al eliminar:', err)
    });
  }
}