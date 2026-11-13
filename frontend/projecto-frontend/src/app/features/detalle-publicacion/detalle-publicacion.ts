import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { PublicacionesService } from '../../core/service/publicacionservice/publicacionservice';
import { AuthService } from '../../core/service/authservice/authservice';

@Component({
  selector: 'app-detalle-publicacion',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './detalle-publicacion.html',
  styleUrl: './detalle-publicacion.css'
})
export class DetallePublicacionComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private publicacionesService = inject(PublicacionesService);
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);

  publicacionId: string = '';
  publicacion: any = null;
  comentarios: any[] = [];

  // Paginación de comentarios
  limit: number = 5;
  offset: number = 0;
  hayMasComentarios: boolean = true;

  comentarioForm: FormGroup = this.fb.group({
    texto: ['', [Validators.required]]
  });

  ngOnInit(): void {
    this.publicacionId = this.route.snapshot.paramMap.get('id') || '';
    if (this.publicacionId) {
      this.cargarDetalle();
      this.cargarComentarios();
    }
  }

  cargarDetalle(): void {
    this.publicacionesService.obtenerPorId(this.publicacionId).subscribe({
      next: (data) => { this.publicacion = data; },
      error: (err) => console.error('Error al cargar la publicación:', err)
    });
  }

  cargarComentarios(): void {
    this.publicacionesService.obtenerComentarios(this.publicacionId, this.limit, this.offset).subscribe({
      next: (nuevos: any[]) => {
        if (nuevos.length < this.limit) {
          this.hayMasComentarios = false; // Se acabaron los comentarios
        }
        // 🔑 ACUMULADOR: Junta los anteriores con los nuevos sin pisar nada
        this.comentarios = [...this.comentarios, ...nuevos];
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
        // Inserta el nuevo comentario arriba de todo al instante
        this.comentarios.unshift(nuevoComentario);
        this.comentarioForm.reset();
      },
      error: (err) => console.error('Error al enviar comentario:', err)
    });
  }
}