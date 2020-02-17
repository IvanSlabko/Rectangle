import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';

import {fromEvent, Observable} from 'rxjs';
import {map, takeUntil} from 'rxjs/operators';
import {Rectangle} from '../entities/Rectangle';
import {Point} from '../entities/Point';

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
  NEGATIVE_SIGN = -1;

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
          this.draggable.setPosition(mouseCentredPosition);
          this.intersectChecking();
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
          this.draggable.setPosition(new Point(this.startX, this.startY));
          this.intersectChecking();
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

  isPointIntersect = (dragX1: number, dragX2: number, intersectX3: number, intersectX4: number) => {
    return this.isPointBelongsLine(dragX1, intersectX3, intersectX4) || this.isPointBelongsLine(dragX2, intersectX3, intersectX4) ||
      this.isPointBelongsLine(intersectX3, dragX1, dragX2) || this.isPointBelongsLine(intersectX4, dragX1, dragX2);
  };

  isPointBelongsLine = (pointPosition: number, startLine: number, endLine: number): boolean => {
    return (pointPosition - startLine) * (pointPosition - endLine) < 0;
  };

  intersectChecking = () => {
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

  isInAreaForSnap = (intersect: Rectangle): boolean => {
    const areaStartPoint = new Point(intersect.leftTopPoint.x - this.SNAP_CONST, intersect.leftTopPoint.y - this.SNAP_CONST);
    const areaWidth = intersect.width + this.SNAP_CONST * 2;
    const areaHeight = intersect.height + this.SNAP_CONST * 2;
    const area = new Rectangle(areaStartPoint, areaWidth, areaHeight);
    return this.isIntersectByPoints(this.draggable, area);
  };

  snapRectangles = (direction: string, intersect: Rectangle) => {
    this.clear(this.draggable.leftTopPoint.x, this.draggable.leftTopPoint.y);
    switch (direction) {
      case 'top': {
        this.alignRect(intersect.leftTopPoint.x, intersect.leftTopPoint.y - this.draggable.height,
          intersect.rightTopPoint.x - this.draggable.width, intersect.leftTopPoint.y - this.draggable.height);
        break;
      }
      case 'bottom': {
        this.alignRect(intersect.leftTopPoint.x, intersect.leftBotPoint.y,
          intersect.rightTopPoint.x - this.draggable.width, intersect.leftBotPoint.y);
        break;
      }
      case 'left': {
        this.alignRect(intersect.leftTopPoint.x - this.draggable.width, intersect.leftTopPoint.y,
          intersect.leftTopPoint.x - this.draggable.width, intersect.leftBotPoint.y - this.draggable.height);
        break;
      }
      case 'right': {
        this.alignRect(intersect.rightTopPoint.x, intersect.leftTopPoint.y,
          intersect.rightTopPoint.x, intersect.leftBotPoint.y - this.draggable.height);
        break;
      }
    }
  };

  alignRect = (newX1: number, newY1: number, newX2: number, newY2: number) => {
    if (Math.sign(Math.abs(this.draggable.leftTopPoint.x - newX1 + this.draggable.leftTopPoint.y - newY1) -
      Math.abs(this.draggable.leftTopPoint.x - newX2 + this.draggable.leftTopPoint.y - newY2)) === this.NEGATIVE_SIGN) {
      this.draggable.setPosition(new Point(newX1, newY1));
    } else {
      this.draggable.setPosition(new Point(newX2, newY2));
    }
  };

  getDirectionToSnap = (intersect: Rectangle): string => {
    const obj = {
      left: Math.abs(intersect.leftTopPoint.x - this.draggable.rightTopPoint.x),
      right: Math.abs(intersect.rightTopPoint.x - this.draggable.leftTopPoint.x),
      top: Math.abs(intersect.leftTopPoint.y - this.draggable.leftBotPoint.y),
      bottom: Math.abs(intersect.leftBotPoint.y - this.draggable.leftTopPoint.y)
    };
    return this.getKeyByValue(obj, Math.min(...Object.values(obj)));
  };

  getKeyByValue = (object, value): string => {
    return Object.keys(object).find(key => object[key] === value);
  };

  isRectDraggable = (mousePosition: Point) =>
    this.rects.find((intersect: Rectangle) =>
      mousePosition.x > intersect.leftTopPoint.x && mousePosition.x < intersect.rightTopPoint.x && mousePosition.y > intersect.leftTopPoint.y && mousePosition.y < intersect.leftBotPoint.y);

  addRects = () => {
    this.rects = [
      new Rectangle(new Point(500, 155), 80, 80, '#ff550d'),
      new Rectangle(new Point(500, 255), 80, 80, '#444444'),
      new Rectangle(new Point(500, 355), 280, 80, '#444444'),
      new Rectangle(new Point(500, 455), 80, 380, '#1A2044')
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
