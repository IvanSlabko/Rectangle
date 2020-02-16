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
  intersect: Rectangle;
  dragable: Rectangle;
  startX: number;
  startY: number;
  startColor: string;
  COLOR: string;
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
        map((e: MouseEvent) => ({
          shiftX: e.clientX - this.boundingClient.left,
          shiftY: e.clientY - this.boundingClient.top,
          pageX: e.pageX,
          pageY: e.pageY,
        })),
        takeUntil(this.mouseUp$),
        takeUntil(this.mouseOut$)
      );
    const mouseDownEvent$ = this.mouseDown$
      .pipe(
        map((e: MouseEvent) => ({
          shiftX: e.clientX - this.boundingClient.left,
          shiftY: e.clientY - this.boundingClient.top,
        }))
      );
    mouseDownEvent$.subscribe((mouseDownValue) => {
      this.dragable = this.isRectangleDrag(mouseDownValue.shiftX, mouseDownValue.shiftY);
      if (this.dragable) {
        this.startX = this.dragable.leftTopPoint.x;
        this.startY = this.dragable.leftTopPoint.y;
        const SHIFT_X = (this.dragable.leftTopPoint.x - mouseDownValue.shiftX);
        const SHIFT_Y = (this.dragable.leftTopPoint.y - mouseDownValue.shiftY);
        this.startColor = this.dragable.color;
        mouseMoveEvent$.subscribe((mouseMoveValue) => {
          const startX = this.dragable.leftTopPoint.x;
          const startY = this.dragable.leftTopPoint.y;
          const mousePosition = new Point(mouseMoveValue.shiftX + SHIFT_X, mouseMoveValue.shiftY + SHIFT_Y);
          this.dragable.setLeftTopPoint(mousePosition);
          this.intersectValidation(this.startColor);
          this.clear(startX, startY);
          this.draw();
          console.log(this.dragable.leftTopPoint, this.dragable.rightBotPoint);
        });
      }
    });
    const mouseUpEvent$ = this.mouseUp$;
    mouseUpEvent$.subscribe(() => {
      if (this.dragable) {
        this.snapShapes();
        this.clear(this.dragable.leftTopPoint.x, this.dragable.leftTopPoint.y);
        if (this.isRectIntersecting) {
          this.intersect.color = this.COLOR;
          this.dragable.setLeftTopPoint(new Point(this.startX, this.startY));
          this.dragable.color = this.startColor;
        }
        this.draw();
      }
    });
  }

  isIntersectByPoints = (draggable: Rectangle, area: Rectangle): boolean => {
    const x1y1 = this.isPointIntersect(draggable.leftTopPoint, area.leftBotPoint, area.rightTopPoint);
    const x2y1 = this.isPointIntersect(draggable.rightTopPoint, area.leftBotPoint, area.rightTopPoint);
    const x1y2 = this.isPointIntersect(draggable.leftBotPoint, area.leftBotPoint, area.rightTopPoint);
    const x2y2 = this.isPointIntersect(draggable.rightBotPoint, area.leftBotPoint, area.rightTopPoint);
    const ix1y1 = this.isPointIntersect(area.leftTopPoint, draggable.leftBotPoint, draggable.rightTopPoint);
    const ix2y1 = this.isPointIntersect(area.rightTopPoint, draggable.leftBotPoint, draggable.rightTopPoint);
    const ix1y2 = this.isPointIntersect(area.leftBotPoint, draggable.leftBotPoint, draggable.rightTopPoint);
    const ix2y2 = this.isPointIntersect(area.rightBotPoint, draggable.leftBotPoint, draggable.rightTopPoint);
    return x1y1 || x1y2 || x2y1 || x2y2 || ix1y1 || ix1y2 || ix2y1 || ix2y2;
  }

  isPointIntersect = (draggable: Point, leftBotPoint: Point, rightTopPoint: Point): boolean => {
    return draggable.x > leftBotPoint.x && draggable.x < rightTopPoint.x && draggable.y > rightTopPoint.y && draggable.y < leftBotPoint.y;
  }


  intersectValidation = (startColor: string) => {
    const intersectRect: Rectangle = this.rects.find((i: Rectangle) => (this.isIntersectByPoints(this.dragable, i)));
    this.changeColor(intersectRect, startColor);
  }

  snapShapes = () => {
    const filter = this.rects.filter(rect => rect !== this.dragable);
    for (const i of filter) {
      if (this.isInAreaForSnap(i)) {
        const direction = this.getDirectionToSnap(i);
        this.snapRectangles(direction, i);
      }
    }
  }

  isInAreaForSnap = (i: Rectangle): boolean => {
    const areaStartPoint = new Point(i.leftTopPoint.x - this.SNAP_CONST, i.leftTopPoint.y - this.SNAP_CONST);
    const areaWidth = i.width + this.SNAP_CONST * 2;
    const areaHeight = i.height + this.SNAP_CONST * 2;
    const area = new Rectangle(areaStartPoint, areaWidth, areaHeight);
    return this.isIntersectByPoints(this.dragable, area);
  }

  snapRectangles = (direction: string, i: Rectangle) => {
    this.clear(this.dragable.leftTopPoint.x, this.dragable.leftTopPoint.y);
    switch (direction) {
      case 'top': {
        if (this.getDistanceBetweenPoints(i.leftTopPoint.x, this.dragable.rightTopPoint.x) < this.getDistanceBetweenPoints(i.rightTopPoint.x, this.dragable.leftTopPoint.x)) {
          this.dragable.setLeftTopPoint(new Point(i.leftTopPoint.x, i.leftTopPoint.y - this.dragable.height));
        } else {
          this.dragable.setLeftTopPoint(new Point(i.rightTopPoint.x - this.dragable.width, i.leftTopPoint.y - this.dragable.height));
        }
        break;
      }
      case 'bottom': {
        if (this.getDistanceBetweenPoints(i.leftTopPoint.x, this.dragable.rightTopPoint.x) < this.getDistanceBetweenPoints(i.rightTopPoint.x, this.dragable.leftTopPoint.x)) {
          this.dragable.setLeftTopPoint(new Point(i.leftTopPoint.x, i.leftBotPoint.y));
        } else {
          this.dragable.setLeftTopPoint(new Point(i.rightTopPoint.x - this.dragable.width, i.leftBotPoint.y));
        }
        break;
      }
      case 'left': {
        if (this.getDistanceBetweenPoints(i.leftTopPoint.y, this.dragable.leftBotPoint.y) < this.getDistanceBetweenPoints(i.leftBotPoint.y, this.dragable.leftTopPoint.y)) {
          this.dragable.setLeftTopPoint(new Point(i.leftTopPoint.x - this.dragable.width, i.leftTopPoint.y));
        } else {
          this.dragable.setLeftTopPoint(new Point(i.leftTopPoint.x - this.dragable.width, i.leftBotPoint.y - this.dragable.height));
        }
        break;
      }
      case 'right': {
        if (this.getDistanceBetweenPoints(i.leftTopPoint.y, this.dragable.leftBotPoint.y) < this.getDistanceBetweenPoints(i.leftBotPoint.y, this.dragable.leftTopPoint.y)) {
          this.dragable.setLeftTopPoint(new Point(i.rightTopPoint.x, i.leftTopPoint.y));
        } else {
          this.dragable.setLeftTopPoint(new Point(i.rightTopPoint.x, i.leftBotPoint.y - this.dragable.height));
        }
        break;
      }
    }
  }

  // setDiractionForSnapped = (first: number, second: number, third: number, fourth: number) => {
  //   if (this.getDistanceBetweenPoints(first, second) < this.getDistanceBetweenPoints(third, fourth)) {
  //     this.dragable.setLeftTopPoint(new Point(i.rightTopPoint.x, first));
  //   } else {
  //     this.dragable.setLeftTopPoint(new Point(i.rightTopPoint.x, third - this.dragable.height));
  //   }
  // }

  getDirectionToSnap = (i: Rectangle): string => {
    const obj = {
      left: this.getDistanceBetweenPoints(i.leftTopPoint.x, this.dragable.rightTopPoint.x),
      right: this.getDistanceBetweenPoints(i.rightTopPoint.x, this.dragable.leftTopPoint.x),
      top: this.getDistanceBetweenPoints(i.leftTopPoint.y, this.dragable.leftBotPoint.y),
      bottom: this.getDistanceBetweenPoints(i.leftBotPoint.y, this.dragable.leftTopPoint.y)
    };
    const min = Math.min(...Object.values(obj));
    return this.getKeyByValue(obj, min);
  }

  getKeyByValue = (object, value): string => {
    return Object.keys(object).find(key => object[key] === value);
  }

  getDistanceBetweenPoints = (draggablePoint: number, intersectablePoint: number): number => {
    return Math.abs(draggablePoint - intersectablePoint);
  }

  changeColor = (intersectRect: Rectangle, startColor: string) => {
    if (this.intersect) {
      this.intersect.color = this.COLOR;
    }
    if (intersectRect) {
      this.COLOR = intersectRect.color;
      this.dragable.color = this.WARNING_COLOR;
      intersectRect.color = this.WARNING_COLOR;
      this.isRectIntersecting = true;
    } else {
      this.dragable.color = startColor;
      this.isRectIntersecting = false;
    }
    this.intersect = intersectRect;
  }

  isRectangleDrag = (offsetX: number, offsetY: number) =>
    this.rects.find((i: Rectangle) => offsetX > i.leftTopPoint.x && offsetX < i.rightTopPoint.x && offsetY > i.leftTopPoint.y && offsetY < i.leftBotPoint.y)

  addRects = () => {
    this.rects.push(new Rectangle(new Point(500, 355), 80, 80, '#ff550d'));
    this.rects.push(new Rectangle(new Point(500, 155), 80, 80, '#444444'));
  }

  drawRect = (r: Rectangle) => {
    this.ctx.beginPath();
    this.ctx.fillStyle = r.color;
    this.ctx.fillRect(r.leftTopPoint.x, r.leftTopPoint.y, r.width, r.height);
    this.ctx.closePath();
  }

  clear(x: number, y: number) {
    this.ctx.clearRect(x, y, this.dragable.width, this.dragable.height);
  }

  draw = () => {
    this.rects.forEach(r => this.drawRect(r));
  }

}
