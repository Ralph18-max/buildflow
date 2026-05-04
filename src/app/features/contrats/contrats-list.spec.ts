import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContratsList } from './contrats-list';

describe('ContratsList', () => {
  let component: ContratsList;
  let fixture: ComponentFixture<ContratsList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContratsList],
    }).compileComponents();

    fixture = TestBed.createComponent(ContratsList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
