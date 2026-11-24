
import {
  Directive,
  Input,
  TemplateRef,
  ViewContainerRef
} from '@angular/core';

@Directive({
  selector: '[appSoloAdmin]',
  standalone: true
})
export class SoloAdmin {

  private vistaCreada = false;

  constructor(
    private templateRef: TemplateRef<unknown>,
    private viewContainer: ViewContainerRef
  ) {}

  @Input()
  set appSoloAdmin(rol: string | null | undefined) {

    if (rol === 'admin' && !this.vistaCreada) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.vistaCreada = true;
    } else if (rol !== 'admin' && this.vistaCreada) {
      this.viewContainer.clear();
      this.vistaCreada = false;
    }
  }
}
