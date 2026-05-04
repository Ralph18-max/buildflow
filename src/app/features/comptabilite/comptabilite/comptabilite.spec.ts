import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Comptabilite } from './comptabilite';

describe('Comptabilite', () => {
  let component: Comptabilite;
  let fixture: ComponentFixture<Comptabilite>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Comptabilite],
    }).compileComponents();

    fixture = TestBed.createComponent(Comptabilite);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
