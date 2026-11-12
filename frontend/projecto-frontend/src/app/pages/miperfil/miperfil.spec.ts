import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Miperfil } from './miperfil';

describe('Miperfil', () => {
  let component: Miperfil;
  let fixture: ComponentFixture<Miperfil>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Miperfil],
    }).compileComponents();

    fixture = TestBed.createComponent(Miperfil);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
