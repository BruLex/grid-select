interface Palette {
  red: number;
  green: number;
  blue: number;
  quad: number;
}

export class BmpDencoderService {

  width: number;
  height: number;

  private pos: number = 50;
  private buffer: ArrayBuffer;
  private isWithAlpha: boolean;
  private bottomUp: boolean = true;

  private fileSize: number;
  private reserved: number;
  private offset: number;
  private headerSize: number;

  private planes: number;
  private bitPP: number;
  private compress: number;
  private rawSize: number;
  private hr: number;
  private vr: number;
  private colors: number;
  private importantColors: number;

  private palette: Palette[];

  private data: Uint8ClampedArray;
  private datav: DataView;

  constructor(buffer: ArrayBuffer, isWithAlpha?: boolean) {
    this.buffer = buffer;
    this.isWithAlpha = !!isWithAlpha;
    this.datav = new DataView(this.buffer);
    this.parseHeader();
    this.parseRGBA();

  }

  parseHeader(): void {
    this.fileSize = this.datav.getUint32(2, true);
    this.reserved = this.datav.getUint32(6, true);
    this.offset = this.datav.getUint32(10, true);
    this.headerSize = this.datav.getUint32(14, true);
    this.width = this.datav.getUint32(18, true);
    this.height = this.datav.getUint32(22, true);
    this.planes = this.datav.getUint16(26, true);
    this.bitPP = this.datav.getUint16(28, true);
    this.compress = this.datav.getUint32(30, true);
    this.rawSize = this.datav.getUint32(34, true);
    this.hr = this.datav.getUint32(38, true);
    this.vr = this.datav.getUint32(42, true);
    this.colors = this.datav.getUint32(46, true);
    this.importantColors = this.datav.getUint32(50, true);
    this.pos += 4;

    if (this.bitPP === 16 && this.isWithAlpha) {
      this.bitPP = 15;
    }
    if (this.bitPP < 15) {
      const len = this.colors === 0 ? 1 << this.bitPP : this.colors;
      this.palette = new Array(len);
      for (let i = 0; i < len; i++) {
        const blue = this.datav.getUint8(this.pos++);
        const green = this.datav.getUint8(this.pos++);
        const red = this.datav.getUint8(this.pos++);
        const quad = this.datav.getUint8(this.pos++);
        this.palette[i] = {red, green, blue, quad};
      }
    }
    if (this.height < 0) {
      this.height *= -1;
      this.bottomUp = false;
    }
  }

  parseRGBA(): void {
    const bitn = 'bit' + this.bitPP;
    const len = this.width * this.height * 4;
    this.data = new Uint8ClampedArray(len);
    this[bitn]();
  }

  bit1() {
    const xlen = Math.ceil(this.width / 8);
    const mode = xlen % 4;
    let y = this.height >= 0 ? this.height - 1 : -this.height;
    for (; y >= 0; y--) {
      const line = this.bottomUp ? y : this.height - 1 - y;
      for (let x = 0; x < xlen; x++) {
        const b = this.datav.getUint8(this.pos++);
        const location = line * this.width * 4 + x * 8 * 4;
        for (let i = 0; i < 8; i++) {
          if (x * 8 + i < this.width) {
            const rgb: Palette = this.palette[((b >> (7 - i)) & 0x1)];

            this.data[location + i * 4] = 0;
            this.data[location + i * 4 + 1] = rgb.blue;
            this.data[location + i * 4 + 2] = rgb.green;
            this.data[location + i * 4 + 3] = rgb.red;

          } else {
            break;
          }
        }
      }

      if (mode !== 0) {
        this.pos += (4 - mode);
      }
    }
  }


  bit4() {
    // RLE-4
    if (this.compress === 2) {
      this.data.fill(0xff);

      let location = 0;
      let lines = this.bottomUp ? this.height - 1 : 0;
      let lowNibble = false; // for all count of pixel

      while (location < this.data.length) {
        const a = this.datav.getUint8(this.pos++);
        const b = this.datav.getUint8(this.pos++);
        // absolute mode
        if (a === 0) {
          if (b === 0) { // line end
            if (this.bottomUp) {
              lines--;
            } else {
              lines++;
            }
            location = lines * this.width * 4;
            lowNibble = false;
            continue;
          } else if (b === 1) { // image end
            break;
          } else if (b === 2) {
            // offset x,y
            const x = this.datav.getUint8(this.pos++);
            const y = this.datav.getUint8(this.pos++);
            if (this.bottomUp) {
              lines -= y;
            } else {
              lines += y;
            }

            location += (y * this.width * 4 + x * 4);
          } else {
            let c = this.datav.getUint8(this.pos++);
            for (let i = 0; i < b; i++) {
              if (lowNibble) {
                setPixelData.call(this, (c & 0x0f));
              } else {
                setPixelData.call(this, (c & 0xf0) >> 4);
              }

              if ((i & 1) && (i + 1 < b)) {
                c = this.datav.getUint8(this.pos++);
              }

              lowNibble = !lowNibble;
            }

            if ((((b + 1) >> 1) & 1) === 1) {
              this.pos++;
            }
          }

        } else { // encoded mode
          for (let i = 0; i < a; i++) {
            if (lowNibble) {
              setPixelData.call(this, (b & 0x0f));
            } else {
              setPixelData.call(this, (b & 0xf0) >> 4);
            }
            lowNibble = !lowNibble;
          }
        }
      }


      function setPixelData(rgbIndex) {
        const rgb = this.palette[rgbIndex];
        this.data[location] = 0;
        this.data[location + 1] = rgb.blue;
        this.data[location + 2] = rgb.green;
        this.data[location + 3] = rgb.red;
        location += 4;
      }
    } else {

      const xlen = Math.ceil(this.width / 2);
      const mode = xlen % 4;
      for (let y = this.height - 1; y >= 0; y--) {
        const line = this.bottomUp ? y : this.height - 1 - y;
        for (let x = 0; x < xlen; x++) {
          const b = this.datav.getUint8(this.pos++);
          const location = line * this.width * 4 + x * 2 * 4;

          const before = b >> 4;
          const after = b & 0x0F;

          let rgb = this.palette[before];
          this.data[location] = 0;
          this.data[location + 1] = rgb.blue;
          this.data[location + 2] = rgb.green;
          this.data[location + 3] = rgb.red;


          if (x * 2 + 1 >= this.width) {
            break;
          }

          rgb = this.palette[after];

          this.data[location + 4] = 0;
          this.data[location + 4 + 1] = rgb.blue;
          this.data[location + 4 + 2] = rgb.green;
          this.data[location + 4 + 3] = rgb.red;

        }

        if (mode !== 0) {
          this.pos += (4 - mode);
        }
      }

    }

  }

  bit8() {
    // RLE-8
    if (this.compress === 1) {
      this.data.fill(0xff);

      let location = 0;
      let lines = this.bottomUp ? this.height - 1 : 0;

      while (location < this.data.length) {
        const a = this.datav.getUint8(this.pos++);
        const b = this.datav.getUint8(this.pos++);
        // absolute mode
        if (a === 0) {
          if (b === 0) { // line end
            if (this.bottomUp) {
              lines--;
            } else {
              lines++;
            }
            location = lines * this.width * 4;
            continue;
          } else if (b === 1) { // image end
            break;
          } else if (b === 2) {
            // offset x,y
            const x = this.datav.getUint8(this.pos++);
            const y = this.datav.getUint8(this.pos++);
            if (this.bottomUp) {
              lines -= y;
            } else {
              lines += y;
            }

            location += (y * this.width * 4 + x * 4);
          } else {
            for (let i = 0; i < b; i++) {
              const c = this.datav.getUint8(this.pos++);
              setPixelData.call(this, c);
            }
            if ((b & 1) === 1) {
              this.pos++;
            }

          }

        } else {// encoded mode
          for (let i = 0; i < a; i++) {
            setPixelData.call(this, b);
          }
        }

      }

      function setPixelData(rgbIndex) {
        const rgb = this.palette[rgbIndex];
        this.data[location] = 0;
        this.data[location + 1] = rgb.blue;
        this.data[location + 2] = rgb.green;
        this.data[location + 3] = rgb.red;
        location += 4;
      }
    } else {
      const mode = this.width % 4;
      for (let y = this.height - 1; y >= 0; y--) {
        const line = this.bottomUp ? y : this.height - 1 - y;
        for (let x = 0; x < this.width; x++) {
          const b = this.datav.getUint8(this.pos++);
          const location = line * this.width * 4 + x * 4;
          if (b < this.palette.length) {
            const rgb = this.palette[b];

            this.data[location] = 0;
            this.data[location + 1] = rgb.blue;
            this.data[location + 2] = rgb.green;
            this.data[location + 3] = rgb.red;

          } else {
            this.data[location] = 0;
            this.data[location + 1] = 0xFF;
            this.data[location + 2] = 0xFF;
            this.data[location + 3] = 0xFF;
          }
        }
        if (mode !== 0) {
          this.pos += (4 - mode);
        }
      }
    }
  }

  bit15() {
    const difW = this.width % 3;
    const _1_5 = parseInt('11111', 2);
    for (let y = this.height - 1; y >= 0; y--) {
      const line = this.bottomUp ? y : this.height - 1 - y;
      for (let x = 0; x < this.width; x++) {

        const B = this.datav.getUint16(this.pos, true);
        this.pos += 2;
        const blue = (B & _1_5) / _1_5 * 255 | 0;
        const green = (B >> 5 & _1_5) / _1_5 * 255 | 0;
        const red = (B >> 10 & _1_5) / _1_5 * 255 | 0;
        const alpha = (B >> 15) ? 0xFF : 0x00;

        const location = line * this.width * 4 + x * 4;

        this.data[location] = alpha;
        this.data[location + 1] = blue;
        this.data[location + 2] = green;
        this.data[location + 3] = red;
      }
      // skip extra bytes
      this.pos += difW;
    }
  }

  bit16() {
    const difW = (this.width % 2) * 2;
    // default xrgb555
    let maskRed = 0x7C00;
    let maskGreen = 0x3E0;
    let maskBlue = 0x1F;
    let mask0 = 0;

    if (this.compress === 3) {
      maskRed = this.datav.getUint32(this.pos, true);
      this.pos += 4;
      maskGreen = this.datav.getUint32(this.pos, true);
      this.pos += 4;
      maskBlue = this.datav.getUint32(this.pos, true);
      this.pos += 4;
      mask0 = this.datav.getUint32(this.pos, true);
      this.pos += 4;
    }


    const ns = [0, 0, 0];
    for (let i = 0; i < 16; i++) {
      if ((maskRed >> i) & 0x01) {
        ns[0]++;
      }
      if ((maskGreen >> i) & 0x01) {
        ns[1]++;
      }
      if ((maskBlue >> i) & 0x01) {
        ns[2]++;
      }
    }
    ns[1] += ns[0];
    ns[2] += ns[1];
    ns[0] = 8 - ns[0];
    ns[1] -= 8;
    ns[2] -= 8;

    for (let y = this.height - 1; y >= 0; y--) {
      const line = this.bottomUp ? y : this.height - 1 - y;
      for (let x = 0; x < this.width; x++) {

        const B = this.datav.getUint16(this.pos, true);
        this.pos += 2;

        const blue = (B & maskBlue) << ns[0];
        const green = (B & maskGreen) >> ns[1];
        const red = (B & maskRed) >> ns[2];

        const location = line * this.width * 4 + x * 4;

        this.data[location] = 0;
        this.data[location + 1] = blue;
        this.data[location + 2] = green;
        this.data[location + 3] = red;
      }
      // skip extra bytes
      this.pos += difW;
    }
  }

  bit24() {
    for (let y = this.height - 1; y >= 0; y--) {
      const line = this.bottomUp ? y : this.height - 1 - y;
      for (let x = 0; x < this.width; x++) {
        // Little Endian rgb
        const blue = this.datav.getUint8(this.pos++);
        const green = this.datav.getUint8(this.pos++);
        const red = this.datav.getUint8(this.pos++);
        const location = line * this.width * 4 + x * 4;
        this.data[location] = 0;
        this.data[location + 1] = blue;
        this.data[location + 2] = green;
        this.data[location + 3] = red;
      }
      // skip extra bytes
      this.pos += (this.width % 4);
    }
  }


  getData() {
    return this.data;
  }
}
