
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component, OnInit, signal } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';

@Component({
  imports: [RouterOutlet, CommonModule],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App implements OnInit {
  protected readonly title = signal('projecto-frontend');

  cargando: boolean = true;
  private sessionTimer: any;

  // URL de Render
  private apiUrl = 'https://agustinrodriguezp4tp2.onrender.com/api/auth';

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit(): void {
    const token = localStorage.getItem('token');

    if (!token) {
      this.cargando = false;
      this.router.navigate(['/login']);
      return;
    }

    // Enviamos el JWT para validar la sesión
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    this.http.post(`${this.apiUrl}/autorizar`, {}, { headers }).subscribe({
      next: (res: any) => {
        console.log('✅ Token válido:', res);
        this.cargando = false;
        this.iniciarTemporizadorSesion();
      },
      error: (err) => {
        console.warn('❌ Token inválido o expirado:', err);
        this.cerrarSesionYIrALogin();
      }
    });
  }

  // 1. Inicia el conteo de 10 minutos
  iniciarTemporizadorSesion() {
    if (this.sessionTimer) clearTimeout(this.sessionTimer);

    this.sessionTimer = setTimeout(() => {
      this.mostrarModalAdvertencia();
    }, 10 * 60 * 1000);
  }

  // 2. Advierte antes del vencimiento
  mostrarModalAdvertencia() {
    const quiereExtender = window.confirm(
      'Tu sesión está por vencer en 5 minutos. ¿Deseás extenderla?'
    );

    if (quiereExtender) {
      const token = localStorage.getItem('token');

      const headers = new HttpHeaders({
        Authorization: `Bearer ${token}`
      });

      this.http.post<any>(
        `${this.apiUrl}/refrescar`,
        {},
        { headers }
      ).subscribe({
        next: (res: any) => {
          const tokenNuevo = res.token || res.data?.token;

          if (tokenNuevo) {
            localStorage.setItem('token', tokenNuevo);
            this.iniciarTemporizadorSesion();
            console.log('🔄 Sesión extendida con éxito');
          } else {
            this.cerrarSesionYIrALogin();
          }
        },
        error: (err) => {
          console.warn('❌ Error al refrescar el token:', err);
          this.cerrarSesionYIrALogin();
        }
      });
    } else {
      this.cerrarSesionYIrALogin();
    }
  }

  // 3. Cierra la sesión
  cerrarSesionYIrALogin() {
    if (this.sessionTimer) clearTimeout(this.sessionTimer);

    localStorage.removeItem('token');
    localStorage.removeItem('usuario');

    this.cargando = false;
    this.router.navigate(['/login']);
  }
}
