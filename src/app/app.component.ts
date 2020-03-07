import {BmpDencoderService} from './bmp-dencoder';
import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {MatrixOperationsUtils} from './matrix-operations-utils';
import {etalon1} from './moch';
import {PictureObject, SelectType, Point, FileInputEvent} from './types';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

  readonly allSelectTypes: SelectType[] = [
    SelectType.maroon,
    SelectType.darkEed,
    SelectType.firebrick,
    SelectType.crimson,
    SelectType.tomato,
    SelectType.coral,
    SelectType.indianRed,
    SelectType.lightCoral,
    SelectType.darkSalmon,
    SelectType.salmon,
    SelectType.lightSalmon,
    SelectType.orangeRed,
    SelectType.darkOrange,
    SelectType.orange,
    SelectType.gold,
    SelectType.darkGoldenRod,
    SelectType.goldenRod,
    SelectType.paleGoldenRod,
    SelectType.darkKhaki,
    SelectType.khaki,
    SelectType.olive,
    SelectType.yellow,
    SelectType.yellowGreen,
    SelectType.darkOliveGreen,
    SelectType.oliveDrab,
    SelectType.lawnGreen,
    SelectType.chartReuse,
    SelectType.greentellow
  ];
  readonly selectTypeList: SelectType[] = [
    SelectType.Selected,
    SelectType.NonSelected,
    SelectType.ExtraSelect,
    SelectType.red,
    SelectType.brown,
    ...this.allSelectTypes
  ];
  notUsedSelect: SelectType[] = this.allSelectTypes;


  @ViewChild('file', {static: false}) file;
  @ViewChild('global', {static: false}) global: ElementRef;

  isDrawMode: boolean = false;
  isShowImg: boolean = true;
  i: number;
  j: number;
  isMousePressed: boolean = false;

  selectedSelectType: SelectType = SelectType.NonSelected;

  xLines: number[];
  yLines: number[];
  bitmapData: SelectType[][];

  private xLength = 20;
  private yLength = 20;
  private bitmapObjects = [];

  perimeter: number;
  area: number;
  roundnumber: number;

  pictureObjects: PictureObject[] = [];

  constructor() {
    this.makeGridPoints(true);
    this.bitmapData = etalon1;
  }

  ngOnInit() {
    window['dev'] = this;
  }


  private makeGridPoints(withBitmapReinit: boolean = false) {
    this.xLines = new Array(this.xLength).fill(null).map((_, i) => (i));
    this.yLines = new Array(this.yLength).fill(null).map((_, i) => (i));
    if (withBitmapReinit) {
      this.bitmapData = new Array(
        this.yLength).fill(null).map(() => new Array(this.xLength).fill(SelectType.Selected)
      );
    }
  }

  onMouseEnter(i: number, j: number) {
    this.i = i;
    this.j = j;
    if (this.isDrawMode && this.isMousePressed && this.bitmapData[i][j] !== this.selectedSelectType) {
      this.bitmapData[i][j] = this.selectedSelectType;
    }
  }

  getMapId(selectType: SelectType) {
    switch (selectType) {
      case SelectType.Selected:
        return 0;
      case SelectType.NonSelected:
        return 1;
      case SelectType.red:
        return '*';
      case SelectType.brown:
        return '+';
      default:
        return this.bitmapObjects.indexOf(selectType) + 2;
    }
  }

  onMouseLeave() {
    this.isMousePressed = false;
    this.i = undefined;
    this.j = undefined;
  }

  onMouseDown(event: MouseEvent) {
    const leftMouseButton = 1;
    if (!this.isDrawMode) {
      this.get_object(this.i, this.j);
      return;
    }

    event.preventDefault();

    if (event.which === leftMouseButton) {
      this.isMousePressed = true;
      if (this.i != null && this.j != null && this.bitmapData[this.i][this.j] !== this.selectedSelectType) {
        this.bitmapData[this.i][this.j] = this.selectedSelectType;
      }
    }
  }

  onMouseUp() {
    this.isMousePressed = false;
  }

  onMouseEnterLabel(i: number, j: number) {
    this.i = i;
    this.j = j;
  }

  onLabelClick() {
    if (!this.isDrawMode) {
      return;
    }
    if (this.i === null) {
      this.bitmapData.forEach((row: SelectType[]) => {
        if (row[this.j] !== this.selectedSelectType) {
          row[this.j] = this.selectedSelectType;
        }
      });
    } else if (this.j === null) {
      this.bitmapData[this.i].forEach((cell: SelectType, j: number) => {
        if (cell !== this.selectedSelectType) {
          this.bitmapData[this.i][j] = this.selectedSelectType;
        }
      });
    }
  }

  clearGrid(bitmapData: SelectType[][]) {
    MatrixOperationsUtils.clearGrid(bitmapData);
  }

  isCellHighlighted(i: number, j: number) {
    return (this.i === i && this.j === j) || (this.i === null && this.j === j) || (this.j === null && this.i === i);
  }


  onFileInputChange(event: FileInputEvent): void {
    if (!event || (!event.srcElement && !event.originalTarget)) {
      return null;
    }
    const file = event.target.files[0];

    const reader = new FileReader();

    reader.addEventListener('load',
      (e: FileInputEvent) => {
        const buffer = e.target.result;
        const bmpDencoderSrv: BmpDencoderService = new BmpDencoderService(buffer);
        this.xLength = bmpDencoderSrv.width;
        this.yLength = bmpDencoderSrv.height;
        this.makeGridPoints();
        const decodedBmp = bmpDencoderSrv.getData();
        const rgbBmp: SelectType[][] = new Array(this.yLength).fill(null).map((_, i) => []);
        for (let i = 0; i < decodedBmp.length - 1; i += 4) {
          rgbBmp[Math.floor(i / (this.xLength * 4))].push(decodedBmp[i + 3] === 0 ? SelectType.Selected : SelectType.NonSelected);
        }
        this.bitmapData = rgbBmp;
      },
      false);
    reader.readAsArrayBuffer(file);
  }

  findObjects() {
    for (let i = this.bitmapData.length - 1; i >= 0; i--) {
      for (let j = this.bitmapData[i].length - 1; j >= 0; j--) {
        if (this.bitmapData[i][j] === SelectType.NonSelected) {
          this.get_object(i, j);
        }
      }
    }
  }

  get_object(startI, startJ) {
    const foundObject = [];
    const maxI = this.bitmapData.length;
    const maxJ = this.bitmapData[0].length;
    const listToCheck = [[startI, startJ]];

    const selectedType: SelectType = this.bitmapData[startI][startJ];
    if (![SelectType.Selected, SelectType.NonSelected].includes(selectedType)) {
      this.notUsedSelect.unshift(selectedType);
      this.bitmapObjects.splice(this.bitmapObjects.indexOf(selectedType), 1);
    }
    while (listToCheck.length > 0 && listToCheck.length < 400) {
      const i = listToCheck[0][0];
      const j = listToCheck[0][1];
      const leftJ = j - 1;
      const topI = i - 1;
      const rightJ = j + 1;
      const bottomI = i + 1;
      if (this.bitmapData[i][j] === selectedType) {
        foundObject.push(listToCheck[0]);
        listToCheck.shift();
      }
      if (leftJ >= 0 && (this.bitmapData[i][leftJ] === selectedType)) {
        if (
          !foundObject.some(obj => MatrixOperationsUtils.isEqual(obj, [i, leftJ]))
          && !listToCheck.some(obj => MatrixOperationsUtils.isEqual(obj, [i, leftJ]))
        ) {
          listToCheck.push([i, leftJ]);
        }
      }
      if (topI >= 0 && (this.bitmapData[topI][j] === selectedType)) {
        if (
          !foundObject.some(obj => MatrixOperationsUtils.isEqual(obj, [topI, j]))
          && !listToCheck.some(obj => MatrixOperationsUtils.isEqual(obj, [topI, j]))
        ) {
          listToCheck.push([topI, j]);
        }
      }
      if (rightJ < maxJ && (this.bitmapData[i][rightJ] === selectedType)) {
        if (
          !foundObject.some(obj => MatrixOperationsUtils.isEqual(obj, [i, rightJ]))
          && !listToCheck.some(obj => MatrixOperationsUtils.isEqual(obj, [i, rightJ]))
        ) {
          listToCheck.push([i, rightJ]);
        }
      }
      if (bottomI < maxI && this.bitmapData[bottomI][j] === selectedType) {
        if (
          !foundObject.some(obj => MatrixOperationsUtils.isEqual(obj, [bottomI, j]))
          && !listToCheck.some(obj => MatrixOperationsUtils.isEqual(obj, [bottomI, j]))
        ) {
          listToCheck.push([bottomI, j]);
        }
      }
    }
    foundObject.sort();
    MatrixOperationsUtils.shuffle(this.notUsedSelect);
    const randST = this.notUsedSelect.pop();

    foundObject.forEach(obj => this.bitmapData[obj[0]][obj[1]] = randST);
    this.pictureObjects.push({
      pixels: foundObject,
      identify: randST
    });
    this.bitmapObjects.push(randST);
    const beginPixToCalc = foundObject.reduce((acc, curr) => acc = acc && curr[0] >= acc[0] && curr[1] <= acc[1] ? curr : acc);
    this.findBoundary(beginPixToCalc[0], beginPixToCalc[1], randST);

  }

  findBoundary(i: number, j: number, selectType: SelectType) {
    const operateObj: PictureObject = this.pictureObjects[this.pictureObjects.length - 1];
    let loopMaximum: number = this.xLength * this.yLength * 8;
    const s: Point = {i, j};
    const B: Point[] = [s];
    let p: Point = {i: -1, j: -1};
    let c: Point = {...s};
    let currentSide = 'down';

    const nextSideMap: { [key: string]: string } = {
      ['down']: 'deftDown',
      ['deftDown']: 'left',
      ['left']: 'leftUp',
      ['leftUp']: 'up',
      ['up']: 'rightUp',
      ['rightUp']: 'right',
      ['right']: 'rightDown',
      ['rightDown']: 'down',
    };
    const prevSideMap: { [key: string]: string } = {
      ['down']: 'rightDown',
      ['deftDown']: 'rightDown',
      ['left']: 'deftDown',
      ['leftUp']: 'deftDown',
      ['up']: 'leftUp',
      ['rightUp']: 'leftUp',
      ['right']: 'rightUp',
      ['rightDown']: 'rightUp',
    };
    const pointMap: { [key: string]: () => Point } = {
      ['down']: () => ({i: c.i + 1, j: c.j} as Point),
      ['deftDown']: () => ({i: c.i + 1, j: c.j - 1} as Point),
      ['left']: () => ({i: c.i, j: c.j - 1} as Point),
      ['leftUp']: () => ({i: c.i - 1, j: c.j - 1} as Point),
      ['up']: () => ({i: c.i - 1, j: c.j} as Point),
      ['rightUp']: () => ({i: c.i - 1, j: c.j + 1} as Point),
      ['right']: () => ({i: c.i, j: c.j + 1} as Point),
      ['rightDown']: () => ({i: c.i + 1, j: c.j + 1} as Point)
    };
    while (!(s.i === p.i && s.j === p.j) && loopMaximum > 0) {
      loopMaximum--;
      p = pointMap[currentSide]();
      if (p.i >= 0 && p.j >= 0 && p.i < this.yLength && p.j < this.xLength && this.bitmapData[p.i][p.j] === selectType) {
        c = {...p};
        B.push(p);
        currentSide = prevSideMap[currentSide];
      } else {
        currentSide = nextSideMap[currentSide];
      }
    }
    B.push(s);
    if (loopMaximum === 0) {
      throw 'Recursion limit';
    }
    operateObj.boundary = B;
    this.fillHoles(operateObj);
    MatrixOperationsUtils.calcPerimetr(operateObj);
    MatrixOperationsUtils.calcArea(this.bitmapData, operateObj);
    operateObj.centroidMetric = 4 * Math.PI * operateObj.area / (operateObj.perimeter * operateObj.perimeter);
    if (operateObj.centroidMetric > 0.95 && operateObj.centroidMetric < 1.05) {
      this.draw_plus_for(operateObj);
    }
    B.forEach(pix => this.bitmapData[pix.i][pix.j] = SelectType.red);
  }

  fillHoles(obj: PictureObject) {
    const foundObject = [];
    const listToCheck = obj.pixels.filter(pixel => !obj.boundary.some(pixObj => MatrixOperationsUtils.isEqual(pixel, [pixObj.i, pixObj.j])));

    while (listToCheck.length > 0 && listToCheck.length < 400) {
      const i = listToCheck[0][0];
      const j = listToCheck[0][1];
      const leftJ = j - 1;
      const topI = i - 1;
      const rightJ = j + 1;
      const bottomI = i + 1;
      this.bitmapData[i][j] = obj.identify;
      listToCheck.shift();
      foundObject.push(listToCheck[0]);

      if (!obj.boundary.some(pixObj => MatrixOperationsUtils.isEqual([pixObj.i, pixObj.j], [i, leftJ]))
        && !foundObject.some(pixObj => MatrixOperationsUtils.isEqual(pixObj, [i, leftJ]))
        && !listToCheck.some(pixObj => MatrixOperationsUtils.isEqual(pixObj, [i, leftJ]))) {
        listToCheck.push([i, leftJ]);
      }
      if (!obj.boundary.some(pixObj => MatrixOperationsUtils.isEqual([pixObj.i, pixObj.j], [topI, j]))
        && !foundObject.some(pixObj => MatrixOperationsUtils.isEqual(pixObj, [topI, j]))
        && !listToCheck.some(pixObj => MatrixOperationsUtils.isEqual(pixObj, [topI, j]))) {
        listToCheck.push([topI, j]);
      }
      if (!obj.boundary.some(pixObj => MatrixOperationsUtils.isEqual([pixObj.i, pixObj.j], [i, rightJ]))
        && !foundObject.some(pixObj => MatrixOperationsUtils.isEqual(pixObj, [i, rightJ]))
        && !listToCheck.some(pixObj => MatrixOperationsUtils.isEqual(pixObj, [i, rightJ]))) {
        listToCheck.push([i, rightJ]);
      }
      if (!obj.boundary.some(pixObj => MatrixOperationsUtils.isEqual([pixObj.i, pixObj.j], [bottomI, j]))
        && !foundObject.some(pixObj => MatrixOperationsUtils.isEqual(pixObj, [bottomI, j]))
        && !listToCheck.some(pixObj => MatrixOperationsUtils.isEqual(pixObj, [bottomI, j]))) {
        listToCheck.push([bottomI, j]);
      }
    }
  }

  draw_plus_for(obj: PictureObject) {
    const left = obj.pixels.reduce((acc, curr) => acc = acc && acc[1] < curr[1] ? acc : curr)[1];
    const right = obj.pixels.reduce((acc, curr) => acc = acc && acc[1] > curr[1] ? acc : curr)[1];
    const top = obj.pixels.reduce((acc, curr) => acc = acc && acc[0] < curr[0] ? acc : curr)[0];
    const bottom = obj.pixels.reduce((acc, curr) => acc = acc && acc[0] > curr[0] ? acc : curr)[0];

    const center = [+((top + bottom) / 2).toFixed(), +((left + right) / 2).toFixed()];

    this.bitmapData[center[0]][center[1]] = SelectType.brown;

    let i = center[0];
    let j = left;
    while (j <= right) {
      this.bitmapData[i][j] = SelectType.brown;
      j += 1;
    }

    i = center[0];
    j = right;
    while (j >= left) {
      this.bitmapData[i][j] = SelectType.brown;
      j -= 1;
    }

    i = top;
    j = center[1];
    while (i <= bottom) {
      this.bitmapData[i][j] = SelectType.brown;
      i += 1;
    }
    i = bottom;
    j = center[1];
    while (i >= top) {
      this.bitmapData[i][j] = SelectType.brown;
      i -= 1;
    }
  }

  log() {
    console.log(JSON.stringify(this.bitmapData));
    console.log(JSON.stringify(this.pictureObjects));
  }
}
