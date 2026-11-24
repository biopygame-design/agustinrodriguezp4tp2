import { Injectable, signal, inject } from '@angular/core';

import { firstValueFrom } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  
  // URL base de tu backend en NestJS
  private apiUrl = 'https://agustinrodriguezp4tp2.onrender.com/api/auth'; 

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
      this.http.post(`${this.apiUrl}/login`, {
        identificador,
        password
      })
    );

    if (response && response.usuario) {
      this.currentUserData.set(response.usuario);

      localStorage.setItem(
        'usuario',
        JSON.stringify(response.usuario)
      );

      localStorage.setItem('token', response.token);
    }

    return {
      data: response,
      error: null
    };

  } catch (error: any) {
    console.error('Error en el login:', error);

    return {
      data: null,
      error: {
        status: error.status,
        message: error.error?.message || 'Error inesperado al iniciar sesión'
      }
    };
  }
}


  // --- LOGOUT ---
  async signOut() {
  localStorage.removeItem('usuario');
  localStorage.removeItem('token');
  localStorage.removeItem('sesion_activa');
  this.currentUserData.set(null);
}
 
async actualizarPerfil(formData: FormData) {
  const token = localStorage.getItem('token');

  if (!token) {
    throw new Error('No se encontró el token de autenticación');
  }

  console.log('🔐 Actualizando perfil. Token encontrado:', !!token);

  const headers = new HttpHeaders({
    Authorization: `Bearer ${token}`
  });

  return await firstValueFrom(
    this.http.patch(
      `${this.apiUrl}/perfil`,
      formData,
      { headers }
    )
  );
}
// --- LISTAR USUARIOS (SOLO ADMIN) ---
async listarUsuarios() {
  const token = localStorage.getItem('token');

  if (!token) {
    throw new Error('No se encontró el token de autenticación');
  }

  const headers = new HttpHeaders({
    Authorization: `Bearer ${token}`
  });

  return await firstValueFrom(
    this.http.get(`${this.apiUrl}/usuarios`, { headers })
  );
}

// --- CAMBIAR ROL DE USUARIO (SOLO ADMIN) ---
async cambiarRol(usuarioId: string, rol: string) {
  const token = localStorage.getItem('token');

  if (!token) {
    throw new Error('No se encontró el token de autenticación');
  }

  const headers = new HttpHeaders({
    Authorization: `Bearer ${token}`
  });

  return await firstValueFrom(
    this.http.patch(
      `${this.apiUrl}/usuarios/${usuarioId}/rol`,
      { rol },
      { headers }
    )
  );
}
async crearUsuarioAdmin(formData: FormData) {
  const token = localStorage.getItem('token');

  if (!token) {
    throw new Error('No se encontró el token de autenticación');
  }

  const headers = new HttpHeaders({
    Authorization: `Bearer ${token}`
  });

  return await firstValueFrom(
    this.http.post(
      `${this.apiUrl}/usuarios`,
      formData,
      { headers }
    )
  );
}
// --- DESHABILITAR USUARIO (SOLO ADMIN) ---
async deshabilitarUsuario(usuarioId: string) {
  const token = localStorage.getItem('token');

  if (!token) {
    throw new Error('No se encontró el token de autenticación');
  }

  const headers = new HttpHeaders({
    Authorization: `Bearer ${token}`
  });

  return await firstValueFrom(
    this.http.delete(
      `${this.apiUrl}/usuarios/${usuarioId}`,
      { headers }
    )
  );
}

// --- REACTIVAR USUARIO (SOLO ADMIN) ---
async activarUsuario(usuarioId: string) {
  const token = localStorage.getItem('token');

  if (!token) {
    throw new Error('No se encontró el token de autenticación');
  }

  const headers = new HttpHeaders({
    Authorization: `Bearer ${token}`
  });

  return await firstValueFrom(
    this.http.post(
      `${this.apiUrl}/usuarios/${usuarioId}/activar`,
      {},
      { headers }
    )
  );
}

}
