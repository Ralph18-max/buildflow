import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FactureDetail } from './facture-detail';

describe('FactureDetail', () => {
  let component: FactureDetail;
  let fixture: ComponentFixture<FactureDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FactureDetail],
    }).compileComponents();

    fixture = TestBed.createComponent(FactureDetail);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
