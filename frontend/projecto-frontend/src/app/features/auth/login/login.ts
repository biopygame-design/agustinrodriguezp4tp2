
import { Component, inject, signal, Injector } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/service/authservice/authservice';
import { App } from '../../../app';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private injector = inject(Injector);

  isLoading = signal<boolean>(false);
  errorMessage = signal<string>('');

  loginForm = this.fb.group({
    identificador: ['', [Validators.required]],
    password: ['', [Validators.required]]
  });

  async onSubmit(): Promise<void> {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      this.errorMessage.set(
        'Completá el correo o nombre de usuario y la contraseña.'
      );
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    try {
      const { identificador, password } = this.loginForm.value;

      const resultado = await this.authService.signIn(
        identificador!,
        password!
      );

      if (resultado.error) {
        const error = resultado.error as {
          status?: number;
          message?: string;
        };

        const status = error.status;
        const mensaje = error.message;

        if (status === 401) {
          this.errorMessage.set(
            'El correo, nombre de usuario o contraseña son incorrectos.'
          );
        } else if (status === 403) {
          this.errorMessage.set(
            'Tu cuenta está deshabilitada. Contactá a un administrador.'
          );
        } else if (status === 404) {
          this.errorMessage.set(
            'No se encontró una cuenta con esos datos.'
          );
        } else if (status === 400) {
          this.errorMessage.set(
            mensaje || 'Los datos ingresados no son válidos.'
          );
        } else if (status === 0) {
          this.errorMessage.set(
            'No se pudo conectar con el servidor. Verificá tu conexión.'
          );
        } else if (status && status >= 500) {
          this.errorMessage.set(
            'El servidor tuvo un problema. Intentá nuevamente más tarde.'
          );
        } else {
          this.errorMessage.set(
            mensaje || 'No se pudo iniciar sesión.'
          );
        }

        return;
      }

      const datos = resultado.data;

      if (!datos || !datos.token || !datos.usuario) {
        this.errorMessage.set(
          'El servidor no devolvió los datos necesarios para iniciar sesión.'
        );
        return;
      }

      localStorage.setItem('token', datos.token);
      localStorage.setItem('sesion_activa', 'true');
      localStorage.setItem('usuario', JSON.stringify(datos.usuario));

      await this.router.navigate(['/publicaciones']);

      const app = this.injector.get(App);
      app.validarSesion();

    } catch (err: any) {
      console.error('Error al iniciar sesión:', err);

      this.errorMessage.set(
        err?.message || 'Ocurrió un error inesperado al iniciar sesión.'
      );

    } finally {
      this.isLoading.set(false);
    }
  }
}
