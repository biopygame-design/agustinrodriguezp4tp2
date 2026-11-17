
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/service/authservice/authservice';
@Component({
  selector: 'app-usuarios-admin',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './usuarios-admin.html',
  styleUrl: './usuarios-admin.css'
})
export class UsuariosAdminComponent implements OnInit {

  private authService = inject(AuthService);

  usuarios = signal<any[]>([]);
  cargando = signal(false);
  error = signal('');

  ngOnInit() {
    this.cargarUsuarios();
  }

  async cargarUsuarios() {
    this.cargando.set(true);
    this.error.set('');

    try {
      const respuesta: any = await this.authService.listarUsuarios();
      this.usuarios.set(respuesta);
    } catch (error: any) {
      console.error('Error al cargar usuarios:', error);
      this.error.set(
        error.error?.message || 'No se pudieron cargar los usuarios.'
      );
    } finally {
      this.cargando.set(false);
    }
  }

  async cambiarRol(usuario: any) {
    const nuevoRol = usuario.rol === 'admin' ? 'usuario' : 'admin';

    const confirmado = confirm(
      `¿Querés cambiar el rol de ${usuario.nombre} a ${nuevoRol}?`
    );

    if (!confirmado) return;

    try {
      await this.authService.cambiarRol(usuario._id, nuevoRol);
      await this.cargarUsuarios();
      alert('Rol actualizado correctamente.');
    } catch (error: any) {
      console.error('Error al cambiar rol:', error);
      alert(error.error?.message || 'No se pudo cambiar el rol.');
    }
  }
}
