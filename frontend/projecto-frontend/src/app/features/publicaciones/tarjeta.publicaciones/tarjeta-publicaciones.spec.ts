import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TarjetaPublicaciones } from './tarjeta-publicaciones';

describe('TarjetaPublicaciones', () => {
  let component: TarjetaPublicaciones;
  let fixture: ComponentFixture<TarjetaPublicaciones>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TarjetaPublicaciones],
    }).compileComponents();

    fixture = TestBed.createComponent(TarjetaPublicaciones);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
