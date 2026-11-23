
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

  cargando = true;
  mostrarModal = false;
  private sessionTimer: any;
  private expiryTimer: any;

  private apiUrl = 'https://agustinrodriguezp4tp2.onrender.com/api/auth';

  constructor(
    private http: HttpClient,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    this.validarSesion();
  }

  // Validar sesión al iniciar la aplicación
  validarSesion(): void {
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
      next: () => {
        this.cargando = false;
        this.iniciarTemporizadorSesion();
        this.cdr.detectChanges();
      },
      error: () => {
        this.cerrarSesionYIrALogin();
      }
    });
  }

  // Iniciar temporizador
  iniciarTemporizadorSesion(): void {
  if (this.sessionTimer) {
    clearTimeout(this.sessionTimer);
  }

  if (this.expiryTimer) {
    clearTimeout(this.expiryTimer);
  }

  const token = localStorage.getItem('token');

  if (!token) {
    this.cerrarSesionYIrALogin();
    return;
  }

  try {
    // Leer la fecha de vencimiento del JWT
    const payload = JSON.parse(
      atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))
    );

    const tiempoRestante = (payload.exp * 1000) - Date.now();

    if (!payload.exp || tiempoRestante <= 0) {
      this.cerrarSesionYIrALogin();
      return;
    }

    // Mostrar el modal 90 segundos antes del vencimiento
    const tiempoParaModal = Math.max(0, tiempoRestante - 90 * 1000);

    this.sessionTimer = setTimeout(() => {
      this.ngZone.run(() => {
        this.mostrarModal = true;
        this.cdr.detectChanges();
      });
    }, tiempoParaModal);

    // Cerrar la sesión cuando realmente venza el JWT
    this.expiryTimer = setTimeout(() => {
      this.ngZone.run(() => {
        this.cerrarSesionYIrALogin();
      });
    }, tiempoRestante);

  } catch {
    this.cerrarSesionYIrALogin();
  }
}
  // Extender sesión
  extenderSesion(): void {
    const token = localStorage.getItem('token');

    if (!token) {
      this.cerrarSesionYIrALogin();
      return;
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    this.http.post<any>(`${this.apiUrl}/refrescar`, {}, { headers }).subscribe({
      next: (res) => {
        const tokenNuevo = res.token || res.data?.token;

        if (tokenNuevo) {
          localStorage.setItem('token', tokenNuevo);
          this.mostrarModal = false;
          this.iniciarTemporizadorSesion();
          this.cdr.detectChanges();
          console.log('🔄 Sesión extendida correctamente');
        } else {
          this.cerrarSesionYIrALogin();
        }
      },
      error: () => {
        this.cerrarSesionYIrALogin();
      }
    });
  }

  // Cerrar sesión
  cerrarSesionYIrALogin(): void {
  console.log('🚪 Cerrando sesión...');

  if (this.sessionTimer) {
    clearTimeout(this.sessionTimer);
    this.sessionTimer = null;
  }
  if (this.expiryTimer) {
  clearTimeout(this.expiryTimer);
  this.expiryTimer = null;
}

  localStorage.removeItem('token');
  localStorage.removeItem('usuario');
  localStorage.removeItem('sesion_activa');

  this.mostrarModal = false;
  this.cargando = false;

  this.cdr.detectChanges();

  this.router.navigate(['/login'], {
    replaceUrl: true
  }).then((navego) => {
    console.log('Resultado de navegación:', navego);
  });
}
noContinuarSesion(): void {
  // Solamente ocultamos el modal.
  // El token permanece guardado hasta su vencimiento.
  this.mostrarModal = false;
  this.cdr.detectChanges();
}
}
