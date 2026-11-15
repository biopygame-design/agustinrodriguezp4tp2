import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
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

  cargando: boolean = true; // Controla el spinner inicial
  private sessionTimer: any; // ⏱️ Control del temporizador de sesión

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit(): void {
    const token = localStorage.getItem('token');
    
    if (!token) {
      this.cargando = false;
      this.router.navigate(['/login']);
      return;
    }

    // Validamos el token contra la ruta autorizar del backend
    this.http.post('http://localhost:3000/auth/autorizar', {}).subscribe({
      next: (res: any) => {
        console.log('✅ Token válido:', res);
        this.cargando = false;
        // 🚀 Arrancamos el contador de 10 minutos al validar la sesión exitosamente
        this.iniciarTemporizadorSesion();
      },
      error: (err) => {
        console.warn('❌ Token inválido o expirado en el inicio');
        this.cerrarSesionYIrALogin();
      }
    });
  }

  // 1️⃣ Inicia el conteo de 10 minutos (600,000 ms)
  iniciarTemporizadorSesion() {
    if (this.sessionTimer) clearTimeout(this.sessionTimer);

    this.sessionTimer = setTimeout(() => {
      this.mostrarModalAdvertencia();
    }, 10 * 60 * 1000);
  }

  // 2️⃣ Muestra el aviso a los 10 minutos y pregunta si desea extender
  mostrarModalAdvertencia() {
    const quiereExtender = window.confirm('Tu sesión está por vencer en 5 minutos. ¿Deseás extenderla?');

    if (quiereExtender) {
      // Llamamos al backend para refrescar el token
      this.http.post<any>('http://localhost:3000/auth/refrescar', {}).subscribe({
        next: (res: any) => {
          const tokenNuevo = res.token || res.data?.token;
          if (tokenNuevo) {
            localStorage.setItem('token', tokenNuevo);
            // Reiniciamos el contador por otros 10 minutos
            this.iniciarTemporizadorSesion();
            console.log('🔄 Sesión extendida con éxito');
          }
        },
        error: (err) => {
          console.warn('❌ Error al refrescar el token');
          this.cerrarSesionYIrALogin();
        }
      });
    } else {
      this.cerrarSesionYIrALogin();
    }
  }

  // 3️⃣ Limpia todo y redirige al login
  cerrarSesionYIrALogin() {
    if (this.sessionTimer) clearTimeout(this.sessionTimer);
    localStorage.clear();
    this.cargando = false;
    this.router.navigate(['/login']);
  }
}