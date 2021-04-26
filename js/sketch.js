const TWO_PI = Math.PI * 2;
const PI = Math.PI;

class Sketch extends Engine {
  preload() {
    // temp canvas parameters
    const width = 200;
    const height = 200;
    const border = 0.1 * height;
    this._ratio = this._height / height;
    // create temp canvas
    let temp_canvas;
    temp_canvas = document.createElement("canvas");
    temp_canvas.setAttribute("width", width);
    temp_canvas.setAttribute("height", height);
    let temp_ctx;
    temp_ctx = temp_canvas.getContext("2d", { alpha: false });
    // write text on temp canvas
    temp_ctx.save();
    this.background("black");
    temp_ctx.fillStyle = "white";
    temp_ctx.textAlign = "center";
    temp_ctx.textBaseline = "middle";
    temp_ctx.font = `${(height - border) / 3}px Hack`;
    temp_ctx.fillText("FEEL", width / 2, (height - border / 2) / 6 + border / 2);
    temp_ctx.fillText("THE", width / 2, (height - border / 2) / 2 + border / 2);
    temp_ctx.fillText("NOISE", width / 2, (height - border / 2) * 5 / 6 + border / 2);

    // get pixels
    const pixels = temp_ctx.getImageData(0, 0, width, height);
    this.background("black");
    temp_ctx.restore();

    // now it's time to reduce the array
    // keep track only if the pixels is empty or not
    let non_black_pixels = [];
    for (let i = 0; i < pixels.data.length; i += 4) {
      for (let j = 0; j < 3; j++) {
        if (pixels.data[i + j] > 0) {
          const pos = xy_from_index(parseInt(i / 4), pixels.width, this._ratio);
          non_black_pixels.push(pos);
          break;
        }
      }
    }
    this._pixels = [...non_black_pixels];
  }

  setup() {
    // parameters
    this._duration = 900;
    this._recording = false;
    this._show_fps = false;
    this._lines_spacing = 20;
    this._border = 0;
    this._scl = 1;
    this._noise_ampl = [this._lines_spacing / 2 * 0.9, 3];
    // sketch setup
    console.clear();
    // setup capturer
    if (this._recording) {
      this._capturer = new CCapture({ format: "png" });
      this._capturer_started = false;
    }
  }

  draw() {
    if (!this._capturer_started && this._recording) {
      this._capturer_started = true;
      this._capturer.start();
      console.log("%c Recording started", "color: green; font-size: 2rem");
    }

    const percent = (this._frameCount % this._duration) / this._duration;
    const time_theta = ease(percent) * PI;

    // DRAW
    const dy = this._height * this._border / 2;
    const channel = 200 + 40 * Math.sin(time_theta);
    const alpha = 0.8 + 0.2 * Math.sin(time_theta);

    this._ctx.save();
    this.background("rgb(15, 15, 15)");
    this._ctx.strokeStyle = `rgb(${channel}, ${channel}, ${channel}, ${alpha})`;
    this._ctx.lineWidth = 2;


    for (let y = dy + this._lines_spacing / 2; y < this._height - dy; y += this._lines_spacing) {
      const line_picked = this._pixels.filter(p => Math.abs(p.y - y) < this._ratio);
      const height_percent = y / this._height;
      this._ctx.save();
      this._ctx.translate(0, y);
      this._ctx.beginPath();
      this._ctx.moveTo(0, 0);

      for (let x = 0; x <= this._width; x += this._scl) {
        const col_picked = line_picked.filter(p => Math.abs(p.x - x) < this._ratio);
        const width_percent = x / this._width;
        const phi = height_percent * TWO_PI * 8 + percent * TWO_PI * 16;
        const ampl = this._lines_spacing * Math.sin(width_percent * TWO_PI * 25 + phi) * 0.35;

        let n = 1;
        if (col_picked.length > 0) {
          n += Math.sin(time_theta) * noise(x) * 1.5;
        }

        this._ctx.lineTo(x, n * ampl);
      }
      this._ctx.stroke();
      this._ctx.restore();
    }


    this._ctx.restore();

    // handle recording
    if (this._recording) {
      if (this._frameCount < this._duration) {
        this._capturer.capture(this._canvas);
      } else {
        this._recording = false;
        this._capturer.stop();
        this._capturer.save();
        console.log("%c Recording ended", "color: red; font-size: 2rem");
      }
    }

    // show FPS
    if (this._show_fps) {
      this._ctx.save();
      this._ctx.fillStyle = "red";
      this._ctx.font = "30px Hack";
      this._ctx.fillText(parseInt(this._frameRate), 40, 40);
      this._ctx.restore();
    }
  }
}

const noise = x => {
  /*let n = 0;
  const omega = [5, 23, 29, 37, 39, 47, 49];
  omega.forEach(o => n += Math.cos(x * o) / omega.length);
  return (1 + n) / 2;*/
  return random(-1, 1);
};

const ease = x => -(Math.cos(PI * x) - 1) / 2;

const xy_from_index = (i, width, ratio = 1) => {
  const x = i % width;
  const y = parseInt(i / width);
  return { x: x * ratio, y: y * ratio };
};

const index_from_xy = (x, y, width) => {
  return x + width * y;
};

const random = (a, b) => {
  if (a == undefined && b == undefined) return random(0, 1);
  else if (b == undefined) return random(0, a);
  else if (a != undefined && b != undefined) return Math.random() * (b - a) + a;
};
