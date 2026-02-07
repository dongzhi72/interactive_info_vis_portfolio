// Instance-mode sketch registered as 'sk6'
registerSketch('sk6', function (p) {
  // ----- TIMER STATE -----
  let isRunning = false;
  let startTime = 0;
  let elapsedTime = 0;

  // ----- UI -----
  let startButton;
  let stopButton;
  let resetButton;

  // ----- VISUAL CONFIG -----
  const bottleWidth = 80;
  const bottleHeight = 180;
  const bottleGap = 30;
  const bottleTopY = 120;

  p.setup = function () {
    p.createCanvas(p.windowWidth, p.windowHeight);
    p.textFont('Helvetica');

    startButton = p.createButton('START');
    startButton.position(40, 80);
    startButton.mousePressed(startTimer);

    stopButton = p.createButton('STOP');
    stopButton.position(40, 130);
    stopButton.mousePressed(stopTimer);

    resetButton = p.createButton('RESET');
    resetButton.position(40, 180);
    resetButton.mousePressed(resetTimer);
  };

  p.draw = function () {
    p.background(245);

    drawBottles();
    drawElapsedTime();
  };

  // ----- TIMER LOGIC -----
  function startTimer() {
    if (!isRunning) {
      isRunning = true;
      startTime = p.millis();
    }
  }

  function stopTimer() {
    if (isRunning) {
      elapsedTime += p.millis() - startTime;
      isRunning = false;
    }
  }

  function resetTimer() {
    isRunning = false;
    elapsedTime = 0;
    startTime = 0;
  }

  function getTotalElapsed() {
    if (isRunning) {
      return elapsedTime + (p.millis() - startTime);
    }
    return elapsedTime;
  }

  // ----- DRAWING -----
  function drawBottles() {
    const totalMs = getTotalElapsed();
    const hours = totalMs / (1000 * 60 * 60);

    const bottleCount = Math.max(1, Math.floor(hours) + 1);

    for (let i = 0; i < bottleCount; i++) {
      const bottleX = 160 + i * (bottleWidth + bottleGap);
      let fillAmount = hours - i;
      fillAmount = p.constrain(fillAmount, 0, 1);
      drawBottle(bottleX, bottleTopY, fillAmount);
    }
  }

  function drawBottle(x, y, fillAmount) {
    p.noFill();
    p.stroke(80);
    p.strokeWeight(2);
    p.rect(x, y, bottleWidth, bottleHeight, 10);
    p.rect(x + 20, y - 20, bottleWidth - 40, 20, 5);

    const fillHeight = bottleHeight * fillAmount;
    p.noStroke();
    p.fill(80, 120, 200);
    p.rect(
      x,
      y + bottleHeight - fillHeight,
      bottleWidth,
      fillHeight,
      0, 0, 10, 10
    );
  }

  function drawElapsedTime() {
    const totalMs = getTotalElapsed();
    const totalSeconds = Math.floor(totalMs / 1000);

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const timeStr =
      'Elapsed time: ' +
      p.nf(hours, 2) + ':' +
      p.nf(minutes, 2) + ':' +
      p.nf(seconds, 2);

    p.noStroke();
    p.fill(30);
    p.textSize(18);
    p.text(timeStr, 160, bottleTopY + bottleHeight + 40);
  }

  p.windowResized = function () {
    p.resizeCanvas(p.windowWidth, p.windowHeight);
  };
});
