
import { Component, inject, signal } from '@angular/core';

import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators
} from '@angular/forms';

import { AuthService } from '../../../core/service/authservice/authservice';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

export const passwordMatchValidator: ValidatorFn = (
  control: AbstractControl
): ValidationErrors | null => {

  const password = control.get('password');
  const repetirPassword = control.get('repetir_password');

  return password && repetirPassword &&
    password.value !== repetirPassword.value
    ? { passwordMismatch: true }
    : null;
};

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink],
  styleUrl: './register.css',
  templateUrl: './register.html',
})
export class Register {

  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  registerForm = this.fb.group({
    nombre: ['', [Validators.required, Validators.minLength(2)]],
    apellido: ['', [Validators.required, Validators.minLength(2)]],
    correo: ['', [Validators.required, Validators.email]],
    nombre_usuario: ['', [Validators.required, Validators.minLength(3)]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    repetir_password: ['', [Validators.required]],
    fecha_nacimiento: ['', [Validators.required]],
    descripcion_breve: ['', [Validators.maxLength(250)]]
  }, { validators: passwordMatchValidator });

  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  selectedFile: File | null = null;

  mostrarError(campo: string): boolean {
    const control = this.registerForm.get(campo);

    return !!control &&
      control.invalid &&
      (control.dirty || control.touched);
  }

  obtenerMensajeError(campo: string): string {
    const control = this.registerForm.get(campo);

    if (!control || !control.errors) return '';

    if (control.errors['required']) {
      return 'Este campo es obligatorio.';
    }

    if (control.errors['email']) {
      return 'Ingresá un correo electrónico válido.';
    }

    if (control.errors['minlength']) {
      const minimo = control.errors['minlength'].requiredLength;
      return `Debe tener al menos ${minimo} caracteres.`;
    }

    if (control.errors['maxlength']) {
      return 'No puede superar los 250 caracteres.';
    }

    return 'El valor ingresado no es válido.';
  }

  mostrarErrorPassword(): boolean {
    const repetir = this.registerForm.get('repetir_password');

    return !!repetir &&
      repetir.value !== '' &&
      !!this.registerForm.errors?.['passwordMismatch'] &&
      (repetir.dirty || repetir.touched);
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (file) {
      this.selectedFile = file;
    }
  }

  async onSubmit() {

    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const formData = new FormData();
    const values = this.registerForm.value;

    formData.append('nombre', values.nombre!);
    formData.append('apellido', values.apellido!);
    formData.append('correo', values.correo!);
    formData.append('nombre_usuario', values.nombre_usuario!);
    formData.append('password', values.password!);
    formData.append('fecha_nacimiento', values.fecha_nacimiento!);
    formData.append('descripcion_breve', values.descripcion_breve || '');

    if (this.selectedFile) {
      formData.append('imagen', this.selectedFile);
    }

    try {

      const { error } = await this.authService.register(formData);

      if (error) throw error;

      const { error: loginError } =
        await this.authService.signIn(
          values.correo!,
          values.password!
        );

      if (loginError) throw loginError;

      this.successMessage.set('¡Registro exitoso!');

      this.registerForm.reset();
      this.selectedFile = null;

      await this.router.navigate(['/publicaciones']);

    } catch (error: any) {

      this.errorMessage.set(
        error.message || 'Error al registrarse en el servidor'
      );

    } finally {
      this.isLoading.set(false);
    }
  }
}
