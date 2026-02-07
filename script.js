// Global registry used by sketch files to register instance-mode factories
window._sketchRegistry = window._sketchRegistry || {};
window._sketchInstances = window._sketchInstances || {};
window._sketchScriptsLoaded = window._sketchScriptsLoaded || {};

window.registerSketch = function (id, factory) {
    window._sketchRegistry[id] = factory;
};

// map sketch ids to script paths
const SKETCH_SCRIPT_BY_ID = {
    sk1: 'sketches/sketch1.js',
    sk2: 'sketches/sketch2.js',
    sk3: 'sketches/sketch3.js',
    sk4: 'sketches/sketch4.js',
    sk5: 'sketches/clock1.js',
    sk6: 'sketches/clock2.js',
    sk7: 'sketches/sketch7.js',
    sk8: 'sketches/sketch8.js',
    sk9: 'sketches/sketch9.js',
    sk10: 'sketches/sketch10.js',
    sk11: 'sketches/sketch11.js',
    sk12: 'sketches/sketch12.js',
    sk13: 'sketches/sketch13.js',
    sk14: 'sketches/sketch14.js',
};

// Default sketch selection logic:
// 1) URL query `?tab=sk3` or `?tab=tab3` will select that tab on load
// 2) or set `window.DEFAULT_SKETCH = 'sk2'` in the page before this script to choose a default
// 3) otherwise the first tab is used
function getDefaultButton(buttons) {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab') || params.get('sketch');
    if (tabParam) {
        // match by dataset.sketch or dataset.target
        const bySketch = Array.from(buttons).find(b => b.dataset.sketch === tabParam);
        if (bySketch) return bySketch;
        const byTarget = Array.from(buttons).find(b => b.dataset.target === tabParam);
        if (byTarget) return byTarget;
    }
    if (typeof window.DEFAULT_SKETCH === 'string') {
        const btn = Array.from(buttons).find(b => b.dataset.sketch === window.DEFAULT_SKETCH);
        if (btn) return btn;
    }
    return buttons[0] || null;
}

function loadSketchScriptIfNeeded(sketchId) {
    return new Promise((resolve, reject) => {
        // if (window._sketchScriptsLoaded[sketchId]) return resolve();
        const src = SKETCH_SCRIPT_BY_ID[sketchId];
        if (!src) return reject(new Error('No script configured for ' + sketchId));
        const s = document.createElement('script');
        s.src = src;
        s.onload = () => { window._sketchScriptsLoaded[sketchId] = true; resolve(); };
        s.onerror = () => reject(new Error('Failed to load ' + src));
        document.body.appendChild(s);
    });
}

function createOrShowSketch(sketchId) {
    const container = document.getElementById('sketch-container-' + sketchId);
    // hide other canvases
    Object.keys(window._sketchInstances).forEach(id => {
        const inst = window._sketchInstances[id];
        if (inst && inst.canvas) inst.canvas.style.display = (id === sketchId) ? '' : 'none';
    });

    if (window._sketchInstances[sketchId]) {
        const inst = window._sketchInstances[sketchId];
        if (inst && inst.canvas && container) container.appendChild(inst.canvas);
        if (inst && inst.canvas) inst.canvas.style.display = '';
        return;
    }

    const factory = window._sketchRegistry[sketchId];
    if (!factory) return; // sketch will register itself when its script loads

    const p5inst = new p5(factory, container);
    window._sketchInstances[sketchId] = p5inst;
}

document.addEventListener('DOMContentLoaded', () => {
    const buttons = document.querySelectorAll('.tab-btn');
    const contents = document.querySelectorAll('.tab-content');

    buttons.forEach(btn => {
        btn.addEventListener('click', async () => {
            buttons.forEach(b => { b.classList.remove('active'); b.setAttribute('aria-selected', 'false'); });
            contents.forEach(c => c.classList.remove('active'));

            btn.classList.add('active');
            btn.setAttribute('aria-selected', 'true');

            const target = document.getElementById(btn.dataset.target);
            if (target) target.classList.add('active');

            const sketchId = btn.dataset.sketch;
            if (sketchId) {
                try {
                    await loadSketchScriptIfNeeded(sketchId);
                    // if the sketch file registered a factory, create it; if not, wait a tick
                    if (window._sketchRegistry[sketchId]) createOrShowSketch(sketchId);
                    else setTimeout(() => { if (window._sketchRegistry[sketchId]) createOrShowSketch(sketchId); }, 50);
                } catch (err) { console.error(err); }
            } else {
                Object.values(window._sketchInstances).forEach(inst => { if (inst && inst.canvas) inst.canvas.style.display = 'none'; });
            }

            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center' // Scroll until the div is centered in the viewport
                });
            } else {
                console.warn("Target div not found!");
            }
        });
    });

    // kick off default tab (lazy load its sketch)
    const first = getDefaultButton(buttons);
    if (first) setTimeout(() => first.click(), 40);
});