import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../core/service/authservice/authservice'; // Ajusta la ruta a tu AuthService si es diferente

@Component({
  selector: 'app-miperfil',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './miperfil.html', // 👈 Apuntando correctamente a tu archivo miperfil.html
  styleUrl: './miperfil.css'
})
export class MiPerfilComponent implements OnInit {
  private authService = inject(AuthService);
  private http = inject(HttpClient);

  // Signals para manejar el estado de forma reactiva
  usuarioData = signal<any>(null);
  ultimasPublicaciones = signal<any[]>([]);
  isLoading = signal<boolean>(true);

  async ngOnInit() {
    // 1. Obtenemos el usuario actual desde el signal del AuthService o desde el localStorage
    const usuarioActual = this.authService.currentUserData() || JSON.parse(localStorage.getItem('usuario') || '{}');
    
    // Verificamos si tiene un ID válido (_id en MongoDB)
    const userId = usuarioActual._id || usuarioActual.id;

    if (userId) {
      await this.cargarDatosPerfil(userId);
    } else {
      console.error('No se encontró un ID de usuario activo en la sesión.');
      this.isLoading.set(false);
    }
  }

  // 2. Método que consume el endpoint /publicaciones/perfil/:id que armamos en NestJS
  async cargarDatosPerfil(id: string) {
    try {
      this.isLoading.set(true);
      
      const response: any = await firstValueFrom(
        this.http.get(`http://localhost:3000/api/publicaciones/perfil/${id}`)
      );

      // Guardamos la info en los signals
      if (response) {
        this.usuarioData.set(response.usuario);
        this.ultimasPublicaciones.set(response.publicaciones);
      }
    } catch (error) {
      console.error('Error al cargar el perfil del usuario:', error);
    } finally {
      this.isLoading.set(false);
    }
  }
}