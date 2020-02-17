import {Point} from './Point';

export class Rectangle {
  public leftTopPoint: Point;
  public leftBotPoint: Point;
  public rightTopPoint: Point;
  public rightBotPoint: Point;
  public currentColor: string;

  constructor(public width: number, public height: number,
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

}
