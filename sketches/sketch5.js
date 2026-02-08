// Example 2
registerSketch('sk5', function (p) {
  p.setup = function () {
    p.createCanvas(p.windowWidth, p.windowHeight);
  };

  p.draw = function () {
    p.background(250);

    // Corner time display
    const h = p.hour();
    const m = p.minute();
    const s = p.second();
    const label = p.nf(h, 2) + ':' + p.nf(m, 2) + ':' + p.nf(s, 2);

    p.noStroke();
    p.fill(20);
    p.textAlign(p.LEFT, p.TOP);  // change to RIGHT/BOTTOM for other corners
    p.textSize(50);
    p.text(label, 12, 10);   // top-left corner

  }

  p.windowResized = function () { p.resizeCanvas(p.windowWidth, p.windowHeight); };
});
