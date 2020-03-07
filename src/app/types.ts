
export enum SelectType {
  Selected = 'selected',
  NonSelected = 'nonselected',
  ExtraSelect = 'extraselect',
  maroon = 'maroon',
  darkEed = 'dark-red',
  brown = 'brown',
  firebrick = 'firebrick',
  crimson = 'crimson',
  red = 'red',
  tomato = 'tomato',
  coral = 'coral',
  indianRed = 'indian-red',
  lightCoral = 'light-coral',
  darkSalmon = 'dark-salmon',
  salmon = 'salmon',
  lightSalmon = 'light-salmon',
  orangeRed = 'orange-red',
  darkOrange = 'dark-orange',
  orange = 'orange',
  gold = 'gold',
  darkGoldenRod = 'dark-golden-rod',
  goldenRod = 'golden-rod',
  paleGoldenRod = 'pale-golden-rod',
  darkKhaki = 'dark-khaki',
  khaki = 'khaki',
  olive = 'olive',
  yellow = 'yellow',
  yellowGreen = 'yellow-green',
  darkOliveGreen = 'dark-olive-green',
  oliveDrab = 'olive-drab',
  lawnGreen = 'lawn-green',
  chartReuse = 'chart-reuse',
  greentellow = 'green-yellow'
}

export interface FileInputEvent extends Event {
  originalTarget: HTMLInputElement;
  srcElement: HTMLInputElement;
  target: any;
}

export interface Point {
  i: number;
  j: number;
}


export interface PictureObject {
  pixels: Array<Array<number>>;
  identify: SelectType;
  perimeter?: number;
  area?: number;
  centroidMetric?: number;
  boundary?: Point[];
}
