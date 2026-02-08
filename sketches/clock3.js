registerSketch('sk4', function (p) {
  let centerImg;

  // ===== COLOR SETTINGS =====
  const BG_COLOR = 245;
  const RING_STROKE_COLOR = 180;
  const RING_STROKE_WEIGHT = 2;
  const DOT_FILL_COLOR = 30;
  const CENTER_STROKE_COLOR = 200;

  p.preload = function () {
    centerImg = p.loadImage('./images/IMG_1690.JPG');
  };

  p.setup = function () {
    p.createCanvas(p.windowWidth, p.windowHeight);
    p.angleMode(p.RADIANS);
    p.imageMode(p.CENTER);
    p.textAlign(p.CENTER, p.CENTER);
  };

  p.draw = function () {
    p.background(BG_COLOR);

    const cx = p.width / 2;
    const cy = p.height / 2 - 40;

    const rings = [
      { r: 220, value: p.month() - 1, max: 12 },          // month
      { r: 185, value: p.day() - 1, max: daysInMonth() }, // day
      { r: 150, value: p.hour(), max: 24 },               // hour
      { r: 115, value: p.minute(), max: 60 },             // minute
      { r: 80,  value: p.second(), max: 60 }              // seconds (NEW)
    ];

    drawRings(cx, cy, rings);
    drawCenterImage(cx, cy);
    drawDateText(cx, cy + 260);
  };

  function drawCenterImage(cx, cy) {
    const outerDiameter = 100;
    const imgSize = 90;
    const radius = imgSize / 2;

    // background circle
    p.noStroke();
    p.fill(255);
    p.ellipse(cx, cy, outerDiameter);

    // clipped image
    p.push();
    p.translate(cx, cy);

    const ctx = p.drawingContext;
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.clip();

    if (centerImg) {
      p.image(centerImg, 0, 0, imgSize, imgSize);
    }

    ctx.restore();
    p.pop();

    // outline
    p.noFill();
    p.stroke(CENTER_STROKE_COLOR);
    p.strokeWeight(1);
    p.ellipse(cx, cy, outerDiameter);
  }

  function drawRings(cx, cy, rings) {
    rings.forEach(ring => {
      // ring outline
      p.push();
      p.noFill();
      p.stroke(RING_STROKE_COLOR);
      p.strokeWeight(RING_STROKE_WEIGHT);
      p.ellipse(cx, cy, ring.r * 2);
      p.pop();

      // moving dot
      const angle = p.map(
        ring.value,
        0,
        ring.max,
        -p.HALF_PI,
        p.TWO_PI - p.HALF_PI
      );

      const x = cx + p.cos(angle) * ring.r;
      const y = cy + p.sin(angle) * ring.r;

      p.push();
      p.noStroke();
      p.fill(DOT_FILL_COLOR);
      p.ellipse(x, y, 8, 8);
      p.pop();
    });
  }

  function drawDateText(x, y) {
    const now = new Date();
    p.fill(50);
    p.textSize(16);
    p.text(now.toLocaleString(), x, y);
  }

  function daysInMonth() {
    const y = p.year();
    const m = p.month();
    return new Date(y, m, 0).getDate();
  }

  p.windowResized = function () {
    p.resizeCanvas(p.windowWidth, p.windowHeight);
  };
});
