export class Point {
  constructor(public x?: number, public y?: number) {
  }

  isPointBelongsLine = (pointPosition: number, startLine: number, endLine: number): boolean => {
    return (pointPosition - startLine) * (pointPosition - endLine) < 0;
  };

  isPointIntersect = (dragX1: number, dragX2: number, intersectX3: number, intersectX4: number) => {
    return this.isPointBelongsLine(dragX1, intersectX3, intersectX4) || this.isPointBelongsLine(dragX2, intersectX3, intersectX4) ||
      this.isPointBelongsLine(intersectX3, dragX1, dragX2) || this.isPointBelongsLine(intersectX4, dragX1, dragX2);
  };
}
