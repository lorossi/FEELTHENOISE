class Sketch extends Engine {
  preload() {
    // parameters
    this._duration = 900;
    this._recording = false;
    this._lines_spacing = 15;
    this._scl = 1; // pixel scaling in final image
  }

  setup() {
    // load pixels from text
    this._loadTextPixels();
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
    const time_theta = ease(percent) * Math.PI;

    // DRAW
    const channel = 220 + 20 * Math.sin(time_theta); // RGB channel value
    const alpha = 0.7 + 0.2 * Math.sin(time_theta); // RGB alpha

    this._ctx.save();
    this.background("rgb(15, 15, 15)");
    this._ctx.strokeStyle = `rgb(${channel}, ${channel}, ${channel}, ${alpha})`;
    this._ctx.lineWidth = 2;


    for (let y = this._lines_spacing / 2; y < this._height; y += this._lines_spacing) {
      // is the line in the old canvas as well?
      const line_picked = this._pixels.filter(p => Math.abs(p.y - y) < this._temp_canvas_ratio);
      this._ctx.save();
      this._ctx.translate(0, y);
      this._ctx.beginPath();
      this._ctx.moveTo(0, 0);

      for (let x = 0; x <= this._width; x += this._scl) {
        const height_percent = y / this._height; // height ratio
        const width_percent = x / this._width; // width ratio
        const omega = Math.PI * 2 * 20; // sin omega
        const phi = height_percent * Math.PI * 2 * 4 + percent * Math.PI * 2 * 16; // sin phase

        let module = this._lines_spacing * Math.sin(width_percent * omega + phi) * 0.35; // sin amplitude
        // is this col picked? since the line is already picked, the pixel is picked
        const col_picked = line_picked.some(p => Math.abs(p.x - x) < this._temp_canvas_ratio);
        if (col_picked) {
          // add some noise if the letter is behind this pixel
          module += Math.sin(time_theta) * random(-1, 1) * this._lines_spacing * 0.75;
          // lower the resolution
          x += this._scl * 2;
        }

        this._ctx.lineTo(x, module);
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
  }

  _loadTextPixels() {
    const temp_canvas_size = 200;
    // temp canvas parameters
    const height = temp_canvas_size;
    const width = temp_canvas_size;
    const border = 0.1 * height;
    this._temp_canvas_ratio = this._height / temp_canvas_size; // ratio between temp canvas and real canvas
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

}

const ease = x => x < 0.5 ? 2 * Math.pow(x, 2) : 1 - Math.pow(-2 * x + 2, 2) / 2;

const xy_from_index = (i, width, ratio = 1) => {
  const x = i % width;
  const y = parseInt(i / width);
  return { x: x * ratio, y: y * ratio };
};

const random = (a, b) => {
  if (a == undefined && b == undefined) return random(0, 1);
  else if (b == undefined) return random(0, a);
  else if (a != undefined && b != undefined) return Math.random() * (b - a) + a;
};
