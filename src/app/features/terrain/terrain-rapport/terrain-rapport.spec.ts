import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TerrainRapport } from './terrain-rapport';

describe('TerrainRapport', () => {
  let component: TerrainRapport;
  let fixture: ComponentFixture<TerrainRapport>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TerrainRapport],
    }).compileComponents();

    fixture = TestBed.createComponent(TerrainRapport);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
