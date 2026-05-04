import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FacturationList } from './facturation-list';

describe('FacturationList', () => {
  let component: FacturationList;
  let fixture: ComponentFixture<FacturationList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FacturationList],
    }).compileComponents();

    fixture = TestBed.createComponent(FacturationList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
