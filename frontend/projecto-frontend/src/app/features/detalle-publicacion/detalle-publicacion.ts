import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { PublicacionesService } from '../../core/service/publicacionservice/publicacionservice';
import { AuthService } from '../../core/service/authservice/authservice';
import { ImagenUrlPipe } from '../../pipes/imagen-url-pipe';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-detalle-publicacion',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, ImagenUrlPipe, RouterLink],
  templateUrl: './detalle-publicacion.html',
  styleUrl: './detalle-publicacion.css'
})
export class DetallePublicacionComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private publicacionesService = inject(PublicacionesService);
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);

  publicacionId: string = '';
  publicacion: any = null;
  comentarios: any[] = [];

  // 🛠️ Variables para la edición de comentarios
  comentarioEditandoId: string | null = null;
  textoEditado: string = '';

  // Paginación de comentarios
  limit: number = 5;
  offset: number = 0;
  hayMasComentarios: boolean = true;

  comentarioForm: FormGroup = this.fb.group({
    texto: ['', [Validators.required]]
  });

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.publicacionId = id;
        this.publicacion = null;
        this.comentarios = [];   
        this.offset = 0;
        this.hayMasComentarios = true;

        this.cargarDetalle();
        this.cargarComentarios();
      }
    });
  }

  cargarDetalle(): void {
    this.publicacionesService.obtenerPorId(this.publicacionId).subscribe({
      next: (data) => {
        this.publicacion = data;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error al cargar publicación:', err)
    });
  }

  cargarComentarios(): void {
    this.publicacionesService.obtenerComentarios(this.publicacionId, this.limit, this.offset).subscribe({
      next: (nuevos: any[]) => {
        if (nuevos.length < this.limit) {
          this.hayMasComentarios = false;
        }
        this.comentarios = [...this.comentarios, ...nuevos];
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error al cargar comentarios:', err)
    });
  }

  cargarMasComentarios(): void {
    this.offset += this.limit;
    this.cargarComentarios();
  }

  enviarComentario(): void {
    if (this.comentarioForm.invalid) return;

    const currentUser = this.authService.currentUserData() as { _id?: string };
    const usuarioId = currentUser?._id;
    if (!usuarioId) return;

    const texto = this.comentarioForm.value.texto;

    this.publicacionesService.agregarComentario(this.publicacionId, usuarioId, texto).subscribe({
      next: (nuevoComentario) => {
  this.comentarios.unshift(nuevoComentario);
  this.offset++;

  this.comentarioForm.reset();
  this.cdr.detectChanges();
},
      error: (err) => console.error('Error al enviar comentario:', err)
    });
  }

  // 🔍 Verifica si el comentario pertenece al usuario logueado actual
  esMiComentario(idCreador: any): boolean {
    if (!idCreador) return false;
    const currentUser = this.authService.currentUserData() as { _id?: string };
    const usuarioId = currentUser?._id;
    
    // Compara el ID del creador (sea objeto o string) con el ID del usuario actual
    const creadorStr = typeof idCreador === 'object' ? idCreador._id : idCreador;
    return creadorStr?.toString() === usuarioId?.toString();
  }

  // ▶️ Activa el modo edición para un comentario
  activarEdicion(c: any): void {
    this.comentarioEditandoId = c._id;
    this.textoEditado = c.texto;
  }

  // ❌ Cancela la edición
  cancelarEdicion(): void {
    this.comentarioEditandoId = null;
    this.textoEditado = '';
  }

  // 💾 Guarda la edición llamando al endpoint PUT del backend
  guardarEdicion(comentarioId: string): void {
    if (!this.textoEditado.trim()) return;

    this.publicacionesService.modificarComentario(this.publicacionId, comentarioId, this.textoEditado).subscribe({
      next: (comentarioActualizado: any) => {
        // Actualizamos el comentario localmente en el array para reflejar los cambios y el "(Editado)"
        const index = this.comentarios.findIndex(c => c._id === comentarioId);
        if (index !== -1) {
          this.comentarios[index] = comentarioActualizado;
        }
        this.cancelarEdicion();
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error al modificar comentario:', err)
    });
  }
}