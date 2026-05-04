import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChantiersList } from './chantiers-list';

describe('ChantiersList', () => {
  let component: ChantiersList;
  let fixture: ComponentFixture<ChantiersList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChantiersList],
    }).compileComponents();

    fixture = TestBed.createComponent(ChantiersList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
