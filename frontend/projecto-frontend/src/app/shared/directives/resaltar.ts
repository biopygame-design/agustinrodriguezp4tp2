
import {
  Directive,
  ElementRef,
  HostListener,
  Renderer2
} from '@angular/core';

@Directive({
  selector: '[appResaltar]',
  standalone: true
})
export class Resaltar {

  constructor(
    private elemento: ElementRef,
    private renderer: Renderer2
  ) {}

  @HostListener('mouseenter')
  alEntrar(): void {
    this.renderer.setStyle(
      this.elemento.nativeElement,
      'backgroundColor',
      'rgba(212, 175, 55, 0.2)'
    );

    this.renderer.setStyle(
      this.elemento.nativeElement,
      'transition',
      'background-color 0.3s ease'
    );
  }

  @HostListener('mouseleave')
  alSalir(): void {
    this.renderer.removeStyle(
      this.elemento.nativeElement,
      'backgroundColor'
    );
  }
}
