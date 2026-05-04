import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChantierDetail } from './chantier-detail';

describe('ChantierDetail', () => {
  let component: ChantierDetail;
  let fixture: ComponentFixture<ChantierDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChantierDetail],
    }).compileComponents();

    fixture = TestBed.createComponent(ChantierDetail);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
