import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContratDetail } from './contrat-detail';

describe('ContratDetail', () => {
  let component: ContratDetail;
  let fixture: ComponentFixture<ContratDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContratDetail],
    }).compileComponents();

    fixture = TestBed.createComponent(ContratDetail);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
