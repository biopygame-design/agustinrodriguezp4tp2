import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component, OnInit, signal, ChangeDetectorRef, NgZone } from '@angular/core';
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
  mostrarModal: boolean = false; // 👈 Controla el modal personalizado en tu app.html
  private sessionTimer: any;

  private apiUrl = 'https://agustinrodriguezp4tp2.onrender.com/api/auth';

  constructor(
    private http: HttpClient,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone // 👈 Necesario para asegurar que Angular redibuje el modal al saltar el timer
  ) {}

  ngOnInit(): void {
    const token = localStorage.getItem('token');

    if (!token) {
      this.cargando = false;
      this.router.navigate(['/login']);
      return;
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    this.http.post(`${this.apiUrl}/autorizar`, {}, { headers }).subscribe({
      next: (res: any) => {
        console.log('✅ Token válido:', res);
        this.cargando = false;
        this.cdr.detectChanges();
        this.iniciarTemporizadorSesion();
      },
      error: (err) => {
        console.warn('❌ Token inválido o expirado:', err);
        this.cerrarSesionYIrALogin();
      }
    });
  }

  // 1. Inicia el conteo (90 segundos = avisa 30s antes de los 2 minutos)
  iniciarTemporizadorSesion() {
    if (this.sessionTimer) clearTimeout(this.sessionTimer);

    this.sessionTimer = setTimeout(() => {
      this.ngZone.run(() => {
        console.log('⏰ Faltan 30 segundos para que venza la sesión. Mostrando modal...');
        this.mostrarModal = true;
        this.cdr.detectChanges();
      });
    }, 90 * 1000);
  }

  // 2. Se ejecuta al hacer clic en "Sí, extender" dentro del modal HTML
  extenderSesion() {
    this.mostrarModal = false;
    const token = localStorage.getItem('token');

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    this.http.post<any>(`${this.apiUrl}/refrescar`, {}, { headers }).subscribe({
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
  }

  // 3. Cierra la sesión (y oculta el modal si estaba abierto)
  cerrarSesionYIrALogin() {
    if (this.sessionTimer) clearTimeout(this.sessionTimer);

    localStorage.removeItem('token');
    localStorage.removeItem('usuario');

    this.mostrarModal = false;
    this.cargando = false;
    this.cdr.detectChanges();
    this.router.navigate(['/login']);
  }
}