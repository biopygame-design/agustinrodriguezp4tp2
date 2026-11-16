
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';


import { AuthService } from '../../core/service/authservice/authservice';
import { ImagenUrlPipe } from '../../pipes/imagen-url-pipe';

@Component({
  selector: 'app-miperfil',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ImagenUrlPipe,
    ReactiveFormsModule
  ],
  templateUrl: './miperfil.html',
  styleUrl: './miperfil.css'
})
export class MiPerfilComponent implements OnInit {

  private authService = inject(AuthService);
  private http = inject(HttpClient);
  private fb = inject(FormBuilder);

  usuarioData = signal<any>(null);
  ultimasPublicaciones = signal<any[]>([]);
  isLoading = signal<boolean>(true);

  modoEdicion = signal<boolean>(false);
  guardando = signal<boolean>(false);
  mensajeError = signal<string>('');
  mensajeExito = signal<string>('');

  imagenSeleccionada: File | null = null;

  perfilForm = this.fb.group({
    nombre: ['', [Validators.required, Validators.minLength(2)]],
    apellido: ['', [Validators.required, Validators.minLength(2)]],
    correo: ['', [Validators.required, Validators.email]],
    nombre_usuario: ['', [Validators.required, Validators.minLength(3)]],
    fecha_nacimiento: [''],
    descripcion_breve: ['', [Validators.maxLength(250)]]
  });

  async ngOnInit() {
    const usuarioActual =
      this.authService.currentUserData() ||
      JSON.parse(localStorage.getItem('usuario') || '{}');

    const userId = usuarioActual._id || usuarioActual.id;

    if (userId) {
      await this.cargarDatosPerfil(userId);
    } else {
      this.isLoading.set(false);
    }
  }

  async cargarDatosPerfil(id: string) {
    try {
      this.isLoading.set(true);

      const response: any = await firstValueFrom(
        this.http.get(
          `https://agustinrodriguezp4tp2.onrender.com/api/publicaciones/perfil/${id}`
        )
      );

      if (response) {
        this.usuarioData.set(response.usuario);
        this.ultimasPublicaciones.set(response.publicaciones || []);
      }

    } catch (error) {
      console.error('Error al cargar perfil:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  abrirEdicion() {
    const user = this.usuarioData();

    if (!user) return;

    this.perfilForm.patchValue({
      nombre: user.nombre || '',
      apellido: user.apellido || '',
      correo: user.correo || '',
      nombre_usuario: user.nombre_usuario || '',
      fecha_nacimiento: user.fecha_nacimiento
  ? String(user.fecha_nacimiento).substring(0, 10)
  : '',
      descripcion_breve: user.descripcion_breve || ''
    });

    this.mensajeError.set('');
    this.mensajeExito.set('');
    this.imagenSeleccionada = null;

    this.modoEdicion.set(true);
  }

  cancelarEdicion() {
    this.modoEdicion.set(false);
    this.imagenSeleccionada = null;
    this.mensajeError.set('');
  }

  seleccionarImagen(event: Event) {
    const input = event.target as HTMLInputElement;

    if (input.files && input.files.length > 0) {
      const archivo = input.files[0];

      if (!archivo.type.startsWith('image/')) {
        this.mensajeError.set('Seleccioná un archivo de imagen válido.');
        input.value = '';
        return;
      }

      this.imagenSeleccionada = archivo;
      this.mensajeError.set('');
    }
  }

  async guardarCambios() {
    if (this.perfilForm.invalid) {
      this.perfilForm.markAllAsTouched();
      return;
    }

    this.guardando.set(true);
    this.mensajeError.set('');
    this.mensajeExito.set('');

    try {
      const formData = new FormData();

      Object.entries(this.perfilForm.getRawValue()).forEach(
        ([campo, valor]) => {
          formData.append(campo, valor || '');
        }
      );

      if (this.imagenSeleccionada) {
        formData.append('imagen', this.imagenSeleccionada);
      }

      const response: any =
        await this.authService.actualizarPerfil(formData);

      if (response.usuario) {
        this.usuarioData.set(response.usuario);

        this.authService.currentUserData.set(response.usuario);

        localStorage.setItem(
          'usuario',
          JSON.stringify(response.usuario)
        );
      }

      this.modoEdicion.set(false);
      this.imagenSeleccionada = null;
      this.mensajeExito.set('¡Perfil actualizado correctamente!');

    } catch (error: any) {
      console.error('Error al actualizar perfil:', error);

      const mensaje = error.error?.message;

      this.mensajeError.set(
        Array.isArray(mensaje)
          ? mensaje.join(', ')
          : mensaje || 'No se pudo actualizar el perfil.'
      );

    } finally {
      this.guardando.set(false);
    }
  }
}
