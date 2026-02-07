// Instance-mode sketch registered as 'sk5'
registerSketch('sk5', function (p) {


 // ------------------------
 // State & constants
 // ------------------------
 // UI controls removed for a simpler, automatic system-clock version

 const dayColor = [255, 185, 60];   // warm yellow/orange
 const nightColor = [20, 35, 90];   // deep blue
 const transWindow = 0.5;           // hours (30 minutes)


 // ------------------------
 // p5 lifecycle
 // ------------------------
 p.setup = function () {
   p.createCanvas(760, 520);
   p.angleMode(p.RADIANS);
   p.textFont('Helvetica');
 };


 p.draw = function () {
   p.background(245);

   // Fixed sunrise/sunset defaults (previously from sliders)
   const sunrise = 7.0;
   const sunset = 18.5;

   // Always use system time
   const d = new Date();
   const nowDecimal = d.getHours() + d.getMinutes() / 60 + d.getSeconds() / 3600;

   const isPM = nowDecimal >= 12;
   const base = isPM ? 12 : 0;
   const dialLabel = isPM ? 'PM dial' : 'AM dial';

   p.fill(30);
   p.noStroke();
   p.textSize(16);
   p.textAlign(p.LEFT, p.CENTER);
   p.text(
     `Current time (hours, decimal): ${p.nf(nowDecimal, 2, 3)}   Sunrise: ${formatHour(sunrise)}   Sunset: ${formatHour(sunset)}   Display: ${dialLabel}`,
     18,
     18
   );

   p.push();
   p.translate(p.width / 2, p.height / 2 + 10);
   drawDial(base, sunrise, sunset, nowDecimal);
   p.pop();
 };


 // ------------------------
 // Drawing helpers
 // ------------------------
 function drawDial(baseHour, sunrise, sunset, nowDecimal) {
   const R = 160;
   const thickness = 28;
   const innerR = R - thickness / 2;
   const startAngle = -p.HALF_PI;
   const endAngle = startAngle + p.TWO_PI;

   p.noFill();
   p.stroke(220);
   p.strokeWeight(thickness);
   p.strokeCap(p.SQUARE);
   p.arc(0, 0, R * 2, R * 2, startAngle, endAngle);

   p.strokeCap(p.ROUND);
   for (let i = 0; i <= 360; i++) {
     const t = i / 360;
     const ang0 = p.lerp(startAngle, endAngle, t);
     const ang1 = p.lerp(startAngle, endAngle, (i + 1) / 360);

     let absTime = normalizeHour(baseHour + t * 12);
     const c = colorForAbsoluteTime(absTime, sunrise, sunset);

     p.stroke(c);
     p.strokeWeight(thickness);
     p.line(
       p.cos(ang0) * innerR,
       p.sin(ang0) * innerR,
       p.cos(ang1) * innerR,
       p.sin(ang1) * innerR
     );
   }

   // ticks & labels
   p.stroke(40);
   for (let k = 0; k < 12; k += 3) {
     const ang = p.lerp(startAngle, endAngle, k / 12);
     p.strokeWeight(2);
     p.line(
       p.cos(ang) * (R - 18),
       p.sin(ang) * (R - 18),
       p.cos(ang) * (R + 10),
       p.sin(ang) * (R + 10)
     );

     p.noStroke();
     p.fill(30);
     p.textSize(14);
     p.textAlign(p.CENTER, p.CENTER);
     const labelHour = normalizeHour(baseHour + k);
     p.text(
       getLabelForAbsoluteHour(labelHour),
       p.cos(ang) * (R + 28),
       p.sin(ang) * (R + 28)
     );
   }

   // center
   p.fill(250);
   p.stroke(200);
   p.ellipse(0, 0, 40, 40);

   // current time marker
   const localHour = (nowDecimal - baseHour + 24) % 12;
   const angNow = p.lerp(startAngle, endAngle, localHour / 12);
   const px = p.cos(angNow) * innerR;
   const py = p.sin(angNow) * innerR;

   if (isDaytime(nowDecimal, sunrise, sunset)) {
     drawSun(px, py, 18);
   } else {
     drawMoon(px, py, 18);
   }
 }


 // ------------------------
 // Time & color logic
 // ------------------------
 function colorForAbsoluteTime(absTime, sunrise, sunset) {
   absTime = normalizeHour(absTime);

   const srStart = normalizeHour(sunrise - transWindow);
   const srEnd = normalizeHour(sunrise + transWindow);
   const ssStart = normalizeHour(sunset - transWindow);
   const ssEnd = normalizeHour(sunset + transWindow);

   const inInterval = (t, a, b) =>
     a <= b ? t >= a && t <= b : t >= a || t <= b;

   if (inInterval(absTime, srStart, srEnd)) {
     const f = ((absTime - srStart + 24) % 24) / (transWindow * 2);
     return p.lerpColor(p.color(...nightColor), p.color(...dayColor), p.constrain(f, 0, 1));
   }

   if (inInterval(absTime, ssStart, ssEnd)) {
     const f = ((absTime - ssStart + 24) % 24) / (transWindow * 2);
     return p.lerpColor(p.color(...dayColor), p.color(...nightColor), p.constrain(f, 0, 1));
   }

   return inInterval(absTime, srEnd, ssStart)
     ? p.color(...dayColor)
     : p.color(...nightColor);
 }

 function isDaytime(t, sunrise, sunset) {
   t = normalizeHour(t);
   const start = normalizeHour(sunrise + transWindow);
   const end = normalizeHour(sunset - transWindow);
   return start <= end ? t >= start && t <= end : t >= start || t <= end;
 }

 function normalizeHour(h) {
   h %= 24;
   return h < 0 ? h + 24 : h;
 }

 function getLabelForAbsoluteHour(h) {
   h = Math.round(normalizeHour(h));
   if (h === 0) return '12AM';
   if (h < 12) return `${h}AM`;
   if (h === 12) return '12PM';
   return `${h - 12}PM`;
 }

 function formatHour(h) {
   h = normalizeHour(h);
   const hh = Math.floor(h);
   const mm = Math.floor((h - hh) * 60);
   return `${p.nf(hh, 2)}:${p.nf(mm, 2)}`;
 }


 // ------------------------
 // Icons
 // ------------------------
 function drawSun(x, y, r) {
   p.push();
   p.translate(x, y);
   p.noStroke();
   p.fill(dayColor);
   p.ellipse(0, 0, r, r);
   p.stroke(dayColor);
   for (let a = 0; a < p.TWO_PI; a += p.PI / 6) {
     p.line(
       p.cos(a) * r * 0.7,
       p.sin(a) * r * 0.7,
       p.cos(a) * r * 1.2,
       p.sin(a) * r * 1.2
     );
   }
   p.pop();
 }

 function drawMoon(x, y, r) {
   p.push();
   p.translate(x, y);
   p.noStroke();
   p.fill(240);
   p.ellipse(0, 0, r, r);
   p.fill(20, 35, 90);
   p.ellipse(r * 0.2, -r * 0.05, r, r);
   p.pop();
 }


});



