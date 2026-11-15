import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/service/authservice/authservice';

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

  // Definimos isLoading y errorMessage como signals para la plantilla
  isLoading = signal<boolean>(false);
  errorMessage = signal<string>('');

  loginForm = this.fb.group({
    identificador: ['', [Validators.required]], // correo o nombre de usuario
    password: ['', [Validators.required]]       // contraseña
  });

  async onSubmit(): Promise<void> {
    if (this.loginForm.invalid) return;

    this.isLoading.set(true);
    this.errorMessage.set('');

    try {
      const { identificador, password } = this.loginForm.value;
      
      // Capturamos el resultado del servicio
      const resultado = await this.authService.signIn(identificador!, password!);

      // Si el servicio devolvió un error
      if (resultado.error) {
        this.errorMessage.set(resultado.error.message || 'Usuario o contraseña incorrectos');
        return; 
      }

      // 🔍 Extraemos los datos del interior de 'resultado.data'
      const datos = resultado.data;

      // Guardamos el token en el Local Storage
      if (datos && datos.token) {
        localStorage.setItem('token', datos.token);
      }
      
      localStorage.setItem('sesion_activa', 'true');
      
      // Guardamos el objeto usuario si viene dentro de data
      if (datos && datos.usuario) {
        localStorage.setItem('usuario', JSON.stringify(datos.usuario));
      }

      // Redirigimos al muro de publicaciones
      this.router.navigate(['/publicaciones']);
      
    } catch (err) {
      console.error('Error inesperado al iniciar sesión', err);
      this.errorMessage.set('Ocurrió un error en el servidor');
    } finally {
      this.isLoading.set(false);
    }
  }
}