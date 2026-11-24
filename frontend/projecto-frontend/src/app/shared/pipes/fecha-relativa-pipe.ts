
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'fechaRelativa',
  standalone: true
})
export class FechaRelativaPipe implements PipeTransform {

  transform(fecha: string | Date | null | undefined): string {
    if (!fecha) return '';

    const fechaPublicacion = new Date(fecha);

    if (isNaN(fechaPublicacion.getTime())) return '';

    const diferencia = Date.now() - fechaPublicacion.getTime();

    if (diferencia < 0) {
      return fechaPublicacion.toLocaleDateString('es-AR');
    }

    const minutos = Math.floor(diferencia / 60000);

    if (minutos < 1) return 'Hace unos segundos';
    if (minutos < 60) return `Hace ${minutos} min`;

    const horas = Math.floor(minutos / 60);

    if (horas < 24) return `Hace ${horas} h`;

    const dias = Math.floor(horas / 24);

    if (dias < 30) return `Hace ${dias} días`;

    return fechaPublicacion.toLocaleDateString('es-AR');
  }
}
