import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/service/authservice/authservice';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule,RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  // Definimos isLoading y errorMessage como signals para que coincidan con la plantilla
  isLoading = signal<boolean>(false);
  errorMessage = signal<string>('');

 loginForm = this.fb.group({
  identificador: ['', [Validators.required]], // o correo
  password: ['', [Validators.required]]       // o contrasena
});

  async onSubmit(): Promise<void> {
    if (this.loginForm.invalid) return;

    this.isLoading.set(true);
    this.errorMessage.set('');

    try {
      const { identificador, password } = this.loginForm.value;
      
      // Capturamos el resultado del servicio
      const resultado = await this.authService.signIn(identificador!, password!);

      // Si el servicio devolvió un error (credenciales inválidas, etc.)
      if (resultado.error) {
        this.errorMessage.set(resultado.error.message || 'Usuario o contraseña incorrectos');
        return; // 🛑 Detenemos la ejecución aquí para que no navegue
      }
      localStorage.setItem('sesion_activa', 'true');
      this.router.navigate(['/publicaciones']);

      // Si todo salió bien, navegamos al muro
      this.router.navigate(['/publicaciones']);
      
    } catch (err) {
      console.error('Error inesperado al iniciar sesión', err);
      this.errorMessage.set('Ocurrió un error en el servidor');
    } finally {
      this.isLoading.set(false);
    }
  }
}