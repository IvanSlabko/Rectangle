import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';

import {fromEvent, Observable} from 'rxjs';
import {filter, map, takeUntil} from 'rxjs/operators';
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
  NEGATIVE_SIGN = -1;
  DEFAULT_X_POSITION = 30;
  DEFAULT_Y_POSITION = 30;
  DISTANCE_BETWEEN_RECTS = 20;

  ngOnInit(): void {
    this.initCanvas();
    this.initRects();
    this.draw();
    this.initStreams();
  }

  initCanvas = () => {
    this.canvasElement = this.canvas.nativeElement;
    this.canvasElement.width = document.body.clientWidth;
    this.canvasElement.height = document.body.clientHeight;
    this.ctx = this.canvas.nativeElement.getContext('2d');
    this.boundingClient = this.canvas.nativeElement.getBoundingClientRect();
  }

  initRects = () => {
    this.rects = [
      new Rectangle(80, 80, '#ff550d'),
      new Rectangle(80, 180, '#444444'),
      new Rectangle(280, 80, '#444444'),
      new Rectangle(80, 280, '#1A2044')
    ];
    this.setDefaultPosition();
  };

  initStreams() {
    this.mouseMove$ = fromEvent(this.canvasElement, 'mousemove');
    this.mouseDown$ = fromEvent(this.canvasElement, 'mousedown');
    this.mouseUp$ = fromEvent(this.canvasElement, 'mouseup');
    this.mouseOut$ = fromEvent(this.canvasElement, 'mouseout');
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
      this.initDraggableRect(mouseDownValue.mousePosition);
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
    this.mouseUp$
      .pipe(
        filter(() => !!this.draggable)
      )
      .subscribe(this.onMouseUp);
  }

  onMouseUp = () => {
    this.snapShapes();
    this.clear(this.draggable.leftTopPoint.x, this.draggable.leftTopPoint.y);
    if (this.isRectIntersecting) {
      this.draggable.setPosition(new Point(this.startX, this.startY));
      this.intersectChecking();
    }
    this.draw();
  };

  setInfoBeforeDrag = () => {
    this.startX = this.draggable.leftTopPoint.x;
    this.startY = this.draggable.leftTopPoint.y;
  };

  intersectChecking = () => {
    this.draggable.currentColor = this.draggable.defaultColor;
    this.isRectIntersecting = false;
    this.rects.forEach((rect: Rectangle) => {
      if (rect.isIntersectByPoints(this.draggable)) {
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
      if (rect.isInAreaForSnap(this.draggable)) {
        const direction = rect.getDirectionToSnap(this.draggable);
        this.snapRectangles(direction, rect);
      }
    }
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

  initDraggableRect = (mousePosition: Point) => {
    this.draggable = this.rects.find((rect: Rectangle) => rect.isPointInRectArea(mousePosition));
  };

  setDefaultPosition = () => {
    this.rects.forEach((rect: Rectangle) => {
      this.DEFAULT_Y_POSITION += this.DISTANCE_BETWEEN_RECTS;
      rect.setPosition(new Point(this.DEFAULT_X_POSITION, this.DEFAULT_Y_POSITION));
      this.DEFAULT_Y_POSITION += rect.height;
    });
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
