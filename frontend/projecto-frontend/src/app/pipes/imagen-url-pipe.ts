import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'imagenUrl',
  standalone: true
})
export class ImagenUrlPipe implements PipeTransform {

  private readonly baseUrl = 'https://agustinrodriguezp4tp2.onrender.com';

  transform(
    ruta: string | null | undefined,
    tipo: 'perfil' | 'post' = 'post'
  ): string {

    if (!ruta || ruta.trim() === '') {
      return tipo === 'perfil'
        ? '/assets/default-avatar.png'
        : '';
    }

    if (ruta.startsWith('http')) {
      return ruta;
    }

    if (ruta.startsWith('/uploads/')) {
      return `${this.baseUrl}${ruta}`;
    }

    return `${this.baseUrl}/uploads/${ruta}`;
  }
}