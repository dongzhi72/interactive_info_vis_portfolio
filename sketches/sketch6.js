// Example 2
registerSketch('sk6', function (p) {
  p.setup = function () {
    p.createCanvas(p.windowWidth, p.windowHeight);
    // clockFont = p.loadFont("digital-7.ttf");
  };

  p.draw = function () {
    p.background(0);
    p.clock();
  }

  p.clock = function () {
    let hr = p.hour();
    let mn = p.minute();
    let sc = p.second();

    p.fill("orange");
    // p.textFont(clockFont);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(p.width / 10);
    let noon = hr >= 12 ? " PM" : " AM"
    if (mn < 10)
      mn = "0" + mn
    hr %= 12
    p.text(hr + ":" + mn + ":" + sc + noon, p.width / 2, p.height / 2);

  }

  p.windowResized = function () { p.resizeCanvas(p.windowWidth, p.windowHeight); };
});
