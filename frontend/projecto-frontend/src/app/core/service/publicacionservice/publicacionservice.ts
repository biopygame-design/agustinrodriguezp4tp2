import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http'; // 👈 Asegúrate de importar HttpParams
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PublicacionesService {
  private http = inject(HttpClient);
  private apiUrl = 'https://agustinrodriguezp4tp2.onrender.com/api/publicaciones';

  // 👇 Actualizado para recibir el parámetro 'orden' y enviarlo al backend
  listarPublicaciones(orden: string = 'fecha', limit: number = 5, offset: number = 0): Observable<any[]> {
    const params = new HttpParams()
      .set('orden', orden)
      .set('limit', limit.toString())
      .set('offset', offset.toString());

    return this.http.get<any[]>(this.apiUrl, { params });
  }

  crearPublicacion(data: FormData | { titulo: string; descripcion: string; usuario: string }): Observable<any> {
    return this.http.post<any>(this.apiUrl, data);
  }

  toggleLike(postId: string, usuarioId: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${postId}/like`, { usuarioId });
  }

  eliminar(idPublicacion: string, usuarioId: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${idPublicacion}`, {
      body: { usuarioId }
    });
  }
}