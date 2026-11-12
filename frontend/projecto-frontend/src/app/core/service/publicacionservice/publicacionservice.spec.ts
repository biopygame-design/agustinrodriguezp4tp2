import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Publicacionservice } from './publicacionservice';

describe('Publicacionservice', () => {
  let component: Publicacionservice;
  let fixture: ComponentFixture<Publicacionservice>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Publicacionservice],
    }).compileComponents();

    fixture = TestBed.createComponent(Publicacionservice);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
