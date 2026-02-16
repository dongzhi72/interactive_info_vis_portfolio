registerSketch('sk5', function (p) {
  // Leaflet + p5 implementation (no Mappa).
  // This creates a Leaflet map inside the sketch container and overlays a p5 canvas
  // so the real interactive map (tiles, zoom, pan) is shown and p5 draws points on top.

  const HOST_ID = 'sketch-container-sk5';
  const MAP_DIV_ID = 'leaflet-map-sk5';

  let table;
  let points = [];
  let hovered = null;
  let mapDiv, leafletMap;
  let barDiv;

  const MAP_OPTIONS = {
    center: [20, 0],
    zoom: 2
  };

  p.preload = function () {
    table = p.loadTable('data/top_10_deadliest_earthquakes.csv', 'csv', 'header');
  };

  p.setup = function () {
    const host = document.getElementById(HOST_ID) || (function () {
      const f = document.createElement('div');
      f.id = HOST_ID;
      document.body.appendChild(f);
      return f;
    })();

    // ⭐ 新增：让整个可视化居中 + 限制宽度
    host.style.maxWidth = '730px';   // 控制整体宽度（适合社媒截图）
    host.style.margin = '40px auto'; // 水平居中
    host.style.padding = '10px 20px';
    host.style.background = '#ffffff';
    host.style.boxShadow = '0 6px 20px rgba(0,0,0,0.08)';
    host.style.borderRadius = '12px';

    // build DOM: title above, wrapper (map + legend) below, source under wrapper
    // Title
    let titleEl = document.getElementById(HOST_ID + '-title');
    if (!titleEl) {
      titleEl = document.createElement('div');
      titleEl.id = HOST_ID + '-title';
      titleEl.style.marginBottom = '8px';
      titleEl.style.textAlign = 'center';
      titleEl.innerHTML = `
      <h2 style="margin:4px 0; font-size: 35px;">
        10 Deadliest Earthquakes in the 21st Century
      </h2>
      <div style="color:#555; font-size: 13px; line-height: 1.2;">
        These 10 earthquakes took a collective death toll of over 610,000 people. <br>
        Nine of them took place in Asia, while the most devastating one struck the Caribbean.
      </div>
      `;
      host.appendChild(titleEl);
    }

    // wrapper: flex container for map + legend
    let wrapper = document.getElementById(HOST_ID + '-wrap');
    if (!wrapper) {
      wrapper = document.createElement('div');
      wrapper.id = HOST_ID + '-wrap';
      wrapper.style.display = 'flex';
      wrapper.style.gap = '12px';
      host.appendChild(wrapper);
    }

    // Create map container inside wrapper
    mapDiv = document.getElementById(MAP_DIV_ID);
    if (!mapDiv) {
      mapDiv = document.createElement('div');
      mapDiv.id = MAP_DIV_ID;
      mapDiv.style.position = 'relative';
      mapDiv.style.flex = '0 0 620px'; // ⭐ 控制地图宽度
      mapDiv.style.height = '400px';
      wrapper.appendChild(mapDiv);
    } else if (!mapDiv.parentElement || mapDiv.parentElement.id !== wrapper.id) {
      wrapper.appendChild(mapDiv);
    }

    // Create legend container (right side)
    let legend = document.getElementById(HOST_ID + '-legend');
    if (!legend) {
      legend = document.createElement('div');
      legend.id = HOST_ID + '-legend';
      legend.style.width = '100px';
      legend.style.flex = '0 0 100px';
      legend.style.fontFamily = 'system-ui, Arial';
      legend.style.fontSize = '13px';
      legend.style.color = '#222';
      legend.innerHTML = `
        <div style="font-weight:600;margin-bottom:6px">Legend</div>
        <div style="margin-bottom:8px"><div style="font-weight:500">Magnitude</div>
          <div style="height:12px;width:100%;background:linear-gradient(90deg,#ffe66d,#b10000);border-radius:4px;margin-top:6px"></div>
          <div style="display:flex;justify-content:space-between;color:#666;font-size:12px;margin-top:6px"><span>Low</span><span>High</span></div>
        </div>
        <div><div style="font-weight:500">Deaths</div>
          <svg width="160" height="90" style="margin-top:6px">
            <circle cx="18" cy="18" r="4" stroke="#000" fill="none"></circle>
            <text x="40" y="22" font-size="12">1k</text>
            <circle cx="18" cy="48" r="10" stroke="#000" fill="none"></circle>
            <text x="40" y="52" font-size="12">50k</text>
            <circle cx="18" cy="78" r="20" stroke="#000" fill="none"></circle>
            <text x="40" y="82" font-size="12">200k+</text>
          </svg>
        </div>`;
      wrapper.appendChild(legend);
    } else if (!legend.parentElement || legend.parentElement.id !== wrapper.id) {
      wrapper.appendChild(legend);
    }

    // initialize Leaflet map
    if (typeof L === 'undefined') {
      console.error('Leaflet (L) not available. Make sure Leaflet is loaded in index.html');
    } else {
      if (mapDiv._leaflet_id && mapDiv._leaflet_id > 0) {
        try { leafletMap.remove(); } catch (e) { /* ignore */ }
      }
      leafletMap = L.map(mapDiv, MAP_OPTIONS);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(leafletMap);
    }

    // create p5 canvas and overlay on top of the map div (for points and tooltip only)
    const w = mapDiv.clientWidth || 600;
    const h = mapDiv.clientHeight || 400;
    const cnv = p.createCanvas(w, h);
    cnv.parent(mapDiv);
    cnv.style('position', 'absolute');
    cnv.style('top', '0px');
    cnv.style('left', '0px');
    cnv.style('pointer-events', 'auto');
    cnv.style('z-index', '400');

    // ⭐ 新增：bar chart 容器（在 source 上方）
    barDiv = document.getElementById(HOST_ID + '-bars');
    if (!barDiv) {
      barDiv = document.createElement('div');
      barDiv.id = HOST_ID + '-bars';
      barDiv.style.marginTop = '14px';
      barDiv.style.padding = '8px 10px 2px 10px';
      barDiv.style.fontFamily = 'system-ui, Arial';
      host.appendChild(barDiv);
    }

    parseData();
    computeRanks();
    drawBarChart(barDiv);

    // redraw when the map moves or zooms
    if (leafletMap) {
      leafletMap.on('move zoom', () => p.redraw());
    }

    p.noLoop();
    p.redraw();

    // ⭐ 新增：鼠标移动时触发重绘（实现 hover）
    p.mouseMoved = function () {
      p.redraw();
    };

    p.mouseOut = function () {
      hovered = null;
      p.redraw();
    };


    let source = document.getElementById(HOST_ID + '-source');
    if (!source) {
      source = document.createElement('div');
      source.id = HOST_ID + '-source';
      source.style.marginTop = '8px';
      source.style.fontSize = '11px';
      source.style.color = '#666';
      source.style.textAlign = 'center';
      source.innerHTML =
        'Data Source: National Oceanic and Atmospheric Administration (NOAA)';
      host.appendChild(source);
    }

  };

  function parseData() {
    points = [];
    for (let r of table.rows) {
      points.push({
        lat: parseFloat(r.get('Latitude')),
        lon: parseFloat(r.get('Longitude')),
        deaths: +r.get('Deaths'),
        mag: +r.get('Mag'),
        location: r.get('Location Name'),
        country: r.get('Country'),  // ⭐ 直接存储 Country
        year: parseInt(r.get('Year')),
        time: r.get('Event DateTime') || r.get('Event DateTime')
      });
    }
  }

  function computeRanks() {
    const sorted = [...points].sort((a, b) => b.deaths - a.deaths);
    sorted.forEach((pt, i) => {
      pt.rank = i + 1;
    });
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
    p.clear();
    hovered = null;
    drawPoints();
    drawTooltip();
  };

  function drawTitle() {
    p.textAlign(p.CENTER);
    p.fill(20);

    p.textSize(24);
    p.text('10 Deadliest Earthquakes in the 21st Century', p.width / 2, 24);

    p.textSize(12);
    p.fill(80);
    p.text(
      'The 10 deadliest earthquakes in the 21st century took a collective death toll of over 610,000 people.',
      p.width / 2,
      44
    );
  }

  function drawPoints() {
    if (!leafletMap) return;

    p.textAlign(p.LEFT, p.CENTER);
    p.textSize(14); // ⭐ 标签字号（可调大一点）
    p.fill(30);     // 深灰色文字更柔和

    for (let pt of points) {
      const latlng = L.latLng(pt.lat, pt.lon);
      const pos = leafletMap.latLngToContainerPoint(latlng);
      const s = deathSize(pt.deaths);

      // draw circle
      p.noStroke();
      p.fill(magColor(pt.mag));
      p.circle(pos.x, pos.y, s);

      // ⭐ 标签文本（标号）
      const label = `#${pt.rank}`;

      // 标签位置（右上角偏移）
      p.fill(20);
      p.text(label, pos.x + s / 2 + 4, pos.y - s / 2 - 2);

      // hover detection
      if (p.dist(p.mouseX, p.mouseY, pos.x, pos.y) < s / 2 + 2) {
        hovered = pt;
      }
    }
  }


  function drawTooltip() {
    if (!hovered) return;

    const padding = 10;
    const boxX = p.mouseX + 12;
    const boxY = p.mouseY + 12;
    const boxW = 230;
    const boxH = 90;

    const txt = `${hovered.location}
    ${hovered.time}
    Magnitude: ${hovered.mag}
    Deaths: ${hovered.deaths.toLocaleString()}`;

    // 背景框
    p.fill(255);
    p.stroke(0);
    p.rect(boxX, boxY, boxW, boxH, 6);

    // 文本设置
    p.noStroke();
    p.fill(0);
    p.textAlign(p.LEFT, p.TOP);     // ⭐ 关键：改为 TOP 对齐
    p.textSize(12);
    p.textLeading(16);              // ⭐ 控制行距

    // 从 padding 内开始画
    p.text(txt, boxX + padding, boxY + padding);
  }


  function drawLegends() {
    const x = p.width - 140;
    const y = p.height - 160;

    p.textAlign(p.LEFT);
    p.fill(0);
    p.textSize(12);

    p.text('Magnitude', x, y - 15);
    for (let i = 0; i < 80; i++) {
      p.stroke(p.lerpColor(p.color('#ffe66d'), p.color('#b10000'), i / 80));
      p.line(x + i, y, x + i, y + 8);
    }

    p.noStroke();
    p.text('Low', x, y + 12);
    p.text('High', x + 55, y + 12);

    const sy = y + 40;
    p.text('Deaths', x, sy - 12);
    p.noFill();
    p.stroke(0);
    p.circle(x + 15, sy, 8);
    p.circle(x + 15, sy + 24, 20);
    p.circle(x + 15, sy + 56, 40);
    p.noStroke();
    p.fill(0);
    p.text('1k', x + 40, sy + 4);
    p.text('50k', x + 40, sy + 28);
    p.text('200k+', x + 40, sy + 60);
  }

  function drawSource() {
    p.fill(100);
    p.textAlign(p.CENTER);
    p.textSize(10);
    p.text('Data Source: National Oceanic and Atmospheric Administration (NOAA)', p.width / 2, p.height - 8);
  }

  function drawBarChart(container) {
    if (!points || points.length === 0) return;

    // 按死亡人数排序（从大到小）
    const sorted = [...points].sort((a, b) => b.deaths - a.deaths);

    const maxDeaths = Math.max(...sorted.map(d => d.deaths));
    const barMaxWidth = 340; // 控制最长条宽度

    let html = `
    <div style="display:flex;align-items:center; margin-top:0px; margin-bottom:4px;
                font-weight:normal;border-bottom:1px solid #ddd;padding-bottom:2px">
      <div style="width:26px">#</div>
      <div style="width:48px">Year</div>
      <div style="flex:1">Location (Magnitude)</div>
      <div style="width:70px;text-align:right">Deaths</div>
    </div>
    `;

    for (let i = 0; i < sorted.length; i++) {
      const d = sorted[i];
      const w = (d.deaths / maxDeaths) * barMaxWidth;

      html += `
      <div style="display:flex;align-items:center;margin:4px 0;font-size:14px">
        <div style="width:26px;color:#b10000;font-weight:600">${i + 1}</div>
        <div style="width:48px;color:#333">${d.year}</div>
        <div style="flex:1;color:#333">
          ${d.location}
          <span style="color:#777;font-size:13px"> (M${d.mag})</span>
        </div>
        <div style="height:14px;width:${w}px;background:#b10000;margin:0 10px;border-radius:3px"></div>
        <div style="width:70px;text-align:right;color:#222">
          ${d.deaths.toLocaleString()}
        </div>
      </div>
    `;
    }

    container.innerHTML = html;
  }


});
