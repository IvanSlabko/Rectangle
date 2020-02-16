import {Point} from '../canvas-area/Point';

export class Rectangle {
  public leftBotPoint: Point;
  public rightTopPoint: Point;
  public rightBotPoint: Point;

  constructor(public leftTopPoint: Point, public width: number, public height: number,
              public color?: string) {
    this.rightTopPoint = new Point(leftTopPoint.x + width, leftTopPoint.y);
    this.leftBotPoint = new Point(leftTopPoint.x, leftTopPoint.y + height);
    this.rightBotPoint = new Point(leftTopPoint.x + width, leftTopPoint.y + height);
  }

  setLeftTopPoint = (changedPoint: Point) => {
    this.leftTopPoint = changedPoint;
    this.rightTopPoint.x = changedPoint.x + this.width;
    this.rightTopPoint.y = changedPoint.y;
    this.leftBotPoint.x = changedPoint.x;
    this.leftBotPoint.y = changedPoint.y + this.height;
    this.rightBotPoint.x = changedPoint.x + this.width;
    this.rightBotPoint.y = changedPoint.y + this.height;
  }

}
