import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TerrainPointage } from './terrain-pointage';

describe('TerrainPointage', () => {
  let component: TerrainPointage;
  let fixture: ComponentFixture<TerrainPointage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TerrainPointage],
    }).compileComponents();

    fixture = TestBed.createComponent(TerrainPointage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
