registerSketch('sk5', function (p) {

let table;
let mapImg;

let points = [];
let hovered = null;

// canvas layout
const W = 900;
const H = 1200;
const MAP_TOP = 180;
const MAP_HEIGHT = 450;

p.preload = function () {
  table = p.loadTable('data/top_10_deadliest_earthquakes.csv', 'csv', 'header');
  mapImg = p.loadImage('images/world_map.PNG');
};

p.setup = function () {
  p.createCanvas(W, H);
  parseData();
};

function parseData() {

  for (let r of table.rows) {

    const lat = parseFloat(r.get('Latitude'));
    const lon = parseFloat(r.get('Longitude')) || parseFloat(r.get('Altitude'));

    const deaths = parseFloat(r.get('Deaths'));
    const mag = parseFloat(r.get('Mag'));

    points.push({
      lat,
      lon,
      deaths,
      mag,
      location: r.get('Location Name'),
      time: r.get('Event DateTime')
    });
  }
}

function project(lat, lon) {
  const x = p.map(lon, -180, 180, 0, W);
  const y = p.map(lat, 90, -90, MAP_TOP, MAP_TOP + MAP_HEIGHT);
  return [x, y];
}

function magColor(m) {
  return p.lerpColor(
    p.color('#ffe66d'),
    p.color('#b10000'),
    p.map(m, 6, 9.5, 0, 1, true)
  );
}

function deathSize(d) {
  return p.map(d, 1000, 250000, 8, 45, true);
}

p.draw = function () {

  p.background(255);
  hovered = null;

  drawTitle();
  drawMap();
  drawPoints();
  drawTooltip();
  drawSource();
};

function drawTitle() {

  p.textAlign(p.CENTER);
  p.fill(30);

  p.textSize(36);
  p.text('10 Deadliest Earthquakes in the 21st Century', W/2, 60);

  p.textSize(16);
  p.fill(80);
  p.text(
    'The 10 deadliest earthquakes in the 21st century took a collective death toll of over 610,000 people.\nNine of these earthquakes took place in Asia.',
    W/2,
    95
  );
}

function drawMap() {
  p.image(mapImg, 0, MAP_TOP, W, MAP_HEIGHT);
}

function drawPoints() {

  for (let pt of points) {

    const [x, y] = project(pt.lat, pt.lon);
    const s = deathSize(pt.deaths);

    p.noStroke();
    p.fill(magColor(pt.mag));
    p.ellipse(x, y, s);

    if (p.dist(p.mouseX, p.mouseY, x, y) < s/2) {
      hovered = pt;
    }
  }
}

function drawTooltip() {

  if (!hovered) return;

  const txt =
`${hovered.location}
${hovered.time}
Magnitude: ${hovered.mag}
Deaths: ${hovered.deaths.toLocaleString()}`;

  const w = 220;
  const h = 90;

  const x = p.mouseX + 12;
  const y = p.mouseY + 12;

  p.fill(255);
  p.stroke(0);
  p.rect(x, y, w, h, 6);

  p.noStroke();
  p.fill(0);
  p.textAlign(p.LEFT);
  p.textSize(12);
  p.text(txt, x+8, y+16);
}

function drawSource() {

  p.fill(100);
  p.textAlign(p.CENTER);
  p.textSize(12);
  p.text(
    'Data Source: National Oceanic and Atmospheric Administration (NOAA)',
    W/2,
    H - 20
  );
}

});
