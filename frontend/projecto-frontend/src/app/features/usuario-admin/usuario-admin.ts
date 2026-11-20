
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/service/authservice/authservice';
@Component({
  selector: 'app-usuario-admin',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './usuario-admin.html',
  styleUrl: './usuario-admin.css'
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
  // --- DESHABILITAR USUARIO ---
async deshabilitarUsuario(usuario: any) {
  const confirmado = confirm(
    `¿Querés deshabilitar la cuenta de ${usuario.nombre}?`
  );

  if (!confirmado) return;

  try {
    await this.authService.deshabilitarUsuario(usuario._id);
    await this.cargarUsuarios();
    alert('Usuario deshabilitado correctamente.');
  } catch (error: any) {
    console.error('Error al deshabilitar usuario:', error);
    alert(error.error?.message || 'No se pudo deshabilitar el usuario.');
  }
}

// --- REACTIVAR USUARIO ---
async activarUsuario(usuario: any) {
  const confirmado = confirm(
    `¿Querés reactivar la cuenta de ${usuario.nombre}?`
  );

  if (!confirmado) return;

  try {
    await this.authService.activarUsuario(usuario._id);
    await this.cargarUsuarios();
    alert('Usuario reactivado correctamente.');
  } catch (error: any) {
    console.error('Error al reactivar usuario:', error);
    alert(error.error?.message || 'No se pudo reactivar el usuario.');
  }
}
}
