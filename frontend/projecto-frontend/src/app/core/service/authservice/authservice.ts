import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  
  // URL base de tu backend en NestJS
  private apiUrl = 'http://localhost:3000/api/auth'; 

  // Signals para manejar el estado igual que en tu código anterior
  currentUserData = signal<any | null>(null);

  constructor() {
    this.initAuthSession();
  }

  // Al arrancar, recupera el usuario si quedó guardado en el navegador
  private initAuthSession() {
    const savedUser = localStorage.getItem('usuario');
    if (savedUser) {
      this.currentUserData.set(JSON.parse(savedUser));
    }
  }

  // --- REGISTRO ---
  async register(formData: FormData) {
    try {
      const response: any = await firstValueFrom(
        this.http.post(`${this.apiUrl}/register`, formData)
      );
      return { data: response, error: null };
    } catch (error: any) {
      return { data: null, error: error.error || { message: 'Error al registrarse en el servidor' } };
    }
  }

  // --- LOGIN ---
// --- LOGIN ---
async signIn(identificador: string, password: string) {
  try {
    const response: any = await firstValueFrom(
      this.http.post(`${this.apiUrl}/login`, { identificador, password })
    );

    // Si el login es exitoso
    if (response && response.usuario) {
      this.currentUserData.set(response.usuario);
      localStorage.setItem('usuario', JSON.stringify(response.usuario));
    }

    return { data: response, error: null };
  } catch (error: any) {
    // 🛡️ AQUÍ ESTÁ LA CLAVE: Capturamos el error HTTP que manda NestJS
    console.error('❌ Error en el login:', error);
    
    // Extraemos el mensaje que envía NestJS (ej. 'Credenciales inválidas')
    const errorMessage = error.error?.message || 'Usuario o contraseña incorrectos';

    return { 
      data: null, 
      error: { message: errorMessage } 
    };
  }
}

  // --- LOGOUT ---
  async signOut() {
    localStorage.removeItem('usuario');
    this.currentUserData.set(null);
  }
}
