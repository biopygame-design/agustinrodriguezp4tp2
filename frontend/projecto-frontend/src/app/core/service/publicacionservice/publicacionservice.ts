import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PublicacionesService {
  private http = inject(HttpClient);
  private apiUrl = 'https://agustinrodriguezp4tp2.onrender.com/api/publicaciones';

  // 📄 Listar publicaciones con paginación y orden
  listarPublicaciones(orden: string = 'fecha', limit: number = 5, offset: number = 0): Observable<any[]> {
    const params = new HttpParams()
      .set('orden', orden)
      .set('limit', limit.toString())
      .set('offset', offset.toString());

    return this.http.get<any[]>(this.apiUrl, { params });
  }

  // 🔍 NUEVO: Obtener una publicación individual por ID (para verla en grande)
  obtenerPorId(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  // 💬 NUEVO: Obtener comentarios paginados de una publicación específica
  obtenerComentarios(postId: string, limit: number = 5, offset: number = 0): Observable<any[]> {
    const params = new HttpParams()
      .set('limit', limit.toString())
      .set('offset', offset.toString());

    return this.http.get<any[]>(`${this.apiUrl}/${postId}/comentarios`, { params });
  }

  // ✍️ NUEVO: Enviar un nuevo comentario
  agregarComentario(postId: string, usuarioId: string, texto: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${postId}/comentarios`, { usuarioId, texto });
  }

  // ➕ Crear publicación
  crearPublicacion(data: FormData | { titulo: string; descripcion: string; usuario: string }): Observable<any> {
    return this.http.post<any>(this.apiUrl, data);
  }

  // ❤️ Dar o quitar Like
  toggleLike(postId: string, usuarioId: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${postId}/like`, { usuarioId });
  }

  // 🗑️ Eliminar (baja lógica)
  eliminar(idPublicacion: string, usuarioId: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${idPublicacion}`, {
      body: { usuarioId }
    });
  }
}