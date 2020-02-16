import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CanvasTestComponent } from './canvas-test.component';

describe('CanvasTestComponent', () => {
  let component: CanvasTestComponent;
  let fixture: ComponentFixture<CanvasTestComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CanvasTestComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CanvasTestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
