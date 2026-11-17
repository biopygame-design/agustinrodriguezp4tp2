import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UsuarioAdmin } from './usuario-admin';

describe('UsuarioAdmin', () => {
  let component: UsuarioAdmin;
  let fixture: ComponentFixture<UsuarioAdmin>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UsuarioAdmin],
    }).compileComponents();

    fixture = TestBed.createComponent(UsuarioAdmin);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
