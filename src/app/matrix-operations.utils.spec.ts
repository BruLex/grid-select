import {MatrixOperationsUtils} from './matrix-operations-utils';
import {PictureObject, SelectType} from './types';
import {etalon1, etalon1Params} from './moch';
import * as _ from 'lodash';

describe('MatrixOperationsUtils', () => {

  let etalonBitmapObj: SelectType[][];
  let etalonParams: PictureObject;
  beforeEach(() => {
    etalonBitmapObj = _.cloneDeep(etalon1);
    etalonParams = _.cloneDeep(etalon1Params);
  });
  it('should set all bittmap to selected type', () => {
    MatrixOperationsUtils.clearGrid(etalonBitmapObj);
    expect(etalonBitmapObj.some(val => val.some(vall => vall !== SelectType.Selected))).toBeFalsy();
  });
  it('objects should be equal', () => {
    const a: object = {
      a: 123,
      b: 321,
      c: [
        {a: 2, b: 2}
      ]
    };
    const b: object = {
      a: 123,
      b: 321,
      c: [
        {a: 2, b: 2}
      ]
    };
    expect(MatrixOperationsUtils.isEqual(a, b)).toBeTruthy();
  });

  it('objects should not be equal', () => {
    const a: object = {
      a: 123,
      b: 321,
      c: [
        {a: 2, b: 8}
      ]
    };
    const b: object = {
      a: 123,
      b: 321,
      c: [
        {a: 2, b: 2}
      ]
    };
    expect(MatrixOperationsUtils.isEqual(a, b)).toBeFalsy();
  });

  it('should shuffle', () => {
    const a = [1, 2, 3, 4, 5, 6, 7];
    const b = [1, 2, 3, 4, 5, 6, 7];
    MatrixOperationsUtils.shuffle(a);
    expect(MatrixOperationsUtils.isEqual(a, b)).toBeFalsy();
  });
  it('should calc area', () => {
    MatrixOperationsUtils.calcArea(etalonBitmapObj, etalonParams);
    expect(etalonParams.area).toEqual(66, etalonBitmapObj);
  });
  it('should calc perimeter', () => {
    MatrixOperationsUtils.calcPerimetr(etalonParams);
    expect(etalonParams.perimeter.toFixed(2)).toEqual('33.80');
  });
});

