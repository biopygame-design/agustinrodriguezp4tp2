import { Component, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { AuthService } from '../../../core/service/authservice/authservice';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
export const passwordMatchValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const password = control.get('password');
  const repetirPassword = control.get('repetir_password');
  return password && repetirPassword && password.value !== repetirPassword.value 
    ? { passwordMismatch: true } 
    : null;
};
@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule,CommonModule,ReactiveFormsModule], // 👈 Importante para [formGroup]
  styleUrl: './register.css',
  templateUrl: './register.html',
})
export class Register {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  // Formulario adaptado a los requisitos exactos del Sprint #1
  registerForm = this.fb.group({
    nombre: ['', [Validators.required, Validators.minLength(2)]],
    apellido: ['', [Validators.required, Validators.minLength(2)]],
    correo: ['', [Validators.required, Validators.email]],
    nombre_usuario: ['', [Validators.required, Validators.minLength(3)]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    repetir_password: ['', [Validators.required]], // Mínimo 8 caracteres según PDF
    fecha_nacimiento: ['', [Validators.required]],
    descripcion_breve: ['', [Validators.maxLength(250)]],
    perfil: ['usuario', [Validators.required]],
    rol: ['usuario', Validators.required] // Por defecto usuario
  }, { validators: passwordMatchValidator });

  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  selectedFile: File | null = null; // Para manejar la imagen de perfil

  // Capturar el archivo cuando el usuario lo selecciona en el input type="file"
  onFileSelected(event: any) {
    const file = event.target.files[0];
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

    // Creamos un FormData porque vamos a enviar texto y una imagen al backend
    const formData = new FormData();
    const values = this.registerForm.value;

    formData.append('nombre', values.nombre!);
    formData.append('apellido', values.apellido!);
    formData.append('correo', values.correo!);
    formData.append('nombre_usuario', values.nombre_usuario!);
    formData.append('password', values.password!);
    formData.append('fecha_nacimiento', values.fecha_nacimiento!);
    formData.append('descripcion_breve', values.descripcion_breve || '');
    formData.append('perfil', values.perfil!);

    // Si seleccionó una imagen, la adjuntamos al FormData
    if (this.selectedFile) {
      formData.append('imagen', this.selectedFile);
    }

    try {
      const { data, error } = await this.authService.register(formData);

      if (error) throw error;

      this.successMessage.set('¡Registro exitoso!');
      this.registerForm.reset();
      
      // Redirigir al login tras el registro exitoso
      setTimeout(() => {
        this.router.navigate(['/login']);
      }, 1500);

    } catch (error: any) {
      this.errorMessage.set(error.message || 'Error al registrarse en el servidor');
    } finally {
      this.isLoading.set(false);
    }
    console.log('Estado de los campos del registro:', this.registerForm.controls);
  }
}