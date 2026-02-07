// Instance-mode sketch registered as 'sk5'
registerSketch('sk5', function (p) {
    // ------------------------
    // State & constants
    // ------------------------
    const dayColor = [255, 185, 60];
    const nightColor = [20, 35, 90];
    const transWindow = 0.5;

    let sunriseSlider, sunsetSlider;
    let autoCheckbox, refreshButton;

    // NEW: time control
    let demoTimeSlider;
    let useSystemTimeCheckbox;
    let useSystemTime = true;

    let useAutoLocation = true;
    let computedSun = { sunrise: 7.0, sunset: 18.5 };
    let lastLocation = null;

    // ------------------------
    // Utility helpers
    // ------------------------
    function normalizeHour(h) {
        h %= 24;
        return h < 0 ? h + 24 : h;
    }

    function formatHour(h) {
        h = normalizeHour(h);
        const hh = Math.floor(h);
        const mm = Math.floor((h - hh) * 60);
        return `${p.nf(hh, 2)}:${p.nf(mm, 2)}`;
    }

    // ------------------------
    // Utility helpers
    // ------------------------
    function formatAMPM(decimalHour) {
        decimalHour = decimalHour % 24;
        let hh = Math.floor(decimalHour);
        let mm = Math.floor((decimalHour - hh) * 60);
        const ampm = hh >= 12 ? 'PM' : 'AM';
        hh = hh % 12;
        if (hh === 0) hh = 12;
        return `${hh}:${p.nf(mm, 2)}${ampm}`;
    }


    // ------------------------
    // p5 lifecycle
    // ------------------------
    p.setup = function () {
        p.createCanvas(760, 520);
        p.angleMode(p.RADIANS);
        p.textFont('Helvetica');

        // ===== UI (version-1 style layout) =====
        p.createP('Sunrise / Sunset Parameters');

        // --- Row 1: auto location ---
        let p1 = p.createP('');
        p1.style('margin', '0 0 6px 0');

        autoCheckbox = p
            .createCheckbox('Use current location to auto-compute sunrise & sunset', true)
            .parent(p1);

        autoCheckbox.changed(() => {
            useAutoLocation = autoCheckbox.checked();
            if (useAutoLocation) requestLocationAndCompute();
        });

        p.createSpan('    ').parent(p1);

        refreshButton = p
            .createButton('Refresh location & sun times')
            .parent(p1)
            .mousePressed(() => {
                if (useAutoLocation) requestLocationAndCompute();
            });

        // --- Row 2: manual sunrise / sunset ---
        let p2 = p.createP('');
        p2.style('margin', '4px 0 6px 0');

        p.createSpan('Sunrise time (24h): ').parent(p2);
        sunriseSlider = p.createSlider(0, 23.75, 7, 0.25).parent(p2);
        sunriseSlider.style('width', '220px');

        p.createSpan('    ').parent(p2);

        p.createSpan('Sunset time (24h): ').parent(p2);
        sunsetSlider = p.createSlider(0, 23.75, 18.5, 0.25).parent(p2);
        sunsetSlider.style('width', '220px');

        // --- Row 3: current time control (NEW) ---
        let p3 = p.createP('');
        p3.style('margin', '4px 0 8px 0');

        useSystemTimeCheckbox = p
            .createCheckbox('Use system current time', true)
            .parent(p3);

        useSystemTimeCheckbox.changed(() => {
            useSystemTime = useSystemTimeCheckbox.checked();
        });

        p.createSpan('    Demo time: ').parent(p3);
        demoTimeSlider = p.createSlider(0, 24, 12.0, 0.01).parent(p3);
        demoTimeSlider.style('width', '360px');
        p.createSpan(' (hours, e.g. 13.5 = 13:30)').parent(p3);

        requestLocationAndCompute();
    };

    p.draw = function () {
        p.background(245);

        let sunrise = computedSun.sunrise;
        let sunset = computedSun.sunset;

        if (!useAutoLocation) {
            sunrise = sunriseSlider.value();
            sunset = sunsetSlider.value();
            computedSun.sunrise = sunrise;
            computedSun.sunset = sunset;
        }

        // NEW: adjustable current time
        let nowDecimal;
        if (useSystemTime) {
            const d = new Date();
            nowDecimal =
                d.getHours() + d.getMinutes() / 60 + d.getSeconds() / 3600;
        } else {
            nowDecimal = demoTimeSlider.value();
        }

        const isPM = nowDecimal >= 12;
        const base = isPM ? 12 : 0;

        p.fill(30);
        p.noStroke();
        p.textSize(16);
        p.textAlign(p.LEFT, p.CENTER);
        p.text(
            `Current time: ${formatAMPM(nowDecimal)}   Sunrise: ${formatAMPM(sunrise)}   Sunset: ${formatAMPM(sunset)}`,
            18,
            18
        );


        p.textSize(12);
        p.text(
            lastLocation
                ? `Location: ${lastLocation.lat.toFixed(4)}, ${lastLocation.lng.toFixed(4)}`
                : 'Location: manual',
            18,
            40
        );

        p.push();
        p.translate(p.width / 2, p.height / 2 + 10);
        drawDial(base, sunrise, sunset, nowDecimal);
        p.pop();
    };

    // ------------------------
    // Drawing
    // ------------------------
    function drawDial(baseHour, sunrise, sunset, nowDecimal) {
        const R = 160;
        const thickness = 28;
        const innerR = R - thickness / 2;
        const startAngle = -p.HALF_PI;

        // background dial
        p.noFill();
        p.stroke(220);
        p.strokeWeight(thickness);
        p.arc(0, 0, R * 2, R * 2, startAngle, startAngle + p.TWO_PI);

        for (let i = 0; i <= 360; i++) {
            const t = i / 360;
            const a0 = p.lerp(startAngle, startAngle + p.TWO_PI, t);
            const a1 = p.lerp(startAngle, startAngle + p.TWO_PI, (i + 1) / 360);
            const absTime = normalizeHour(baseHour + t * 12);
            p.stroke(colorForAbsoluteTime(absTime, sunrise, sunset));
            p.line(
                p.cos(a0) * innerR,
                p.sin(a0) * innerR,
                p.cos(a1) * innerR,
                p.sin(a1) * innerR
            );
        }

        // ===== ticks & labels =====
        p.stroke(40);
        for (let k = 0; k < 12; k += 3) { // 每 3 小时一个刻度
            const ang = p.lerp(startAngle, startAngle + p.TWO_PI, k / 12);
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
            let labelText;
            if (labelHour === 0) labelText = '12AM';
            else if (labelHour < 12) labelText = `${labelHour}AM`;
            else if (labelHour === 12) labelText = '12PM';
            else labelText = `${labelHour - 12}PM`;

            p.text(
                labelText,
                p.cos(ang) * (R + 28),
                p.sin(ang) * (R + 28)
            );
        }

        // currrent time indicator
        const localHour = (nowDecimal - baseHour + 24) % 12;
        const ang = p.lerp(startAngle, startAngle + p.TWO_PI, localHour / 12);
        const x = p.cos(ang) * innerR;
        const y = p.sin(ang) * innerR;

        isDaytime(nowDecimal, sunrise, sunset)
            ? drawSun(x, y, 18)
            : drawMoon(x, y, 18);
    }


    // ------------------------
    // Time & color logic
    // ------------------------
    function colorForAbsoluteTime(t, sunrise, sunset) {
        const sr0 = normalizeHour(sunrise - transWindow);
        const sr1 = normalizeHour(sunrise + transWindow);
        const ss0 = normalizeHour(sunset - transWindow);
        const ss1 = normalizeHour(sunset + transWindow);

        const inRange = (x, a, b) => (a <= b ? x >= a && x <= b : x >= a || x <= b);

        if (inRange(t, sr0, sr1))
            return p.lerpColor(p.color(...nightColor), p.color(...dayColor),
                ((t - sr0 + 24) % 24) / (transWindow * 2));

        if (inRange(t, ss0, ss1))
            return p.lerpColor(p.color(...dayColor), p.color(...nightColor),
                ((t - ss0 + 24) % 24) / (transWindow * 2));

        return inRange(t, sr1, ss0)
            ? p.color(...dayColor)
            : p.color(...nightColor);
    }

    function isDaytime(t, sunrise, sunset) {
        const start = normalizeHour(sunrise + transWindow);
        const end = normalizeHour(sunset - transWindow);
        return start <= end ? t >= start && t <= end : t >= start || t <= end;
    }

    // ------------------------
    // Icons
    // ------------------------
    function drawSun(x, y, r) {
        p.push();
        p.translate(x, y);
        p.noStroke();
        p.fill(255, 251, 202);
        p.ellipse(0, 0, r, r);
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

    // ------------------------
    // Location
    // ------------------------
    function requestLocationAndCompute() {
        if (!navigator.geolocation) return;
        navigator.geolocation.getCurrentPosition((pos) => {
            lastLocation = {
                lat: pos.coords.latitude,
                lng: pos.coords.longitude
            };
            const times = computeSunriseSunset(new Date(), lastLocation.lat, lastLocation.lng);
            if (times) {
                computedSun = times;
                sunriseSlider.value(times.sunrise);
                sunsetSlider.value(times.sunset);
            }
        });
    }

    function computeSunriseSunset(date, lat, lng) {
        return { sunrise: 7.0, sunset: 18.5 };
    }
});
