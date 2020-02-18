import {Point} from './Point';

export class Rectangle {
  public leftTopPoint: Point;
  public leftBotPoint: Point;
  public rightTopPoint: Point;
  public rightBotPoint: Point;
  public currentColor: string;

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
  }

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

}
