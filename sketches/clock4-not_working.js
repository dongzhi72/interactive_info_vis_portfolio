registerSketch('sk18', function (p) {
  const SAMPLE_INTERVAL_MS = 1000;
  const ELEV_MIN = -30;
  const ELEV_MAX = 30;

  let setTimeInput, startButton, stopButton, elevSlider, infoLabel;

  let isRunning = false;
  let startMillis = 0;
  let accumulatedMs = 0;
  let lastSampleAt = 0;
  let samples = [];

  const margin = 40;

  p.setup = function () {
    p.createCanvas(p.windowWidth, p.windowHeight);
    p.textFont('Helvetica');
    p.noSmooth();
    createControls();
  };

  function createControls() {
    const x = p.width - 320;
    let y = 40;

    p.createP('Hike Timer – Stage 1').position(x, y);
    y += 36;

    p.createSpan('Planned time (hr):').position(x, y);
    setTimeInput = p.createInput('1', 'number');
    setTimeInput.attribute('step', '0.25');
    setTimeInput.position(x + 160, y);
    setTimeInput.size(80);
    y += 36;

    p.createSpan('Simulated elevation (m):').position(x, y);
    elevSlider = p.createSlider(ELEV_MIN, ELEV_MAX, 0, 1);
    elevSlider.position(x + 160, y);
    elevSlider.size(120);
    y += 50;

    startButton = p.createButton('START');
    startButton.position(x, y);
    startButton.mousePressed(startSession);

    stopButton = p.createButton('STOP');
    stopButton.position(x + 100, y);
    stopButton.mousePressed(stopSession);
    y += 40;

    infoLabel = p.createP('');
    infoLabel.position(x, y);
  }

  p.draw = function () {
    p.background(250);

    const graphX = margin;
    const graphY = margin;
    const graphW = Math.max(400, p.width * 0.6);
    const graphH = p.height * 0.5;

    const barX = graphX;
    const barY = graphY + graphH + 40;
    const barW = graphW;
    const barH = 26;

    updateSampling();
    drawGraph(graphX, graphY, graphW, graphH);
    drawLoadingBar(barX, barY, barW, barH);

    p.noStroke();
    p.fill(80);
    p.textSize(14);
    p.text('user exercising...', barX, barY + barH + 22);
  };

  function startSession() {
    if (!isRunning) {
      isRunning = true;
      startMillis = p.millis();
      lastSampleAt = p.millis();

      if (samples.length === 0) {
        samples.push({ tSec: 0, elev: elevSlider.value() });
      }
    }
  }

  function stopSession() {
    if (isRunning) {
      accumulatedMs += p.millis() - startMillis;
      isRunning = false;
    }
  }

  function updateSampling() {
    const now = p.millis();
    let elapsedMs = accumulatedMs;
    if (isRunning) elapsedMs += now - startMillis;

    if (isRunning && now - lastSampleAt >= SAMPLE_INTERVAL_MS) {
      samples.push({
        tSec: elapsedMs / 1000,
        elev: elevSlider.value()
      });
      lastSampleAt = now;
    }

    infoLabel.html(
      `Elapsed: ${formatElapsed(elapsedMs)}`
    );
  }

  function drawGraph(x, y, w, h) {
    p.noFill();
    p.stroke(200);
    p.rect(x, y, w, h);

    const zeroY = y + h / 2;
    p.stroke(180);
    p.line(x, zeroY, x + w, zeroY);

    if (samples.length < 2) return;

    const visibleSec = Math.max(5, samples[samples.length - 1].tSec);

    p.stroke(40, 130, 220);
    p.strokeWeight(2);
    p.noFill();
    p.beginShape();
    for (let s of samples) {
      const tx = x + (s.tSec / visibleSec) * w;
      const ty = p.map(s.elev, ELEV_MIN, ELEV_MAX, y + h, y);
      p.vertex(tx, ty);
    }
    p.endShape();

    const last = samples[samples.length - 1];
    const lastX = x + (last.tSec / visibleSec) * w;
    const lastY = p.map(last.elev, ELEV_MIN, ELEV_MAX, y + h, y);

    p.stroke(0);
    p.strokeWeight(2);
    p.fill(255, 80, 80);
    p.ellipse(lastX, lastY, 14, 14);
  }

  function drawLoadingBar(x, y, w, h) {
    const plannedMs = getPlannedHours() * 3600 * 1000;
    let elapsedMs = accumulatedMs;
    if (isRunning) elapsedMs += p.millis() - startMillis;

    const progress = p.constrain(elapsedMs / plannedMs, 0, 1);

    p.noStroke();
    p.fill(230);
    p.rect(x, y, w, h, 6);

    p.fill(80, 140, 220);
    p.rect(x, y, w * progress, h, 6);

    p.noFill();
    p.stroke(150);
    p.rect(x, y, w, h, 6);
  }

  function getPlannedHours() {
    const v = parseFloat(setTimeInput.value());
    return isNaN(v) || v <= 0 ? 1 : v;
  }

  // fixed: use p.nf in instance mode
  function formatElapsed(ms) {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const h = Math.floor(m / 60);
    return `${h}:${p.nf(m % 60, 2)}:${p.nf(s % 60, 2)}`;
  }

  p.windowResized = () => p.resizeCanvas(p.windowWidth, p.windowHeight);
});
