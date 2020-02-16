import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CanvasAreaComponent } from './canvas-area.component';

describe('CanvasAreaComponent', () => {
  let component: CanvasAreaComponent;
  let fixture: ComponentFixture<CanvasAreaComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CanvasAreaComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CanvasAreaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
