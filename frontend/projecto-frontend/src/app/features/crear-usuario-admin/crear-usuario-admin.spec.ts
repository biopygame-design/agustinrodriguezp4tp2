import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CrearUsuarioAdmin } from './crear-usuario-admin';

describe('CrearUsuarioAdmin', () => {
  let component: CrearUsuarioAdmin;
  let fixture: ComponentFixture<CrearUsuarioAdmin>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CrearUsuarioAdmin],
    }).compileComponents();

    fixture = TestBed.createComponent(CrearUsuarioAdmin);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
