class Sketch extends Engine {
  preload() {
    // temp canvas parameters
    const width = 500;
    const height = 500;
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
    temp_ctx.font = `${height / 3}px Hack`;
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
    this._duration = 600;
    this._recording = false;
    this._show_fps = true;
    this._lines_spacing = 15;
    this._border = 0;
    this._scl = 1;
    this._noise_ampl = [this._lines_spacing / 3.5, 2];
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
    const eased_percent = easeInOut(percent);

    const time_theta = eased_percent * Math.PI * 2;
    const modulation = Math.sin(time_theta / 2);

    // DRAW
    const dy = this._height * this._border / 2;

    this._ctx.save();
    this.background("black");
    this._ctx.strokeStyle = "white";
    this._ctx.lineWidth = 2;


    for (let y = dy + this._lines_spacing / 2; y < this._height - dy; y += this._lines_spacing) {
      const line_picked = this._pixels.filter(p => Math.abs(p.y - y) < this._ratio);

      this._ctx.beginPath();
      this._ctx.moveTo(0, y);

      for (let x = 0; x <= this._width; x += this._scl) {
        const col_picked = line_picked.filter(p => Math.abs(p.x - x) < this._ratio);
        const amplitude = col_picked.length > 0 ? this._noise_ampl[0] : this._noise_ampl[1];
        const n = noise(x) * amplitude * modulation;
        this._ctx.lineTo(x, y - n);
      }
      this._ctx.stroke();
    }


    this._ctx.restore();

    // show FPS
    if (this._show_fps) {
      this._ctx.save();
      this._ctx.fillStyle = "red";
      this._ctx.font = "30px Hack";
      this._ctx.fillText(parseInt(this._frameRate), 40, 40);
      this._ctx.restore();
    }
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
}

const easeInOut = x => {
  return x < 0.5 ? 16 * Math.pow(x, 5) : 1 - Math.pow(-2 * x + 2, 5) / 2;
};


const noise = (x) => {
  return Math.cos(x / 10 * Math.PI * 2 + random(0, Math.PI / 2));
};

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
