import {Point} from './Point';

export class Rectangle {
  public leftTopPoint: Point;
  public leftBotPoint: Point;
  public rightTopPoint: Point;
  public rightBotPoint: Point;
  public currentColor: string;
  SNAP_DISTANCE = 10;

  constructor(public width?: number, public height?: number,
              public defaultColor?: string) {
    this.leftTopPoint = new Point();
    this.rightTopPoint = new Point();
    this.leftBotPoint = new Point();
    this.rightBotPoint = new Point();
    this.currentColor = defaultColor;
  }

  setPosition = (newPoint: Point) => {
    this.leftTopPoint = newPoint;
    this.rightTopPoint.x = newPoint.x + this.width;
    this.rightTopPoint.y = newPoint.y;
    this.leftBotPoint.x = newPoint.x;
    this.leftBotPoint.y = newPoint.y + this.height;
    this.rightBotPoint.x = newPoint.x + this.width;
    this.rightBotPoint.y = newPoint.y + this.height;
  };

  shiftPosition = (x: number, y: number) => this.setPosition(new Point(this.leftTopPoint.x + x, this.leftTopPoint.y + y));

  isIntersectByPoints = (draggable: Rectangle): boolean => {
    const point = new Point();
    return point.isPointIntersect(draggable.leftTopPoint.x, draggable.rightTopPoint.x, this.leftTopPoint.x, this.rightTopPoint.x)
      && point.isPointIntersect(draggable.leftTopPoint.y, draggable.rightBotPoint.y, this.leftTopPoint.y, this.rightBotPoint.y);
  };

  getDirectionToSnap = (draggable: Rectangle): string => {
    const obj = {
      left: Math.abs(this.leftTopPoint.x - draggable.rightTopPoint.x),
      right: Math.abs(this.rightTopPoint.x - draggable.leftTopPoint.x),
      top: Math.abs(this.leftTopPoint.y - draggable.leftBotPoint.y),
      bottom: Math.abs(this.leftBotPoint.y - draggable.leftTopPoint.y)
    };
    return this.getKeyByValue(obj, Math.min(...Object.values(obj)));
  };

  getKeyByValue = (object, value): string => {
    return Object.keys(object).find(key => object[key] === value);
  };

  isInAreaForSnap = (draggable: Rectangle): boolean => {
    const areaStartPoint = new Point(this.leftTopPoint.x - this.SNAP_DISTANCE, this.leftTopPoint.y - this.SNAP_DISTANCE);
    const areaWidth = this.width + this.SNAP_DISTANCE * 2;
    const areaHeight = this.height + this.SNAP_DISTANCE * 2;
    const area = new Rectangle(areaWidth, areaHeight);
    area.setPosition(areaStartPoint);
    return area.isIntersectByPoints(draggable);
  };

  isPointInRectArea = (point: Point): boolean =>
    point.x > this.leftTopPoint.x && point.x < this.rightTopPoint.x && point.y > this.leftTopPoint.y && point.y < this.leftBotPoint.y;

}
