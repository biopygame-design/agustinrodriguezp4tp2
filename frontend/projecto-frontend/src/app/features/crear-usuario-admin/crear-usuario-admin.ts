
import { Component, EventEmitter, Output, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/service/authservice/authservice';

const passwordMatchValidator: ValidatorFn = (
  control: AbstractControl
): ValidationErrors | null => {
  const password = control.get('password');
  const repetir = control.get('repetir_password');

  return password && repetir && password.value !== repetir.value
    ? { passwordMismatch: true }
    : null;
};

@Component({
  selector: 'app-crear-usuario-admin',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './crear-usuario-admin.html',
  styleUrl: './crear-usuario-admin.css'
})
export class CrearUsuarioAdminComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);

  @Output() usuarioCreado = new EventEmitter<void>();
  @Output() cancelar = new EventEmitter<void>();

  isLoading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');

  selectedFile: File | null = null;

  usuarioForm = this.fb.group({
    nombre: ['', [Validators.required, Validators.minLength(2)]],
    apellido: ['', [Validators.required, Validators.minLength(2)]],
    correo: ['', [Validators.required, Validators.email]],
    nombre_usuario: ['', [Validators.required, Validators.minLength(3)]],
    password: ['', [
      Validators.required,
      Validators.minLength(8),
      Validators.pattern(/(?=.*[A-Z])(?=.*\d)/)
    ]],
    repetir_password: ['', Validators.required],
    fecha_nacimiento: ['', Validators.required],
    descripcion_breve: ['', Validators.maxLength(250)],
    rol: ['usuario', Validators.required]
  }, { validators: passwordMatchValidator });

  mostrarError(campo: string): boolean {
    const control = this.usuarioForm.get(campo);

    return !!control &&
      control.invalid &&
      (control.dirty || control.touched);
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    this.selectedFile = input.files?.[0] || null;
  }

  async onSubmit() {
    if (this.usuarioForm.invalid) {
      this.usuarioForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    const values = this.usuarioForm.value;
    const formData = new FormData();

    formData.append('nombre', values.nombre!);
    formData.append('apellido', values.apellido!);
    formData.append('correo', values.correo!);
    formData.append('nombre_usuario', values.nombre_usuario!);

    // El DTO de NestJS espera "contrasena".
    formData.append('contrasena', values.password!);

    formData.append('fecha_nacimiento', values.fecha_nacimiento!);
    formData.append('descripcion_breve', values.descripcion_breve || '');
    formData.append('rol', values.rol!);

    if (this.selectedFile) {
      formData.append('imagen', this.selectedFile);
    }

    try {
      await this.authService.crearUsuarioAdmin(formData);

      this.successMessage.set('Usuario creado correctamente.');
      this.usuarioForm.reset({ rol: 'usuario' });
      this.selectedFile = null;

      this.usuarioCreado.emit();

    } catch (error: any) {
      console.error('Error al crear usuario:', error);

      const mensaje = error.error?.message || error.message;
      this.errorMessage.set(
        Array.isArray(mensaje)
          ? mensaje.join(', ')
          : mensaje || 'No se pudo crear el usuario.'
      );

    } finally {
      this.isLoading.set(false);
    }
  }
}
