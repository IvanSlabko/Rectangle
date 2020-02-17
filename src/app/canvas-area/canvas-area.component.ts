import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';

import {fromEvent, Observable} from 'rxjs';
import {map, takeUntil} from 'rxjs/operators';
import {Rectangle} from '../rectangle/Rectangle';
import {Point} from './Point';
import {Line} from './Line';

@Component({
  selector: 'app-canvas-area',
  templateUrl: './canvas-area.component.html',
  styleUrls: ['./canvas-area.component.scss']
})

export class CanvasAreaComponent implements OnInit {
  @ViewChild('canvas', {static: true})
  canvas: ElementRef<HTMLCanvasElement>;
  ctx: CanvasRenderingContext2D;
  canvasElement: HTMLCanvasElement;
  boundingClient: DOMRect;
  rects = [];
  mouseDown$: Observable<Event>;
  mouseMove$: Observable<Event>;
  mouseUp$: Observable<Event>;
  mouseOut$: Observable<Event>;
  draggable: Rectangle;
  startX: number;
  startY: number;
  isRectIntersecting: boolean;
  WARNING_COLOR = 'red';
  SNAP_CONST = 10;

  ngOnInit(): void {
    this.canvasElement = this.canvas.nativeElement;
    this.canvasElement.width = document.body.clientWidth;
    this.canvasElement.height = document.body.clientHeight;
    this.ctx = this.canvas.nativeElement.getContext('2d');
    this.boundingClient = this.canvas.nativeElement.getBoundingClientRect();
    this.mouseMove$ = fromEvent(this.canvasElement, 'mousemove');
    this.mouseDown$ = fromEvent(this.canvasElement, 'mousedown');
    this.mouseUp$ = fromEvent(this.canvasElement, 'mouseup');
    this.mouseOut$ = fromEvent(this.canvasElement, 'mouseout');
    this.addRects();
    this.draw();
    this.initStream();
  }

  initStream() {
    const mouseMoveEvent$ = this.mouseMove$
      .pipe(
        map((event: MouseEvent) => ({
          mousePosition: new Point(event.clientX - this.boundingClient.left, event.clientY - this.boundingClient.top),
        })),
        takeUntil(this.mouseUp$),
        takeUntil(this.mouseOut$)
      );
    const mouseDownEvent$ = this.mouseDown$
      .pipe(
        map((event: MouseEvent) => ({
          mousePosition: new Point(event.clientX - this.boundingClient.left, event.clientY - this.boundingClient.top),
        }))
      );
    mouseDownEvent$.subscribe((mouseDownValue) => {
      this.draggable = this.isRectDraggable(mouseDownValue.mousePosition);
      if (this.draggable) {
        this.setInfoBeforeDrag();
        const mouseOffsetX = (this.draggable.leftTopPoint.x - mouseDownValue.mousePosition.x);
        const mouseOffsetY = (this.draggable.leftTopPoint.y - mouseDownValue.mousePosition.y);
        mouseMoveEvent$.subscribe((mouseMoveValue) => {
          const mouseCentredPosition = new Point(mouseMoveValue.mousePosition.x + mouseOffsetX, mouseMoveValue.mousePosition.y + mouseOffsetY);
          this.clear(this.draggable.leftTopPoint.x, this.draggable.leftTopPoint.y);
          this.draggable.setPoints(mouseCentredPosition);
          this.intersectValidation();
          this.draw();
        });
      }
    });
    this.initMouseUpStream();
  }

  initMouseUpStream() {
    const mouseUpEvent$ = this.mouseUp$;
    mouseUpEvent$.subscribe(() => {
      if (this.draggable) {
        this.snapShapes();
        this.clear(this.draggable.leftTopPoint.x, this.draggable.leftTopPoint.y);
        if (this.isRectIntersecting) {
          this.draggable.setPoints(new Point(this.startX, this.startY));
          this.intersectValidation();
        }
        this.draw();
      }
    });
  }

  setInfoBeforeDrag = () => {
    this.startX = this.draggable.leftTopPoint.x;
    this.startY = this.draggable.leftTopPoint.y;
  };

  isIntersectByPoints = (draggable: Rectangle, intersect: Rectangle): boolean => {
    return this.isPointIntersect(draggable.leftTopPoint.x, draggable.rightTopPoint.x, intersect.leftTopPoint.x, intersect.rightTopPoint.x)
      && this.isPointIntersect(draggable.leftTopPoint.y, draggable.rightBotPoint.y, intersect.leftTopPoint.y, intersect.rightBotPoint.y);
  };

  isPointIntersect = (x1: number, x2: number, x3: number, x4: number) => {
    return ((x1 - x3) * (x1 - x4) < 0 || (x2 - x3) * (x2 - x4) < 0 || (x3 - x1) * (x3 - x2) < 0 || (x4 - x1) * (x4 - x2) < 0);
  };

  intersectValidation = () => {
    this.draggable.currentColor = this.draggable.defaultColor;
    this.isRectIntersecting = false;
    this.rects.forEach((rect: Rectangle) => {
      if (this.isIntersectByPoints(this.draggable, rect)) {
        this.isRectIntersecting = true;
        rect.currentColor = this.WARNING_COLOR;
        this.draggable.currentColor = this.WARNING_COLOR;
      } else if (this.draggable !== rect) {
        rect.currentColor = rect.defaultColor;
      }
    });
  };

  snapShapes = () => {
    const filterRects = this.rects.filter(rect => rect !== this.draggable);
    for (const rect of filterRects) {
      if (this.isInAreaForSnap(rect)) {
        const direction = this.getDirectionToSnap(rect);
        this.snapRectangles(direction, rect);
      }
    }
  };

  isInAreaForSnap = (i: Rectangle): boolean => {
    const areaStartPoint = new Point(i.leftTopPoint.x - this.SNAP_CONST, i.leftTopPoint.y - this.SNAP_CONST);
    const areaWidth = i.width + this.SNAP_CONST * 2;
    const areaHeight = i.height + this.SNAP_CONST * 2;
    const area = new Rectangle(areaStartPoint, areaWidth, areaHeight);
    return this.isIntersectByPoints(this.draggable, area);
  };

  snapRectangles = (direction: string, i: Rectangle) => {
    this.clear(this.draggable.leftTopPoint.x, this.draggable.leftTopPoint.y);
    switch (direction) {
      case 'top': {
        if (Math.abs(i.leftTopPoint.x - this.draggable.rightTopPoint.x) < Math.abs(i.rightTopPoint.x - this.draggable.leftTopPoint.x)) {
          this.draggable.setPoints(new Point(i.leftTopPoint.x, i.leftTopPoint.y - this.draggable.height));
        } else {
          this.draggable.setPoints(new Point(i.rightTopPoint.x - this.draggable.width, i.leftTopPoint.y - this.draggable.height));
        }
        break;
      }
      case 'bottom': {
        if (Math.abs(i.leftTopPoint.x - this.draggable.rightTopPoint.x) < Math.abs(i.rightTopPoint.x - this.draggable.leftTopPoint.x)) {
          this.draggable.setPoints(new Point(i.leftTopPoint.x, i.leftBotPoint.y));
        } else {
          this.draggable.setPoints(new Point(i.rightTopPoint.x - this.draggable.width, i.leftBotPoint.y));
        }
        break;
      }
      case 'left': {
        if (Math.abs(i.leftTopPoint.y - this.draggable.leftBotPoint.y) < Math.abs(i.leftBotPoint.y - this.draggable.leftTopPoint.y)) {
          this.draggable.setPoints(new Point(i.leftTopPoint.x - this.draggable.width, i.leftTopPoint.y));
        } else {
          this.draggable.setPoints(new Point(i.leftTopPoint.x - this.draggable.width, i.leftBotPoint.y - this.draggable.height));
        }
        break;
      }
      case 'right': {
        if (Math.abs(i.leftTopPoint.y - this.draggable.leftBotPoint.y) < Math.abs(i.leftBotPoint.y - this.draggable.leftTopPoint.y)) {
          this.draggable.setPoints(new Point(i.rightTopPoint.x, i.leftTopPoint.y));
        } else {
          this.draggable.setPoints(new Point(i.rightTopPoint.x, i.leftBotPoint.y - this.draggable.height));
        }
        break;
      }
    }
  };

  getDirectionToSnap = (i: Rectangle): string => {
    const obj = {
      left: Math.abs(i.leftTopPoint.x - this.draggable.rightTopPoint.x),
      right: Math.abs(i.rightTopPoint.x - this.draggable.leftTopPoint.x),
      top: Math.abs(i.leftTopPoint.y - this.draggable.leftBotPoint.y),
      bottom: Math.abs(i.leftBotPoint.y - this.draggable.leftTopPoint.y)
    };
    return this.getKeyByValue(obj, Math.min(...Object.values(obj)));
  };

  getKeyByValue = (object, value): string => {
    return Object.keys(object).find(key => object[key] === value);
  };

  isRectDraggable = (mousePosition: Point) =>
    this.rects.find((i: Rectangle) =>
      mousePosition.x > i.leftTopPoint.x && mousePosition.x < i.rightTopPoint.x && mousePosition.y > i.leftTopPoint.y && mousePosition.y < i.leftBotPoint.y);

  addRects = () => {
    this.rects = [
      new Rectangle(new Point(500, 355), 80, 80, '#ff550d'),
      new Rectangle(new Point(500, 455), 80, 80, '#444444'),
      new Rectangle(new Point(500, 155), 280, 80, '#444444'),
      new Rectangle(new Point(600, 255), 80, 380, '#1A2044')
    ];
  };

  drawRect = (rect: Rectangle) => {
    this.ctx.beginPath();
    this.ctx.fillStyle = rect.currentColor;
    this.ctx.fillRect(rect.leftTopPoint.x, rect.leftTopPoint.y, rect.width, rect.height);
    this.ctx.closePath();
  };

  clear(x: number, y: number) {
    this.ctx.clearRect(x, y, this.draggable.width, this.draggable.height);
  }

  draw = () => {
    this.rects.forEach(rect => this.drawRect(rect));
  };

}
