
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'textoCorto',
  standalone: true
})
export class TextoCortoPipe implements PipeTransform {

  transform(
    texto: string | null | undefined,
    limite: number = 100
  ): string {

    if (!texto) return '';

    if (limite <= 0) return '';

    if (texto.length <= limite) return texto;

    return texto.substring(0, limite).trimEnd() + '...';
  }
}
