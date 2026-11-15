import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, signal } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';

@Component({
  imports: [RouterOutlet,CommonModule],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  protected readonly title = signal('projecto-frontend');

  cargando: boolean = true; // Controla el spinner inicial

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
      },
      error: (err) => {
        console.warn('❌ Token inválido o expirado en el inicio');
        localStorage.clear();
        this.cargando = false;
        this.router.navigate(['/login']);
      }
    });
  }

}

