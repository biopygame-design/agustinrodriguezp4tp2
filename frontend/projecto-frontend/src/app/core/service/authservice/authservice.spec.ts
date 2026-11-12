import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Authservice } from './authservice';

describe('Authservice', () => {
  let component: Authservice;
  let fixture: ComponentFixture<Authservice>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Authservice],
    }).compileComponents();

    fixture = TestBed.createComponent(Authservice);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
