import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/service/authservice/authservice';
import { PublicacionesService } from '../../core/service/publicacionservice/publicacionservice';
import { TarjetaPublicaciones } from './tarjeta.publicaciones/tarjeta-publicaciones';

@Component({
  selector: 'app-publicaciones',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, TarjetaPublicaciones],
  templateUrl: './publicaciones.html',
  styleUrl: './publicaciones.css'
})
export class PublicacionesComponent implements OnInit {
  authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private publicacionesService = inject(PublicacionesService);
  private cdr = inject(ChangeDetectorRef);

  posts: any[] = [];
  selectedFile: File | null = null;
  ordenActual: string = 'fecha'; // Criterio de orden seleccionado

  // 📄 Variables para la paginación
  limit: number = 5;   // Cantidad de publicaciones por página
  offset: number = 0;  // Desplazamiento inicial

  postForm: FormGroup = this.fb.group({
    titulo: ['', [Validators.required]],
    descripcion: ['', [Validators.required]]
  });

  ngOnInit(): void {
    this.cargarPublicaciones();
  }

  // 👈 Carga las publicaciones enviando el orden, limit y offset al servicio
  cargarPublicaciones = (): void => {
    this.publicacionesService.listarPublicaciones(this.ordenActual, this.limit, this.offset).subscribe({
      next: (data: any[]) => { 
        this.posts = data; 
        this.cdr.detectChanges(); 
      },
      error: (err: any) => { console.error('Error al cargar publicaciones:', err); }
    });
  }

  // 🔄 Cambiar el criterio de orden (reinicia el offset a 0)
  cambiarOrden(nuevoOrden: string): void {
    this.ordenActual = nuevoOrden; 
    this.offset = 0; // Volvemos a la primera página al cambiar el filtro
    console.log('🔄 Orden seleccionado en frontend:', this.ordenActual);
    this.cargarPublicaciones(); 
  }

  // ➡️ Ir a la página siguiente
  paginaSiguiente(): void {
    if (this.posts.length < this.limit) return; // Si trae menos del límite, no hay más páginas
    this.offset += this.limit;
    this.cargarPublicaciones();
  }

  // ⬅️ Ir a la página anterior
  paginaAnterior(): void {
    if (this.offset <= 0) return;
    this.offset -= this.limit;
    if (this.offset < 0) this.offset = 0;
    this.cargarPublicaciones();
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) { this.selectedFile = file; }
  }

  esPublicacionPropia(post: any): boolean {
    const currentUser = this.authService.currentUserData() as { _id?: string };
    const usuarioId = currentUser?._id;
    const postUserId = post.usuario?._id || post.usuario;
    return usuarioId === postUserId;
  }

  async onLogout(): Promise<void> {
    await this.authService.signOut();
    this.router.navigate(['/login']);
  }

  crearPublicacion(): void {
    if (this.postForm.invalid) return;

    const currentUser = this.authService.currentUserData() as { _id?: string };
    const usuarioId = currentUser?._id;
    if (!usuarioId) return;

    const formData = new FormData();
    formData.append('titulo', this.postForm.value.titulo);
    formData.append('descripcion', this.postForm.value.descripcion);
    formData.append('usuario', usuarioId);

    if (this.selectedFile) {
      formData.append('imagen', this.selectedFile);
    }

    this.publicacionesService.crearPublicacion(formData).subscribe({
      next: () => {
        this.postForm.reset();
        this.selectedFile = null;
        this.offset = 0; // Reiniciamos al principio para ver la nueva publicación creada
        this.cargarPublicaciones(); 
        this.cdr.detectChanges(); 
      },
      error: (err: any) => { console.error('Error al crear:', err); }
    });
  }
}