const TWO_PI = Math.PI * 2;
const PI = Math.PI;

class Sketch extends Engine {
  preload() {
    // parameters
    this._duration = 900;
    this._recording = false;
    this._show_fps = false;
    this._lines_spacing = 20;
    this._border = 0;
    this._scl = 1; // pixel scaling in final image
    this._temp_canvas_size = 200;

    this.loadTextPixels();
  }

  loadTextPixels() {
    // temp canvas parameters
    const height = this._temp_canvas_size;
    const width = this._temp_canvas_size;
    const border = 0.1 * height;
    this._temp_canvas_ratio = this._height / this._temp_canvas_size; // ratio between temp canvas and real canvas
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
    this._pixels = [];
    for (let i = 0; i < pixels.data.length; i += 4) {
      for (let j = 0; j < 3; j++) {
        if (pixels.data[i + j] > 0) {
          // get pos (1D array to 2D array) and push to the array of pixels
          const pos = xy_from_index(parseInt(i / 4), pixels.width, this._temp_canvas_ratio);
          this._pixels.push(pos);
          break;
        }
      }
    }
  }

  setup() {
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
    //const percent = 0.5;
    const time_theta = ease(percent) * PI;

    // DRAW
    const channel = 220 + 20 * Math.sin(time_theta); // RGB channel value
    const alpha = 0.8 + 0.2 * Math.sin(time_theta); // RGB alpha
    const dy = this._height * this._border / 2; // height displacement

    this._ctx.save();
    this.background("rgb(15, 15, 15)");
    this._ctx.strokeStyle = `rgb(${channel}, ${channel}, ${channel}, ${alpha})`;
    this._ctx.lineWidth = 2;


    for (let y = dy + this._lines_spacing / 2; y < this._height - dy; y += this._lines_spacing) {
      // is the line in the old canvas aswell?
      const line_picked = this._pixels.filter(p => Math.abs(p.y - y) < this._temp_canvas_ratio);
      this._ctx.save();
      this._ctx.translate(0, y);
      this._ctx.beginPath();
      this._ctx.moveTo(0, 0);

      for (let x = 0; x <= this._width; x += this._scl) {
        const height_percent = y / this._height; // height ratio
        const width_percent = x / this._width; // width ratio
        const omega = TWO_PI * 20; // sin omega
        const phi = height_percent * TWO_PI * 4 + percent * TWO_PI * 16; // sin phase

        let ampl = this._lines_spacing * Math.sin(width_percent * omega + phi) * 0.35; // sin amplitude
        // is this col picked? since the line is already picked, the pixel is picked
        const col_picked = line_picked.some(p => Math.abs(p.x - x) < this._temp_canvas_ratio);
        if (col_picked) {
          // add some noise if the letter is behind this pixel
          ampl += Math.sin(time_theta) * random(-1, 1) * this._lines_spacing * 0.5;
          // lower the risolution
          x += this._scl * 2;
        }

        this._ctx.lineTo(x, ampl);
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

const ease = x => x < 0.5 ? 4 * Math.pow(x, 3) : 1 - Math.pow(-2 * x + 2, 3) / 2;

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

const distSq = (x1, y1, x2, y2) => {
  return Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2);
};

const dist = (x1, y1, x2, y2) => {
  return Math.sqrt(distSq(x1, y1, x2, y2));
};
