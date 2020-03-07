import {PictureObject, Point, SelectType} from './types';

export class MatrixOperationsUtils {

  static clearGrid(bitmapData: SelectType[][]): void {
    bitmapData.forEach((row: SelectType[]) =>
      row.forEach((cell: SelectType, j: number) => row[j] = SelectType.Selected)
    );
  }

  static shuffle(a): void {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
  }

  static calcArea(bitmapData: SelectType[][], operateObj: PictureObject): void {
    operateObj.area = 0;
    bitmapData.forEach(line =>
      line.forEach(pix => operateObj.area += pix === operateObj.identify ? 1 : 0)
    );
  }

  static calcPerimetr(operateObj: PictureObject): void {
    const boundary: Point[] = operateObj.boundary;
    const newBoundary = [Math.sqrt(
      Math.abs(boundary[0].i - boundary[boundary.length - 1].i) + Math.abs(boundary[0].j - boundary[boundary.length - 1].j)
    )];

    for (let i = 0; i < boundary.length - 1; i++) {
      newBoundary.push(Math.sqrt(
        Math.abs(boundary[i].i - boundary[i + 1].i) + Math.abs(boundary[i].j - boundary[i + 1].j)
      ));
    }
    operateObj.perimeter = newBoundary.reduce((acc, next) => acc += next);
  }

  static isEqual(val1: any, val2: any): boolean {
    if (val1 === val2) {
      return true;
    }
    const type = typeof val1;
    if (type !== typeof val2) {
      return false;
    } else if (type === 'function') {
      return val1.toString() === val2.toString();
    } else if (!val1 || !val2 || type !== 'object') {
      return val1 === val2;
    } else if (val1.valueOf() === val2.valueOf()) {
      return true;
    } else if (val1.constructor !== val2.constructor) {
      return false;
    } else if (![Object, Array].includes(val1.constructor)) {
      return false;
    }

    for (const p in val2) {
      if (val2.hasOwnProperty(p) !== val1.hasOwnProperty(p)) {
        return false;
      }
    }

    for (const p in val1) {
      if ((val1.hasOwnProperty(p) !== val2.hasOwnProperty(p)) || !this.isEqual(val1[p], val2[p])) {
        return false;
      }
    }
    return true;
  }

}
