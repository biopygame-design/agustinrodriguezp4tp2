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

  // 🔍 Obtener una publicación individual por ID (para verla en grande)
  obtenerPorId(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  // 💬 Obtener comentarios paginados de una publicación específica
  obtenerComentarios(postId: string, limit: number = 5, offset: number = 0): Observable<any[]> {
    const params = new HttpParams()
      .set('limit', limit.toString())
      .set('offset', offset.toString());

    return this.http.get<any[]>(`${this.apiUrl}/${postId}/comentarios`, { params });
  }

  // ✍️ Enviar un nuevo comentario
  agregarComentario(postId: string, usuarioId: string, texto: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${postId}/comentarios`, { usuarioId, texto });
  }

  // ✏️ NUEVO: Modificar un comentario existente (PUT) enviando el token en los headers
  modificarComentario(postId: string, comentarioId: string, texto: string): Observable<any> {
  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  return this.http.put<any>(`${this.apiUrl}/${postId}/comentarios/${comentarioId}`, { texto }, { headers });
}

  // ➕ Crear publicación
  crearPublicacion(data: FormData | { titulo: string; descripcion: string; usuario: string }): Observable<any> {
    return this.http.post<any>(this.apiUrl, data);
  }

  // ❤️ Dar o quitar Like
  
agregarLike(postId: string, usuarioId: string): Observable<any> {
  return this.http.post<any>(`${this.apiUrl}/${postId}/like`, {
    usuarioId
  });
}

eliminarLike(postId: string, usuarioId: string): Observable<any> {
  return this.http.delete<any>(`${this.apiUrl}/${postId}/like`, {
    body: { usuarioId }
  });
}


  // 🗑️ Eliminar (baja lógica)
  eliminar(idPublicacion: string, usuarioId: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${idPublicacion}`, {
      body: { usuarioId }
    });
  }

  // 🗑️ Eliminar un comentario (DELETE) enviando el token JWT
  eliminarComentario(postId: string, comentarioId: string): Observable<any> {
    const token = localStorage.getItem('token');

    const headers = {
      Authorization: `Bearer ${token}`
    };

    return this.http.delete<any>(
      `${this.apiUrl}/${postId}/comentarios/${comentarioId}`,
      { headers }
    );
  }
    // 📊 PUBLICACIONES POR USUARIO
  obtenerPublicacionesPorUsuario(fechaInicio: string, fechaFin: string): Observable<any> {
    const token = localStorage.getItem('token');

    const headers = {
      Authorization: `Bearer ${token}`
    };

    const params = new HttpParams()
      .set('fechaInicio', fechaInicio)
      .set('fechaFin', fechaFin);

    return this.http.get<any>(
      `${this.apiUrl}/estadisticas/publicaciones-por-usuario`,
      { headers, params }
    );
  }

  // 📊 CANTIDAD TOTAL DE COMENTARIOS
  obtenerCantidadComentarios(fechaInicio: string, fechaFin: string): Observable<any> {
    const token = localStorage.getItem('token');

    const headers = {
      Authorization: `Bearer ${token}`
    };

    const params = new HttpParams()
      .set('fechaInicio', fechaInicio)
      .set('fechaFin', fechaFin);

    return this.http.get<any>(
      `${this.apiUrl}/estadisticas/cantidad-comentarios`,
      { headers, params }
    );
  }

  // 📊 COMENTARIOS POR PUBLICACIÓN
  obtenerComentariosPorPublicacion(fechaInicio: string, fechaFin: string): Observable<any> {
    const token = localStorage.getItem('token');

    const headers = {
      Authorization: `Bearer ${token}`
    };

    const params = new HttpParams()
      .set('fechaInicio', fechaInicio)
      .set('fechaFin', fechaFin);

    return this.http.get<any>(
      `${this.apiUrl}/estadisticas/comentarios-por-publicacion`,
      { headers, params }
    );
  }

}