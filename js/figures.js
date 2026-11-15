/* Interactive figures. Each figure: { tag, title, caption, notice[], mount(el) -> cleanup() } */
(function () {
  const css = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const rand = (a, b) => a + Math.random() * (b - a);

  function canvas2d(cv, w, h) {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = w * dpr; cv.height = h * dpr;
    cv.style.aspectRatio = w + ' / ' + h;
    const ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return ctx;
  }

  // animation loop that only draws while visible; returns stop()
  function loop(el, step) {
    let raf, last = performance.now(), vis = true, alive = true;
    const io = 'IntersectionObserver' in window ? new IntersectionObserver((es) => { vis = es[0].isIntersecting; }) : null;
    if (io) io.observe(el);
    const f = (t) => {
      if (!alive) return;
      const dt = Math.min(0.04, (t - last) / 1000); last = t;
      if (vis) step(dt, t / 1000);
      raf = requestAnimationFrame(f);
    };
    raf = requestAnimationFrame(f);
    return () => { alive = false; cancelAnimationFrame(raf); if (io) io.disconnect(); };
  }

  function dot(ctx, x, y, r, color, glow) {
    ctx.save();
    if (glow) { ctx.shadowColor = color; ctx.shadowBlur = glow; }
    const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.35, r * 0.1, x, y, r);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(0.35, color);
    g.addColorStop(1, color);
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
  }

  // bouncing gas particles in a box; returns wall hits this step
  function stepGas(ps, box, dt, r) {
    let hits = 0;
    for (const p of ps) {
      p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.x < box.x + r) { p.x = box.x + r; p.vx = Math.abs(p.vx); hits++; }
      if (p.x > box.x + box.w - r) { p.x = box.x + box.w - r; p.vx = -Math.abs(p.vx); hits++; }
      if (p.y < box.y + r) { p.y = box.y + r; p.vy = Math.abs(p.vy); hits++; }
      if (p.y > box.y + box.h - r) { p.y = box.y + box.h - r; p.vy = -Math.abs(p.vy); hits++; }
    }
    return hits;
  }
  function makeGas(n, box, speed, r) {
    const ps = [];
    for (let i = 0; i < n; i++) {
      const a = rand(0, Math.PI * 2), s = speed * rand(0.6, 1.4);
      ps.push({ x: rand(box.x + r, box.x + box.w - r), y: rand(box.y + r, box.y + box.h - r), vx: Math.cos(a) * s, vy: Math.sin(a) * s, base: s });
    }
    return ps;
  }
  function setSpeed(ps, factor) {
    for (const p of ps) {
      const cur = Math.hypot(p.vx, p.vy) || 1;
      const want = p.base * factor;
      p.vx *= want / cur; p.vy *= want / cur;
    }
  }

  function svgGrid(x0, y0, w, h, nx, ny) {
    let s = '';
    for (let i = 0; i <= nx; i++) { const x = x0 + (w * i) / nx; s += `<line x1="${x}" y1="${y0}" x2="${x}" y2="${y0 + h}" class="g-grid"/>`; }
    for (let j = 0; j <= ny; j++) { const y = y0 + (h * j) / ny; s += `<line x1="${x0}" y1="${y}" x2="${x0 + w}" y2="${y}" class="g-grid"/>`; }
    return s;
  }

  const F = {};

  /* ---------------------------------------------------------------- 1 */
  F.states = {
    tag: 'Section 5.1',
    title: 'The particle model',
    caption: 'Spacing, arrangement and movement of particles in a solid, a liquid and a gas.',
    notice: [
      'Solid: particles touch, sit in a regular lattice and only vibrate.',
      'Liquid: still close (fixed volume) but they slide past each other.',
      'Gas: far apart, random, moving fast in straight lines until they collide.'
    ],
    mount(el) {
      el.innerHTML = `<canvas class="fig-canvas"></canvas>
        <div class="fig-legend"><span>Solid</span><span>Liquid</span><span>Gas</span></div>`;
      const W = 900, H = 300, ctx = canvas2d(el.querySelector('canvas'), W, H);
      const cyan = css('--cyan'), pink = css('--pink'), violet = css('--violet'), line = css('--line-strong');
      const pw = 270, ph = 250, gap = 45, top = 25, r = 12;
      const boxes = [0, 1, 2].map((i) => ({ x: 22 + i * (pw + gap), y: top, w: pw, h: ph }));

      // solid lattice
      const solid = [];
      const b0 = boxes[0];
      for (let row = 0; row < 7; row++) for (let col = 0; col < 7; col++) {
        solid.push({ x: b0.x + 33 + col * 34, y: b0.y + b0.h - 18 - row * 24 - (row > 6 ? 0 : 0), ph: rand(0, 6.28), ph2: rand(0, 6.28) });
      }
      // liquid: soft discs with gravity
      const b1 = boxes[1];
      const liquid = [];
      for (let i = 0; i < 42; i++) liquid.push({ x: rand(b1.x + r, b1.x + b1.w - r), y: rand(b1.y + 110, b1.y + b1.h - r), vx: rand(-40, 40), vy: rand(-40, 40) });
      // gas
      const gas = makeGas(12, boxes[2], 190, r);

      function stepLiquid(dt) {
        const g = 380;
        for (const p of liquid) {
          p.vy += g * dt;
          p.vx += rand(-1, 1) * 900 * dt; p.vy += rand(-1, 1) * 900 * dt;
          p.vx *= 0.985; p.vy *= 0.985;
          p.x += p.vx * dt; p.y += p.vy * dt;
          if (p.x < b1.x + r) { p.x = b1.x + r; p.vx = Math.abs(p.vx) * 0.6; }
          if (p.x > b1.x + b1.w - r) { p.x = b1.x + b1.w - r; p.vx = -Math.abs(p.vx) * 0.6; }
          if (p.y > b1.y + b1.h - r) { p.y = b1.y + b1.h - r; p.vy = -Math.abs(p.vy) * 0.4; }
          if (p.y < b1.y + r) { p.y = b1.y + r; p.vy = Math.abs(p.vy); }
        }
        for (let k = 0; k < 3; k++) {
          for (let i = 0; i < liquid.length; i++) for (let j = i + 1; j < liquid.length; j++) {
            const a = liquid[i], b = liquid[j];
            const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy), min = 2 * r * 1.02;
            if (d > 0 && d < min) {
              const push = (min - d) / 2, nx = dx / d, ny = dy / d;
              a.x -= nx * push; a.y -= ny * push; b.x += nx * push; b.y += ny * push;
              const rv = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
              if (rv < 0) { a.vx += rv * nx * 0.5; a.vy += rv * ny * 0.5; b.vx -= rv * nx * 0.5; b.vy -= rv * ny * 0.5; }
            }
          }
        }
      }

      return loop(el, (dt, t) => {
        stepLiquid(dt);
        stepGas(gas, boxes[2], dt, r);
        ctx.clearRect(0, 0, W, H);
        for (const b of boxes) {
          ctx.save(); ctx.strokeStyle = line; ctx.lineWidth = 2;
          roundRect(ctx, b.x, b.y, b.w, b.h, 14); ctx.stroke(); ctx.restore();
        }
        for (const s of solid) dot(ctx, s.x + Math.sin(t * 9 + s.ph) * 1.8, s.y + Math.cos(t * 8 + s.ph2) * 1.8, r, cyan, 10);
        for (const p of liquid) dot(ctx, p.x, p.y, r, violet, 10);
        for (const p of gas) dot(ctx, p.x, p.y, r, pink, 12);
      });
    }
  };

  /* ---------------------------------------------------------------- 2 */
  F.boyle = {
    tag: 'Figure 5.3',
    title: "Pressure and volume (Boyle's law)",
    caption: 'Fixed mass of gas at constant temperature: 0.100 mol at 300 K.',
    notice: [
      'Push the piston down: same molecules, less space, so they hit the walls more often and pressure rises.',
      'pV stays constant (≈ 249 J). V against 1/p is a straight line through the origin.',
      'V against p is a curve: switch the graph to compare.'
    ],
    mount(el) {
      el.innerHTML = `
        <div class="fig-split">
          <div><canvas class="fig-canvas"></canvas></div>
          <div class="fig-graph" data-graph></div>
        </div>
        <div class="fig-controls">
          <label class="slider"><span>Pressure <b data-out="p"></b></span>
            <input type="range" id="boyle-p" min="50" max="250" step="5" value="100"></label>
          <div class="seg small" role="group" aria-label="Graph type">
            <button data-g="inv" class="on" type="button">V vs 1/p</button><button data-g="p" type="button">V vs p</button>
          </div>
        </div>
        <div class="readouts">
          <div><span>p</span><b data-out="pk"></b></div>
          <div><span>V</span><b data-out="v"></b></div>
          <div><span>pV</span><b data-out="pv"></b></div>
          <div><span>Wall hits / s</span><b data-out="hits"></b></div>
        </div>`;
      const W = 420, H = 300, ctx = canvas2d(el.querySelector('canvas'), W, H);
      const cyan = css('--cyan'), pink = css('--pink'), fg = css('--fg'), line = css('--line-strong'), muted = css('--muted');
      const range = el.querySelector('#boyle-p');
      const out = (k) => el.querySelector(`[data-out="${k}"]`);
      const graph = el.querySelector('[data-graph]');
      let mode = 'inv';
      const base = 280, cx = 110, cw = 200, r = 7;
      let box = { x: cx, y: base - 120, w: cw, h: 120 };
      let topY = box.y;
      const ps = makeGas(26, { x: cx, y: base - 230, w: cw, h: 230 }, 170, r);
      let hitLog = [];

      const Vof = (p) => (0.1 * 8.31 * 300) / p; // dm3, p in kPa
      function drawGraph() {
        const p = +range.value, V = Vof(p);
        const x0 = 46, y0 = 16, w = 230, h = 170;
        let path = '', pt;
        if (mode === 'inv') {
          // x: 1/p from 0 to 0.02 kPa^-1, y: V 0..5
          const X = (ip) => x0 + (ip / 0.02) * w, Y = (v) => y0 + h - (v / 5) * h;
          path = `M${X(0)},${Y(0)} L${X(1 / 50)},${Y(Vof(50))}`;
          pt = [X(1 / p), Y(V)];
          graph.innerHTML = `<svg viewBox="0 0 290 222" class="g-svg" role="img" aria-label="Graph of volume against one over pressure">
            ${svgGrid(x0, y0, w, h, 4, 5)}
            <line x1="${x0}" y1="${y0 + h}" x2="${x0 + w}" y2="${y0 + h}" class="g-axis"/><line x1="${x0}" y1="${y0}" x2="${x0}" y2="${y0 + h}" class="g-axis"/>
            <path d="${path}" class="g-line"/>
            <line x1="${pt[0]}" y1="${pt[1]}" x2="${pt[0]}" y2="${y0 + h}" class="g-drop"/>
            <line x1="${x0}" y1="${pt[1]}" x2="${pt[0]}" y2="${pt[1]}" class="g-drop"/>
            <circle cx="${pt[0]}" cy="${pt[1]}" r="6" class="g-dot"/>
            <text x="${x0 - 8}" y="${y0 + h + 4}" class="g-tick" text-anchor="end">0</text>
            <text x="${x0 - 8}" y="${y0 + 4}" class="g-tick" text-anchor="end">5</text>
            <text x="${x0 + w}" y="${y0 + h + 16}" class="g-tick" text-anchor="end">0.020</text>
            <text x="${x0 + w / 2}" y="${y0 + h + 34}" class="g-label" text-anchor="middle">1 / p  (kPa⁻¹)</text>
            <text x="14" y="${y0 + h / 2}" class="g-label" text-anchor="middle" transform="rotate(-90 14 ${y0 + h / 2})">V / dm³</text>
          </svg>`;
        } else {
          const X = (pp) => x0 + (pp / 260) * w, Y = (v) => y0 + h - (v / 5) * h;
          for (let pp = 50; pp <= 250; pp += 5) path += (pp === 50 ? 'M' : 'L') + X(pp) + ',' + Y(Vof(pp)) + ' ';
          pt = [X(p), Y(V)];
          graph.innerHTML = `<svg viewBox="0 0 290 222" class="g-svg" role="img" aria-label="Graph of volume against pressure">
            ${svgGrid(x0, y0, w, h, 4, 5)}
            <line x1="${x0}" y1="${y0 + h}" x2="${x0 + w}" y2="${y0 + h}" class="g-axis"/><line x1="${x0}" y1="${y0}" x2="${x0}" y2="${y0 + h}" class="g-axis"/>
            <path d="${path}" class="g-line" fill="none"/>
            <line x1="${pt[0]}" y1="${pt[1]}" x2="${pt[0]}" y2="${y0 + h}" class="g-drop"/>
            <circle cx="${pt[0]}" cy="${pt[1]}" r="6" class="g-dot"/>
            <text x="${x0 - 8}" y="${y0 + h + 4}" class="g-tick" text-anchor="end">0</text>
            <text x="${x0 - 8}" y="${y0 + 4}" class="g-tick" text-anchor="end">5</text>
            <text x="${X(250)}" y="${y0 + h + 16}" class="g-tick" text-anchor="middle">250</text>
            <text x="${X(50)}" y="${y0 + h + 16}" class="g-tick" text-anchor="middle">50</text>
            <text x="${x0 + w / 2}" y="${y0 + h + 34}" class="g-label" text-anchor="middle">p / kPa</text>
            <text x="14" y="${y0 + h / 2}" class="g-label" text-anchor="middle" transform="rotate(-90 14 ${y0 + h / 2})">V / dm³</text>
          </svg>`;
        }
        out('p').textContent = p + ' kPa';
        out('pk').textContent = p + ' kPa';
        out('v').textContent = V.toFixed(2) + ' dm³';
        out('pv').textContent = (p * V).toFixed(0) + ' J';
      }
      range.addEventListener('input', drawGraph);
      el.querySelectorAll('[data-g]').forEach((b) => b.addEventListener('click', () => {
        mode = b.dataset.g;
        el.querySelectorAll('[data-g]').forEach((x) => x.classList.toggle('on', x === b));
        drawGraph();
      }));
      drawGraph();

      let acc = 0;
      return loop(el, (dt) => {
        const p = +range.value;
        const target = base - 230 * (50 / p);
        topY += (target - topY) * Math.min(1, dt * 6);
        box = { x: cx, y: topY, w: cw, h: base - topY };
        for (const q of ps) if (q.y < topY + r) { q.y = topY + r; q.vy = Math.abs(q.vy); }
        const hits = stepGas(ps, box, dt, r);
        hitLog.push([performance.now(), hits]);
        const now = performance.now();
        hitLog = hitLog.filter((h) => now - h[0] < 1500);
        acc += dt;
        if (acc > 0.3) { acc = 0; out('hits').textContent = Math.round(hitLog.reduce((s, h) => s + h[1], 0) / 1.5); }

        ctx.clearRect(0, 0, W, H);
        // cylinder
        ctx.save();
        ctx.strokeStyle = line; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(cx - 4, base - 245); ctx.lineTo(cx - 4, base + 4); ctx.lineTo(cx + cw + 4, base + 4); ctx.lineTo(cx + cw + 4, base - 245); ctx.stroke();
        // piston
        const grad = ctx.createLinearGradient(0, topY - 16, 0, topY);
        grad.addColorStop(0, muted); grad.addColorStop(1, fg);
        ctx.fillStyle = grad; ctx.globalAlpha = 0.85;
        ctx.fillRect(cx, topY - 14, cw, 14);
        ctx.globalAlpha = 1; ctx.fillStyle = muted;
        ctx.fillRect(cx + cw / 2 - 5, topY - 70, 10, 56);
        // arrow
        ctx.fillStyle = pink;
        ctx.beginPath(); ctx.moveTo(cx + cw / 2, topY - 74); ctx.lineTo(cx + cw / 2 - 9, topY - 90); ctx.lineTo(cx + cw / 2 + 9, topY - 90); ctx.fill();
        ctx.restore();
        for (const q of ps) dot(ctx, q.x, q.y, r, cyan, 8);
        ctx.fillStyle = muted; ctx.font = '12px "JetBrains Mono", monospace';
        ctx.fillText('gas molecules', cx + cw + 14, base - 10);
      });
    }
  };

  /* ---------------------------------------------------------------- 3 */
  F.charles = {
    tag: 'Figure 5.4',
    title: "Temperature and volume (Charles's law)",
    caption: 'Fixed mass of gas at constant pressure (100 kPa): 0.100 mol.',
    notice: [
      'Heating makes molecules faster: they hit the walls harder, so the gas expands to keep p constant.',
      'V/T stays constant when T is in kelvin. The line passes through 0 K (−273 °C).',
      'Table 5.1: 136.5 K → 11.2 dm³, 273 K → 22.4 dm³, 546 K → 44.8 dm³ (for 1 mol at 101 kPa).'
    ],
    mount(el) {
      el.innerHTML = `
        <div class="fig-split">
          <div><canvas class="fig-canvas"></canvas></div>
          <div class="fig-graph" data-graph></div>
        </div>
        <div class="fig-controls">
          <label class="slider"><span>Temperature <b data-out="t"></b></span>
            <input type="range" id="charles-t" min="100" max="600" step="10" value="300"></label>
        </div>
        <div class="readouts">
          <div><span>T</span><b data-out="tk"></b></div>
          <div><span>θ</span><b data-out="tc"></b></div>
          <div><span>V</span><b data-out="v"></b></div>
          <div><span>V / T</span><b data-out="vt"></b></div>
        </div>`;
      const W = 420, H = 300, ctx = canvas2d(el.querySelector('canvas'), W, H);
      const pink = css('--pink'), gold = css('--gold'), fg = css('--fg'), line = css('--line-strong'), muted = css('--muted');
      const range = el.querySelector('#charles-t');
      const out = (k) => el.querySelector(`[data-out="${k}"]`);
      const graph = el.querySelector('[data-graph]');
      const base = 280, cx = 110, cw = 200, r = 7;
      let topY = base - 120;
      const ps = makeGas(20, { x: cx, y: base - 110, w: cw, h: 110 }, 150, r);
      const Vof = (T) => (0.1 * 8.31 * T) / 100;

      function drawGraph() {
        const T = +range.value, V = Vof(T);
        const x0 = 46, y0 = 16, w = 230, h = 160;
        const X = (t) => x0 + (t / 600) * w, Y = (v) => y0 + h - (v / 5) * h;
        const pt = [X(T), Y(V)];
        graph.innerHTML = `<svg viewBox="0 0 290 236" class="g-svg" role="img" aria-label="Graph of volume against kelvin temperature">
          ${svgGrid(x0, y0, w, h, 6, 5)}
          <line x1="${x0}" y1="${y0 + h}" x2="${x0 + w}" y2="${y0 + h}" class="g-axis"/><line x1="${x0}" y1="${y0}" x2="${x0}" y2="${y0 + h}" class="g-axis"/>
          <line x1="${X(0)}" y1="${Y(0)}" x2="${X(100)}" y2="${Y(Vof(100))}" class="g-line dashed"/>
          <line x1="${X(100)}" y1="${Y(Vof(100))}" x2="${X(600)}" y2="${Y(Vof(600))}" class="g-line"/>
          <line x1="${pt[0]}" y1="${pt[1]}" x2="${pt[0]}" y2="${y0 + h}" class="g-drop"/>
          <circle cx="${pt[0]}" cy="${pt[1]}" r="6" class="g-dot"/>
          ${[200, 400, 600].map((t) => `<text x="${X(t)}" y="${y0 + h + 15}" class="g-tick" text-anchor="middle">${t}</text>`).join('')}
          ${[200, 400, 600].map((t) => `<text x="${X(t)}" y="${y0 + h + 30}" class="g-tick alt" text-anchor="middle">${t - 273}</text>`).join('')}
          <text x="${x0 - 8}" y="${y0 + h + 15}" class="g-tick" text-anchor="end">K</text>
          <text x="${x0 - 8}" y="${y0 + h + 30}" class="g-tick alt" text-anchor="end">°C</text>
          <text x="${x0 - 8}" y="${y0 + 4}" class="g-tick" text-anchor="end">5</text>
          <text x="${x0 + w / 2}" y="${y0 + h + 48}" class="g-label" text-anchor="middle">Temperature</text>
          <text x="14" y="${y0 + h / 2}" class="g-label" text-anchor="middle" transform="rotate(-90 14 ${y0 + h / 2})">V / dm³</text>
          <text x="${X(0) + 8}" y="${Y(0) - 26}" class="g-note">0 K = −273 °C</text>
        </svg>`;
        out('t').textContent = T + ' K';
        out('tk').textContent = T + ' K';
        out('tc').textContent = (T - 273) + ' °C';
        out('v').textContent = V.toFixed(2) + ' dm³';
        out('vt').textContent = (V / T * 1000).toFixed(2) + ' × 10⁻³';
      }
      range.addEventListener('input', drawGraph);
      drawGraph();

      return loop(el, (dt) => {
        const T = +range.value;
        const target = base - 240 * (T / 600);
        topY += (target - topY) * Math.min(1, dt * 5);
        setSpeed(ps, Math.sqrt(T / 300));
        for (const q of ps) if (q.y < topY + r) { q.y = topY + r; q.vy = Math.abs(q.vy); }
        stepGas(ps, { x: cx, y: topY, w: cw, h: base - topY }, dt, r);

        ctx.clearRect(0, 0, W, H);
        ctx.save();
        ctx.strokeStyle = line; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(cx - 4, base - 250); ctx.lineTo(cx - 4, base + 4); ctx.lineTo(cx + cw + 4, base + 4); ctx.lineTo(cx + cw + 4, base - 250); ctx.stroke();
        ctx.fillStyle = fg; ctx.globalAlpha = 0.85; ctx.fillRect(cx, topY - 12, cw, 12);
        ctx.globalAlpha = 1; ctx.fillStyle = muted; ctx.fillRect(cx + cw / 2 - 5, topY - 50, 10, 38);
        // heat glow under cylinder
        const heat = (T - 100) / 500;
        const g = ctx.createRadialGradient(cx + cw / 2, base + 14, 4, cx + cw / 2, base + 14, 120);
        g.addColorStop(0, `rgba(255,140,90,${0.15 + heat * 0.55})`); g.addColorStop(1, 'rgba(255,140,90,0)');
        ctx.fillStyle = g; ctx.fillRect(cx - 40, base - 20, cw + 80, 40);
        ctx.restore();
        const col = T > 350 ? pink : gold;
        for (const q of ps) {
          dot(ctx, q.x, q.y, r, col, 8);
          ctx.save(); ctx.strokeStyle = col; ctx.globalAlpha = 0.35; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(q.x, q.y); ctx.lineTo(q.x - q.vx * 0.06, q.y - q.vy * 0.06); ctx.stroke(); ctx.restore();
        }
      });
    }
  };

  /* ---------------------------------------------------------------- 4 */
  F.syringe = {
    tag: 'Figure 5.5',
    title: 'Syringe oven: finding Mr of a volatile liquid',
    caption: 'Inject a weighed sample; it vaporises inside a heated gas syringe and the plunger moves out.',
    notice: [
      'Mass of liquid = mass of hypodermic syringe before − after injecting.',
      'Volume of vapour = final − initial gas syringe reading.',
      'Use the oven temperature (K) and atmospheric pressure (Pa), then Mr = mRT / pV.'
    ],
    mount(el) {
      el.innerHTML = `
        <div class="fig-svgwrap">
        <svg viewBox="0 0 680 330" class="g-svg syringe" role="img" aria-label="Diagram of a syringe oven with a gas syringe, thermometer, light bulb, self-sealing rubber cap and hypodermic syringe">
          <defs>
            <linearGradient id="ovenGlow" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0" stop-color="var(--gold)" stop-opacity="0.22"/><stop offset="1" stop-color="var(--gold)" stop-opacity="0"/>
            </linearGradient>
          </defs>
          <rect x="120" y="70" width="380" height="190" rx="12" class="s-oven"/>
          <rect x="122" y="150" width="376" height="108" rx="10" fill="url(#ovenGlow)"/>
          <!-- thermometer -->
          <rect x="60" y="92" width="270" height="12" rx="6" class="s-glass"/>
          <rect x="66" y="96" width="190" height="4" rx="2" class="s-mercury"/>
          <circle cx="330" cy="98" r="9" class="s-bulb-merc"/>
          ${Array.from({ length: 14 }, (_, i) => `<line x1="${150 + i * 12}" y1="92" x2="${150 + i * 12}" y2="${i % 2 ? 96 : 99}" class="s-tick"/>`).join('')}
          <!-- gas syringe barrel -->
          <rect x="150" y="128" width="300" height="64" rx="8" class="s-glass"/>
          ${Array.from({ length: 20 }, (_, i) => `<line x1="${170 + i * 13}" y1="128" x2="${170 + i * 13}" y2="${i % 5 ? 135 : 141}" class="s-tick"/>`).join('')}
          <g data-plunger>
            <rect x="96" y="154" width="120" height="12" rx="3" class="s-metal"/>
            <rect x="214" y="130" width="12" height="60" rx="3" class="s-metal"/>
            <rect x="86" y="140" width="12" height="40" rx="3" class="s-metal"/>
          </g>
          <g data-vapour></g>
          <!-- nozzle + cap -->
          <rect x="450" y="152" width="44" height="16" rx="3" class="s-glass"/>
          <rect x="494" y="146" width="22" height="28" rx="6" class="s-cap"/>
          <!-- hypodermic -->
          <g data-hypo>
            <line x1="506" y1="160" x2="546" y2="160" class="s-needle"/>
            <rect x="546" y="150" width="84" height="20" rx="4" class="s-glass"/>
            <rect x="550" y="153" width="60" height="14" rx="2" class="s-liquid" data-liq/>
            <rect x="630" y="156" width="26" height="8" class="s-metal"/>
            <rect x="654" y="146" width="7" height="28" rx="2" class="s-metal"/>
          </g>
          <!-- bulb -->
          <circle cx="215" cy="226" r="16" class="s-lamp"/>
          <rect x="231" y="219" width="22" height="14" rx="3" class="s-metal"/>
          <!-- labels -->
          <g class="s-labels">
            <text x="60" y="56">thermometer</text><line x1="110" y1="62" x2="130" y2="92"/>
            <text x="352" y="56">volatile liquid</text><line x1="400" y1="62" x2="580" y2="150"/>
            <text x="560" y="120">hypodermic syringe</text>
            <text x="440" y="226">self-sealing rubber cap</text><line x1="505" y1="210" x2="505" y2="176"/>
            <text x="40" y="296">gas syringe</text><line x1="90" y1="282" x2="160" y2="192"/>
            <text x="190" y="296">light bulb (heater)</text><line x1="215" y1="282" x2="215" y2="244"/>
            <text x="380" y="296">syringe oven</text><line x1="420" y1="282" x2="440" y2="260"/>
          </g>
        </svg></div>
        <div class="fig-controls">
          <button class="btn primary small" data-act="inject" type="button">Inject the liquid</button>
          <button class="btn ghost small" data-act="reset" type="button">Reset</button>
          <span class="fig-status" data-status>Initial gas syringe reading: 20 cm³</span>
        </div>`;
      const svg = el.querySelector('svg');
      const plunger = el.querySelector('[data-plunger]');
      const vap = el.querySelector('[data-vapour]');
      const liq = el.querySelector('[data-liq]');
      const status = el.querySelector('[data-status]');
      let anim = null, stopLoop = null;

      function reset() {
        if (anim) cancelAnimationFrame(anim);
        plunger.setAttribute('transform', 'translate(0,0)');
        vap.innerHTML = ''; liq.setAttribute('width', '60');
        status.textContent = 'Initial gas syringe reading: 20 cm³';
      }
      function inject() {
        reset();
        const t0 = performance.now();
        const dots = [];
        const step = (t) => {
          const k = Math.min(1, (t - t0) / 3200);
          liq.setAttribute('width', String(60 - 22 * Math.min(1, k * 3)));
          const shift = -70 * Math.max(0, (k - 0.25) / 0.75);
          plunger.setAttribute('transform', `translate(${shift},0)`);
          if (k > 0.2 && dots.length < 26 && Math.random() < 0.5) dots.push({ x: 445, y: 160, vx: rand(-120, -30), vy: rand(-60, 60) });
          const left = 226 + shift + 6;
          for (const d of dots) {
            d.x += d.vx / 60; d.y += d.vy / 60;
            if (d.x < left) { d.x = left; d.vx = Math.abs(d.vx); }
            if (d.x > 444) { d.x = 444; d.vx = -Math.abs(d.vx); }
            if (d.y < 134) { d.y = 134; d.vy = Math.abs(d.vy); }
            if (d.y > 186) { d.y = 186; d.vy = -Math.abs(d.vy); }
          }
          vap.innerHTML = dots.map((d) => `<circle cx="${d.x.toFixed(1)}" cy="${d.y.toFixed(1)}" r="3.6" class="s-vap"/>`).join('');
          status.textContent = k < 1 ? 'Vaporising…' : 'Final reading: 74 cm³  →  volume of vapour = 74 − 20 = 54 cm³';
          anim = requestAnimationFrame(step);
          if (k >= 1 && !stopLoop) { /* keep jiggling vapour */ }
        };
        anim = requestAnimationFrame(step);
      }
      el.querySelector('[data-act="inject"]').addEventListener('click', inject);
      el.querySelector('[data-act="reset"]').addEventListener('click', reset);
      return () => { if (anim) cancelAnimationFrame(anim); };
    }
  };

  /* ---------------------------------------------------------------- 5 */
  F.equilibrium = {
    tag: 'Figure 5.6',
    title: 'Evaporation in a closed container',
    caption: 'Molecules escape from the liquid, the vapour gets crowded, some return… until both rates are equal.',
    notice: [
      'At first evaporation is faster than condensation, so vapour builds up (the bromine gets darker).',
      'The more vapour molecules, the more hit the surface and condense.',
      'Equilibrium: escaping rate = returning rate, so the vapour concentration (and vapour pressure) stays constant.',
      'Raise the temperature: more molecules escape, so the equilibrium vapour pressure is higher.'
    ],
    mount(el) {
      el.innerHTML = `
        <canvas class="fig-canvas"></canvas>
        <div class="fig-controls">
          <label class="slider"><span>Temperature <b data-out="t"></b></span>
            <input type="range" id="eq-t" min="280" max="350" step="5" value="300"></label>
          <div class="seg small" role="group" aria-label="Container">
            <button data-lid="closed" class="on" type="button">Closed jar</button><button data-lid="open" type="button">Open beaker</button>
          </div>
          <div class="seg small" role="group" aria-label="Substance">
            <button data-sub="br" class="on" type="button">Bromine</button><button data-sub="w" type="button">Water</button>
          </div>
          <button class="btn ghost small" data-act="reset" type="button">Restart</button>
        </div>
        <div class="readouts">
          <div><span>Escaping / s</span><b data-out="up"></b></div>
          <div><span>Returning / s</span><b data-out="down"></b></div>
          <div><span>Vapour molecules</span><b data-out="n"></b></div>
          <div><span>State</span><b data-out="state"></b></div>
        </div>`;
      const W = 760, H = 330, ctx = canvas2d(el.querySelector('canvas'), W, H);
      const line = css('--line-strong'), muted = css('--muted'), cyan = css('--cyan'), pink = css('--pink');
      const range = el.querySelector('#eq-t');
      const out = (k) => el.querySelector(`[data-out="${k}"]`);
      let lid = 'closed', sub = 'br';
      const jar = { x: 30, y: 24, w: 440, h: 290 };
      const surf = jar.y + 214, r = 6;
      let vap = [], ups = [], downs = [], hist = [], histT = 0, simT = 0, spawnAcc = 0;
      const liquidDots = [];
      for (let row = 0; row < 6; row++) for (let i = 0; i < 34; i++) liquidDots.push({ x: jar.x + 10 + i * 12.6 + (row % 2) * 6, y: surf + 8 + row * 11.5, ph: rand(0, 6.3) });

      function reset() { vap = []; ups = []; downs = []; hist = []; histT = 0; simT = 0; spawnAcc = 0; }
      el.querySelector('[data-act="reset"]').addEventListener('click', reset);
      el.querySelectorAll('[data-lid]').forEach((b) => b.addEventListener('click', () => { lid = b.dataset.lid; el.querySelectorAll('[data-lid]').forEach((x) => x.classList.toggle('on', x === b)); reset(); }));
      el.querySelectorAll('[data-sub]').forEach((b) => b.addEventListener('click', () => { sub = b.dataset.sub; el.querySelectorAll('[data-sub]').forEach((x) => x.classList.toggle('on', x === b)); }));
      const updT = () => { out('t').textContent = range.value + ' K'; };
      range.addEventListener('input', updT); updT();

      let uiAcc = 0;
      return loop(el, (dt, t) => {
        const T = +range.value;
        simT += dt;
        const rate = 2.6 * Math.exp((T - 300) / 22);
        const speed = 150 * Math.sqrt(T / 300);
        spawnAcc += rate * dt;
        while (spawnAcc >= 1 && vap.length < 170) {
          spawnAcc -= 1;
          const a = rand(-Math.PI * 0.85, -Math.PI * 0.15);
          vap.push({ x: rand(jar.x + 10, jar.x + jar.w - 10), y: surf - r, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed });
          ups.push(simT);
        }
        if (spawnAcc >= 1) spawnAcc = 0;
        const keep = [];
        for (const p of vap) {
          const s = Math.hypot(p.vx, p.vy) || 1;
          const want = speed * 1; p.vx *= want / s; p.vy *= want / s;
          p.x += p.vx * dt; p.y += p.vy * dt;
          if (p.x < jar.x + r) { p.x = jar.x + r; p.vx = Math.abs(p.vx); }
          if (p.x > jar.x + jar.w - r) { p.x = jar.x + jar.w - r; p.vx = -Math.abs(p.vx); }
          if (p.y < jar.y + r) {
            if (lid === 'open') continue; // escapes the beaker
            p.y = jar.y + r; p.vy = Math.abs(p.vy);
          }
          if (p.y > surf - r && p.vy > 0) {
            if (Math.random() < 0.55) { downs.push(simT); continue; }
            p.y = surf - r; p.vy = -Math.abs(p.vy);
          }
          keep.push(p);
        }
        vap = keep;
        ups = ups.filter((u) => simT - u < 3); downs = downs.filter((u) => simT - u < 3);
        histT += dt;
        if (histT > 0.2) { histT = 0; hist.push(vap.length); if (hist.length > 140) hist.shift(); }

        uiAcc += dt;
        if (uiAcc > 0.25) {
          uiAcc = 0;
          const up = ups.length / Math.min(3, simT || 1), down = downs.length / Math.min(3, simT || 1);
          out('up').textContent = up.toFixed(1);
          out('down').textContent = down.toFixed(1);
          out('n').textContent = vap.length;
          let st = 'Evaporating';
          if (lid === 'open') st = 'Escaping into the room';
          else if (simT > 6 && Math.abs(up - down) < Math.max(1.2, up * 0.25)) st = 'Dynamic equilibrium';
          out('state').textContent = st;
        }

        // draw
        ctx.clearRect(0, 0, W, H);
        const tone = sub === 'br' ? [196, 92, 52] : [94, 200, 255];
        const dens = Math.min(1, vap.length / 120);
        ctx.fillStyle = `rgba(${tone[0]},${tone[1]},${tone[2]},${sub === 'br' ? 0.08 + dens * 0.55 : 0.03 + dens * 0.18})`;
        ctx.fillRect(jar.x, lid === 'open' ? jar.y : jar.y, jar.w, surf - jar.y);
        // liquid
        ctx.fillStyle = `rgba(${tone[0]},${tone[1]},${tone[2]},0.35)`;
        ctx.fillRect(jar.x, surf, jar.w, jar.y + jar.h - surf);
        for (const d of liquidDots) {
          if (d.x > jar.x + jar.w - 6) continue;
          dot(ctx, d.x + Math.sin(t * 5 + d.ph) * 1.6, d.y + Math.cos(t * 4 + d.ph) * 1.2, 5, `rgb(${tone[0]},${tone[1]},${tone[2]})`, 0);
        }
        for (const p of vap) dot(ctx, p.x, p.y, r, sub === 'br' ? '#ff9a6b' : cyan, 8);
        // jar outline
        ctx.save(); ctx.strokeStyle = line; ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(jar.x, jar.y); ctx.lineTo(jar.x, jar.y + jar.h); ctx.lineTo(jar.x + jar.w, jar.y + jar.h); ctx.lineTo(jar.x + jar.w, jar.y);
        if (lid === 'closed') ctx.lineTo(jar.x, jar.y);
        ctx.stroke();
        if (lid === 'closed') { ctx.fillStyle = muted; ctx.fillRect(jar.x - 8, jar.y - 10, jar.w + 16, 10); }
        ctx.restore();

        // mini chart
        const gx = 500, gy = 40, gw = 235, gh = 200;
        ctx.save();
        ctx.strokeStyle = line; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(gx, gy); ctx.lineTo(gx, gy + gh); ctx.lineTo(gx + gw, gy + gh); ctx.stroke();
        ctx.fillStyle = muted; ctx.font = '12px "JetBrains Mono", monospace';
        ctx.fillText('vapour molecules', gx, gy - 12);
        ctx.fillText('time →', gx + gw - 50, gy + gh + 18);
        if (hist.length > 1) {
          const max = 170;
          ctx.beginPath();
          hist.forEach((v, i) => { const x = gx + (i / 139) * gw, y = gy + gh - (v / max) * gh; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
          ctx.strokeStyle = pink; ctx.lineWidth = 2.5; ctx.shadowColor = pink; ctx.shadowBlur = 8; ctx.stroke();
        }
        ctx.restore();
      });
    }
  };

  /* ---------------------------------------------------------------- 6 */
  F.vapour = {
    tag: 'Section 5.3',
    title: 'Vapour pressure and boiling point',
    caption: 'Vapour pressure of water rises with temperature. It boils where the curve meets the outside pressure.',
    notice: [
      'At 101 kPa (1 atm) the curve is crossed at 100 °C: the normal boiling point.',
      'On a high mountain the outside pressure is lower, so water boils at a lower temperature.',
      'In a pressure cooker the pressure is higher, so water boils above 100 °C.'
    ],
    mount(el) {
      el.innerHTML = `
        <div class="fig-svgwrap" data-plot></div>
        <div class="fig-controls">
          <label class="slider"><span>Outside pressure <b data-out="p"></b></span>
            <input type="range" id="vp-p" min="20" max="190" step="1" value="101"></label>
          <div class="seg small" role="group" aria-label="Presets">
            <button data-pre="34" type="button">Mt Everest</button><button data-pre="101" class="on" type="button">Sea level</button><button data-pre="180" type="button">Pressure cooker</button>
          </div>
        </div>
        <div class="readouts">
          <div><span>Outside pressure</span><b data-out="pk"></b></div>
          <div><span>Boiling point</span><b data-out="bp"></b></div>
        </div>`;
      const range = el.querySelector('#vp-p');
      const plot = el.querySelector('[data-plot]');
      const out = (k) => el.querySelector(`[data-out="${k}"]`);
      // Antoine equation for water (°C, mmHg)
      const vp = (T) => Math.pow(10, 8.07131 - 1730.63 / (233.426 + T)) * 0.133322;
      const bp = (P) => 1730.63 / (8.07131 - Math.log10(P / 0.133322)) - 233.426;
      const x0 = 60, y0 = 20, w = 560, h = 250;
      const X = (T) => x0 + (T / 120) * w, Y = (P) => y0 + h - (P / 200) * h;
      let curve = '';
      for (let T = 0; T <= 120; T += 2) curve += (T ? 'L' : 'M') + X(T).toFixed(1) + ',' + Y(vp(T)).toFixed(1) + ' ';
      function draw() {
        const P = +range.value, B = bp(P);
        plot.innerHTML = `<svg viewBox="0 0 650 320" class="g-svg" role="img" aria-label="Vapour pressure of water against temperature">
          ${svgGrid(x0, y0, w, h, 6, 4)}
          <line x1="${x0}" y1="${y0 + h}" x2="${x0 + w}" y2="${y0 + h}" class="g-axis"/><line x1="${x0}" y1="${y0}" x2="${x0}" y2="${y0 + h}" class="g-axis"/>
          <path d="${curve}" class="g-line" fill="none"/>
          <line x1="${x0}" y1="${Y(P)}" x2="${x0 + w}" y2="${Y(P)}" class="g-hline"/>
          <line x1="${X(B)}" y1="${Y(P)}" x2="${X(B)}" y2="${y0 + h}" class="g-drop"/>
          <circle cx="${X(B)}" cy="${Y(P)}" r="7" class="g-dot"/>
          <text x="${x0 + w - 4}" y="${Y(P) - 8}" class="g-note" text-anchor="end">outside pressure</text>
          <text x="${X(B) + 10}" y="${y0 + h - 10}" class="g-note">boils at ${B.toFixed(0)} °C</text>
          ${[0, 20, 40, 60, 80, 100, 120].map((t) => `<text x="${X(t)}" y="${y0 + h + 18}" class="g-tick" text-anchor="middle">${t}</text>`).join('')}
          ${[0, 50, 100, 150, 200].map((p) => `<text x="${x0 - 8}" y="${Y(p) + 4}" class="g-tick" text-anchor="end">${p}</text>`).join('')}
          <text x="${x0 + w / 2}" y="${y0 + h + 40}" class="g-label" text-anchor="middle">Temperature / °C</text>
          <text x="16" y="${y0 + h / 2}" class="g-label" text-anchor="middle" transform="rotate(-90 16 ${y0 + h / 2})">Vapour pressure / kPa</text>
        </svg>`;
        out('p').textContent = P + ' kPa';
        out('pk').textContent = P + ' kPa';
        out('bp').textContent = B.toFixed(1) + ' °C';
      }
      range.addEventListener('input', () => { el.querySelectorAll('[data-pre]').forEach((x) => x.classList.toggle('on', +x.dataset.pre === +range.value)); draw(); });
      el.querySelectorAll('[data-pre]').forEach((b) => b.addEventListener('click', () => {
        range.value = b.dataset.pre;
        el.querySelectorAll('[data-pre]').forEach((x) => x.classList.toggle('on', x === b));
        draw();
      }));
      draw();
      return () => {};
    }
  };

  /* ---------------------------------------------------------------- 7 */
  F.calculator = {
    tag: 'Tool',
    title: 'pV = nRT solver',
    caption: 'Pick the unknown, enter the rest in any units. The working is shown in SI units.',
    notice: [
      'Every value is converted to Pa, m³, mol and K before solving.',
      'Use the Mr option to work from a mass in grams (n = m / Mr), or to solve for Mr itself.'
    ],
    mount(el) {
      el.innerHTML = `
        <div class="calc">
          <div class="seg" role="group" aria-label="Solve for">
            <button data-solve="p" type="button">Find p</button><button data-solve="V" class="on" type="button">Find V</button>
            <button data-solve="n" type="button">Find n</button><button data-solve="T" type="button">Find T</button><button data-solve="Mr" type="button">Find Mr</button>
          </div>
          <div class="calc-grid">
            <div class="field" data-f="p"><label for="calc-p">Pressure p</label><div class="inrow">
              <input id="calc-p" type="number" step="any" value="150"><select id="calc-pu" aria-label="Pressure unit"><option value="1000" selected>kPa</option><option value="1">Pa</option><option value="101325">atm</option></select></div></div>
            <div class="field" data-f="V"><label for="calc-v">Volume V</label><div class="inrow">
              <input id="calc-v" type="number" step="any" value="8.09"><select id="calc-vu" aria-label="Volume unit"><option value="0.001" selected>dm³</option><option value="1">m³</option><option value="0.000001">cm³</option></select></div></div>
            <div class="field" data-f="n"><label for="calc-n">Amount n (mol)</label><div class="inrow">
              <input id="calc-n" type="number" step="any" value="0.500"></div></div>
            <div class="field" data-f="m"><label for="calc-m">Mass m (g)</label><div class="inrow">
              <input id="calc-m" type="number" step="any" value="5.28"></div></div>
            <div class="field" data-f="Mr"><label for="calc-mr">M<sub>r</sub></label><div class="inrow">
              <input id="calc-mr" type="number" step="any" value="32"></div></div>
            <div class="field" data-f="T"><label for="calc-t">Temperature T</label><div class="inrow">
              <input id="calc-t" type="number" step="any" value="19"><select id="calc-tu" aria-label="Temperature unit"><option value="C" selected>°C</option><option value="K">K</option></select></div></div>
          </div>
          <label class="check"><input type="checkbox" id="calc-usemass"> Work from mass and M<sub>r</sub> instead of n</label>
          <div class="calc-out" data-out aria-live="polite"></div>
        </div>`;
      const $ = (s) => el.querySelector(s);
      let solve = 'V';
      const R = 8.31;
      const sig = (x) => {
        if (!isFinite(x)) return '—';
        const a = Math.abs(x);
        if (a !== 0 && (a < 1e-3 || a >= 1e6)) { const e = Math.floor(Math.log10(a)); return (x / Math.pow(10, e)).toFixed(2) + ' × 10' + sup(e); }
        return +x.toPrecision(3) + '';
      };
      const sup = (e) => String(e).split('').map((c) => '⁰¹²³⁴⁵⁶⁷⁸⁹'['0123456789'.indexOf(c)] || (c === '-' ? '⁻' : c)).join('');
      function fields() {
        const useMass = $('#calc-usemass').checked || solve === 'Mr';
        $('#calc-usemass').disabled = solve === 'Mr' || solve === 'n';
        const show = { p: solve !== 'p', V: solve !== 'V', T: solve !== 'T', n: !useMass && solve !== 'n', m: useMass && solve !== 'n', Mr: useMass && solve !== 'Mr' && solve !== 'n' };
        if (solve === 'n') { show.m = false; show.Mr = false; }
        if (solve === 'Mr') { show.m = true; show.n = false; }
        el.querySelectorAll('.field').forEach((f) => { f.hidden = !show[f.dataset.f]; });
        calc();
      }
      function calc() {
        const p = +$('#calc-p').value * +$('#calc-pu').value;
        const V = +$('#calc-v').value * +$('#calc-vu').value;
        const tRaw = +$('#calc-t').value;
        const T = $('#calc-tu').value === 'C' ? tRaw + 273 : tRaw;
        const useMass = ($('#calc-usemass').checked && solve !== 'n') || solve === 'Mr';
        const m = +$('#calc-m').value, Mr = +$('#calc-mr').value;
        const n = useMass && solve !== 'Mr' ? m / Mr : +$('#calc-n').value;
        const lines = [];
        if (solve !== 'p') lines.push(`p = ${sig(p)} Pa`);
        if (solve !== 'V') lines.push(`V = ${sig(V)} m³`);
        if (solve !== 'T') lines.push(`T = ${$('#calc-tu').value === 'C' ? tRaw + ' + 273 = ' : ''}${sig(T)} K`);
        if (solve !== 'n' && solve !== 'Mr') lines.push(useMass ? `n = m / Mr = ${m} / ${Mr} = ${sig(n)} mol` : `n = ${sig(n)} mol`);
        let res = '', bad = false;
        if (solve === 'V') { const v = (n * R * T) / p; res = `V = nRT / p = <b>${sig(v)} m³</b> = <b>${sig(v * 1000)} dm³</b>`; bad = !(p > 0); }
        if (solve === 'p') { const x = (n * R * T) / V; res = `p = nRT / V = <b>${sig(x)} Pa</b> = <b>${sig(x / 1000)} kPa</b>`; bad = !(V > 0); }
        if (solve === 'n') { const x = (p * V) / (R * T); res = `n = pV / RT = <b>${sig(x)} mol</b>`; bad = !(T > 0); }
        if (solve === 'T') { const x = (p * V) / (n * R); res = `T = pV / nR = <b>${sig(x)} K</b> = <b>${sig(x - 273)} °C</b>`; bad = !(n > 0); }
        if (solve === 'Mr') { lines.push(`m = ${m} g`); const x = (m * R * T) / (p * V); res = `Mr = mRT / pV = <b>${sig(x)} g mol⁻¹</b>`; bad = !(p > 0 && V > 0); }
        if (T <= 0) bad = true;
        $('[data-out]').innerHTML = bad
          ? `<p class="calc-warn">Check the inputs: values must be positive and T must be above 0 K.</p>`
          : `<ol>${lines.map((l) => `<li>${l}</li>`).join('')}</ol><p class="calc-res">${res}</p>`;
      }
      el.querySelectorAll('[data-solve]').forEach((b) => b.addEventListener('click', () => {
        solve = b.dataset.solve;
        el.querySelectorAll('[data-solve]').forEach((x) => x.classList.toggle('on', x === b));
        fields();
      }));
      el.querySelectorAll('input,select').forEach((i) => i.addEventListener('input', () => (i.id === 'calc-usemass' ? fields() : calc())));
      fields();
      return () => {};
    }
  };

  window.IMATFigures = F;
})();
