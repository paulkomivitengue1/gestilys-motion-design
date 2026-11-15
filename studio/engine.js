/* Gestilys Studio — moteur de rendu canvas (projection 3D calculée, 100 % déterministe).
 * Tout est une fonction pure du temps t : window.seek(t) produit toujours la même image. */
(function () {
  'use strict';
  var W = 1080, H = 1920, CX = 540, CY = 930, F = 1150;
  var G = window.G = { W: W, H: H, CX: CX, CY: CY, F: F };

  /* ---------- maths et courbes d'accélération ---------- */
  G.clamp = function (x, a, b) { a = a === undefined ? 0 : a; b = b === undefined ? 1 : b; return x < a ? a : x > b ? b : x; };
  G.lerp = function (a, b, t) { return a + (b - a) * t; };
  var E = G.E = {
    lin: function (x) { return x; },
    inQuad: function (x) { return x * x; },
    outQuad: function (x) { return 1 - (1 - x) * (1 - x); },
    outCubic: function (x) { return 1 - Math.pow(1 - x, 3); },
    inCubic: function (x) { return x * x * x; },
    outQuart: function (x) { return 1 - Math.pow(1 - x, 4); },
    inOutCubic: function (x) { return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; },
    outExpo: function (x) { return x >= 1 ? 1 : 1 - Math.pow(2, -10 * x); },
    inExpo: function (x) { return x <= 0 ? 0 : Math.pow(2, 10 * x - 10); },
    inOutExpo: function (x) { return x <= 0 ? 0 : x >= 1 ? 1 : x < 0.5 ? Math.pow(2, 20 * x - 10) / 2 : (2 - Math.pow(2, -20 * x + 10)) / 2; },
    outBack: function (x) { var s = 1.70158; return 1 + (s + 1) * Math.pow(x - 1, 3) + s * Math.pow(x - 1, 2); },
    outBackSoft: function (x) { var s = 0.9; return 1 + (s + 1) * Math.pow(x - 1, 3) + s * Math.pow(x - 1, 2); },
    outElastic: function (x) { return x <= 0 ? 0 : x >= 1 ? 1 : Math.pow(2, -9 * x) * Math.sin((x * 10 - 0.75) * (2 * Math.PI / 3)) + 1; },
    smooth: function (x) { return x * x * (3 - 2 * x); }
  };
  G.P = function (t, a, b, e) { var x = G.clamp((t - a) / (b - a)); return e ? e(x) : x; };
  G.rng = function (seed) {
    var s = (seed >>> 0) || 1;
    return function () { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
  };

  /* ---------- sprites lumineux ---------- */
  function sprite(rgb) {
    var c = document.createElement('canvas'); c.width = c.height = 64;
    var x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(' + rgb + ',1)'); g.addColorStop(0.22, 'rgba(' + rgb + ',0.55)'); g.addColorStop(1, 'rgba(' + rgb + ',0)');
    x.fillStyle = g; x.fillRect(0, 0, 64, 64); return c;
  }
  var SPR = { w: sprite('255,255,255'), g: sprite('255,200,92') };

  /* ---------- table de déplacement (distance parcourue, intégrale de la vitesse) ---------- */
  function speedAt(t) {
    if (t < 5) return 1700 + 500 * G.P(t, 3.8, 5, E.inQuad);
    if (t < 5.7) return 3200 - 2300 * G.P(t, 5, 5.7, E.outCubic);
    if (t < 10.3) return 900 - 400 * G.P(t, 5.7, 8, E.smooth);
    if (t < 11) return 500 + 4200 * G.P(t, 10.3, 11, E.inQuad);
    if (t < 19) return 300;
    if (t < 25) return 160;
    return 90;
  }
  var TRAV = [], acc = 0;
  for (var i = 0; i <= 28 * 60; i++) { TRAV.push(acc); acc += speedAt(i / 60) / 60; }
  G.trav = function (t) { var f = G.clamp(t, 0, 28) * 60, k = Math.floor(f); return TRAV[k] + (TRAV[Math.min(k + 1, TRAV.length - 1)] - TRAV[k]) * (f - k); };

  /* ---------- projection ---------- */
  var cam = G.cam = { roll: 0, px: 0, py: 0 };
  function proj(x, y, z) {
    if (z < 50) return null;
    var k = F / z;
    var sx = x * k, sy = y * k;
    var c = Math.cos(cam.roll), s = Math.sin(cam.roll);
    return { x: CX + cam.px + sx * c - sy * s, y: CY + cam.py + sx * s + sy * c, k: k };
  }
  G.proj = proj;

  /* ---------- polyèdres filaires ---------- */
  function mesh(kind) {
    var v = [], e = [], a, b, d, i, j, p = (1 + Math.sqrt(5)) / 2;
    if (kind === 'cube') { for (i = 0; i < 8; i++) v.push([(i & 1) ? 1 : -1, (i & 2) ? 1 : -1, (i & 4) ? 1 : -1]); }
    else if (kind === 'octa') { v = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]; }
    else { // icosaèdre
      [[0, 1, p], [0, 1, -p], [0, -1, p], [0, -1, -p], [1, p, 0], [1, -p, 0], [-1, p, 0], [-1, -p, 0], [p, 0, 1], [p, 0, -1], [-p, 0, 1], [-p, 0, -1]].forEach(function (q) { v.push(q); });
    }
    var min = 1e9;
    for (i = 0; i < v.length; i++) for (j = i + 1; j < v.length; j++) {
      a = v[i]; b = v[j]; d = Math.pow(a[0] - b[0], 2) + Math.pow(a[1] - b[1], 2) + Math.pow(a[2] - b[2], 2);
      if (d > 0.01 && d < min) min = d;
    }
    for (i = 0; i < v.length; i++) for (j = i + 1; j < v.length; j++) {
      a = v[i]; b = v[j]; d = Math.pow(a[0] - b[0], 2) + Math.pow(a[1] - b[1], 2) + Math.pow(a[2] - b[2], 2);
      if (Math.abs(d - min) < 0.01) e.push([i, j]);
    }
    return { v: v, e: e };
  }
  var MESH = { cube: mesh('cube'), octa: mesh('octa'), ico: mesh('ico') };

  // Objets 3D flottants : [type, x, y, z, taille, vitesse rotation, début, fin, couleur, alpha]
  var SHAPES = [
    ['ico', -420, -560, 1500, 170, 0.7, 0.0, 5.0, 'g', 0.5], ['cube', 430, 520, 1300, 130, 0.9, 0.0, 5.0, 'w', 0.4],
    ['octa', 470, -380, 1700, 190, 0.6, 0.6, 5.0, 'g', 0.45], ['cube', -460, 640, 1900, 210, 0.5, 1.0, 5.0, 'w', 0.3],
    ['ico', 380, -820, 1400, 130, 0.8, 5.3, 10.6, 'g', 0.3], ['octa', -400, 760, 1500, 160, 0.7, 5.3, 10.6, 'w', 0.28],
    ['cube', 450, 860, 1700, 150, 0.6, 11.2, 25.4, 'g', 0.5], ['ico', -470, -760, 1500, 200, 0.5, 11.2, 25.4, 'g', 0.5],
    ['octa', -480, 700, 1300, 150, 0.8, 11.4, 19.2, 'w', 0.4], ['cube', 470, -640, 1250, 110, 0.9, 11.4, 19.2, 'w', 0.4],
    ['ico', 360, 960, 1900, 180, 0.4, 19.4, 28, 'g', 0.35], ['octa', -380, -900, 1800, 170, 0.5, 19.4, 28, 'w', 0.3]
  ];
  function drawShape(ctx, s, t) {
    var vis = G.P(t, s[6], s[6] + 0.7) * (1 - G.P(t, s[7] - 0.6, s[7]));
    if (vis <= 0.01) return;
    var m = MESH[s[0]], sc = s[4], ay = t * s[5], ax = t * s[5] * 0.63 + s[1] * 0.01;
    var cy = Math.cos(ay), sy = Math.sin(ay), cx = Math.cos(ax), sx = Math.sin(ax);
    var by = Math.sin(t * 0.8 + s[1]) * 28;
    var pts = m.v.map(function (p) {
      var x = p[0] * sc, y = p[1] * sc, z = p[2] * sc, x2 = x * cy + z * sy, z2 = -x * sy + z * cy, y2 = y * cx - z2 * sx, z3 = y * sx + z2 * cx;
      return proj(s[1] + x2, s[2] + y2 + by, s[3] + z3 - G.trav(t) * 0 + 0);
    });
    var col = s[8] === 'g' ? '255,200,92' : '200,220,255';
    ctx.lineJoin = 'round';
    [[7, 0.10], [2, 0.9]].forEach(function (pass) {
      ctx.lineWidth = pass[0]; ctx.strokeStyle = 'rgba(' + col + ',' + (pass[1] * s[9] * vis) + ')';
      ctx.beginPath();
      m.e.forEach(function (ed) { var a = pts[ed[0]], b = pts[ed[1]]; if (a && b) { ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); } });
      ctx.stroke();
    });
  }

  /* ---------- anneaux 3D ---------- */
  function ring3(ctx, x, y, z, R, tx, ty, spin, col, lw, alpha, dash) {
    var n = 120, pts = [], i, a, px, py, pz, c1 = Math.cos(tx), s1 = Math.sin(tx), c2 = Math.cos(ty), s2 = Math.sin(ty);
    for (i = 0; i <= n; i++) {
      a = i / n * Math.PI * 2 + spin; px = Math.cos(a) * R; py = Math.sin(a) * R; pz = 0;
      var y1 = py * c1 - pz * s1, z1 = py * s1 + pz * c1, x2 = px * c2 + z1 * s2, z2 = -px * s2 + z1 * c2;
      pts.push(proj(x + x2, y + y1, z + z2));
    }
    ctx.setLineDash(dash || []);
    [[lw * 4, 0.12], [lw, 1]].forEach(function (pass) {
      ctx.lineWidth = pass[0]; ctx.strokeStyle = 'rgba(' + col + ',' + (alpha * pass[1]) + ')';
      ctx.beginPath(); var st = false;
      pts.forEach(function (p) { if (!p) { st = false; return; } if (!st) { ctx.moveTo(p.x, p.y); st = true; } else ctx.lineTo(p.x, p.y); });
      ctx.stroke();
    });
    ctx.setLineDash([]);
  }
  G.ring3 = ring3;

  /* ---------- grille en perspective ---------- */
  function grid(ctx, t, alpha, floorY, ceil, speedScale) {
    if (alpha <= 0.01) return;
    var off = (G.trav(t) * (speedScale || 1)) % 400, ys = ceil ? [floorY, -floorY] : [floorY];
    ys.forEach(function (gy) {
      var i, x, z, a, b, g;
      for (x = -4000; x <= 4000; x += 400) {
        a = proj(x, gy, 60); b = proj(x, gy, 4600);
        if (!a || !b) continue;
        g = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
        g.addColorStop(0, 'rgba(255,200,92,' + (alpha * 0.55) + ')'); g.addColorStop(1, 'rgba(255,200,92,0)');
        ctx.strokeStyle = g; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      }
      for (i = 0; i < 12; i++) {
        z = 100 + i * 400 - off; if (z < 60) z += 4800;
        a = proj(-4000, gy, z); b = proj(4000, gy, z);
        if (!a || !b) continue;
        ctx.strokeStyle = 'rgba(255,200,92,' + (alpha * 0.5 * Math.max(0, 1 - z / 4800)) + ')';
        ctx.lineWidth = 1 + 3 * Math.max(0, 1 - z / 2000);
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      }
    });
  }

  /* ---------- particules (poussière lumineuse en profondeur) ---------- */
  var PR = G.rng(7), PART = [];
  for (var pi = 0; pi < 260; pi++) PART.push({ x: (PR() - 0.5) * 2600, y: (PR() - 0.5) * 3600, z: PR() * 4000, s: 6 + PR() * 20, g: PR() < 0.55, ph: PR() * 6.28 });
  function particles(ctx, t, amount) {
    if (amount <= 0.01) return;
    var tr = G.trav(t);
    ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < PART.length; i++) {
      var p = PART[i], z = ((p.z - tr) % 4000 + 4000) % 4000 + 80, q = proj(p.x + Math.sin(t * 0.5 + p.ph) * 25, p.y + Math.cos(t * 0.4 + p.ph) * 25, z);
      if (!q) continue;
      var a = amount * Math.min(1, (4000 - z) / 1200) * Math.min(1, (z - 80) / 300) * (p.g ? 0.9 : 0.6);
      var sz = p.s * q.k * 2.2; ctx.globalAlpha = a;
      ctx.drawImage(p.g ? SPR.g : SPR.w, q.x - sz / 2, q.y - sz / 2, sz, sz);
    }
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  }

  /* ---------- logo « G » formé par des particules ---------- */
  var LOGO = { cx: 540, cy: 800, s: 3.1, pts: [], from: [] };
  (function () {
    var r = G.rng(21), i, a, k;
    for (i = 0; i < 150; i++) { a = (-40 - 320 * i / 149) * Math.PI / 180; LOGO.pts.push([50 + 28 * Math.cos(a), 50 + 28 * Math.sin(a)]); }
    for (i = 0; i < 14; i++) LOGO.pts.push([78 - 24 * i / 13, 50]);
    // contour du carré arrondi (rayon ≈ 24)
    var n = 150, R = 24, S0 = 4, S1 = 96;
    for (i = 0; i < n; i++) {
      k = i / n * 4; var side = Math.floor(k), f = k - side, u = S0 + R + (S1 - S0 - 2 * R) * f;
      if (side === 0) LOGO.pts.push([u, S0]); else if (side === 1) LOGO.pts.push([S1, u]); else if (side === 2) LOGO.pts.push([S1 - (u - S0 - R) - R, S1]); else LOGO.pts.push([S0, S1 - (u - S0 - R) - R]);
    }
    LOGO.pts.forEach(function () { var an = r() * 6.283, d = 500 + r() * 900; LOGO.from.push([Math.cos(an) * d, Math.sin(an) * d * 1.5, 300 + r() * 1800, r()]); });
  })();
  G.logoParticles = function (ctx, t) {
    var t0 = 19.05, t1 = 20.75;
    if (t < t0 - 0.05 || t > 22.2) return;
    ctx.globalCompositeOperation = 'lighter';
    var disperse = G.P(t, 20.9, 22.0, E.outCubic);
    LOGO.pts.forEach(function (p, i) {
      var f = LOGO.from[i], delay = f[3] * 0.5, u = E.inOutCubic(G.clamp((t - t0 - delay) / (t1 - t0 - 0.5)));
      var tx = (p[0] - 50) * LOGO.s, ty = (p[1] - 50) * LOGO.s;
      var x = G.lerp(f[0], tx, u), y = G.lerp(f[1], ty, u), z = G.lerp(f[2], 1150, E.outCubic(u));
      var an = i * 2.399, dd = disperse * (220 + f[3] * 500);
      x += Math.cos(an) * dd; y += Math.sin(an) * dd;
      var q = proj(x, y + (LOGO.cy - CY), z); if (!q) return;
      var a = Math.min(1, u * 3) * (1 - disperse) * (0.65 + 0.35 * Math.sin(t * 9 + i));
      var sz = (14 + 14 * (1 - u)) * q.k * 1.6 * (i < 164 ? 1.2 : 0.9);
      ctx.globalAlpha = a; ctx.drawImage(SPR.g, q.x - sz, q.y - sz, sz * 2, sz * 2);
      if (u > 0.98 && disperse < 0.2) { ctx.globalAlpha = a * 0.6; ctx.drawImage(SPR.w, q.x - sz * 0.4, q.y - sz * 0.4, sz * 0.8, sz * 0.8); }
    });
    // tracé lumineux du « G » (le trait se dessine avec une tête brillante)
    var dr = G.P(t, 19.7, 20.7, E.inOutCubic), n = Math.floor(150 * dr);
    if (n > 2 && disperse < 0.9) {
      ctx.globalAlpha = (1 - disperse) * 0.9; ctx.strokeStyle = 'rgb(255,200,92)'; ctx.lineWidth = 6; ctx.lineCap = 'round';
      ctx.beginPath();
      for (var i2 = 0; i2 < n; i2++) { var pp = LOGO.pts[i2], X = LOGO.cx + (pp[0] - 50) * LOGO.s, Y = LOGO.cy + (pp[1] - 50) * LOGO.s; if (i2) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); }
      ctx.stroke();
      var hp = LOGO.pts[Math.min(n, 149)], hx = LOGO.cx + (hp[0] - 50) * LOGO.s, hy = LOGO.cy + (hp[1] - 50) * LOGO.s;
      ctx.globalAlpha = (1 - disperse); ctx.drawImage(SPR.w, hx - 60, hy - 60, 120, 120);
    }
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  };

  /* ---------- effets ponctuels : ondes de choc, traînées lumineuses, étincelles ---------- */
  var BEATS = [5.0, 11.0, 19.0, 21.0, 25.0];
  function shock(ctx, t, t0, maxR, lw, col) {
    var u = (t - t0) / 1.0; if (u < 0 || u > 1) return;
    var r = maxR * E.outExpo(u);
    ctx.strokeStyle = 'rgba(' + (col || '255,200,92') + ',' + (1 - u) * 0.9 + ')'; ctx.lineWidth = lw * (1 - u) + 1;
    ctx.beginPath(); ctx.arc(CX, CY, r, 0, 6.2832); ctx.stroke();
  }
  var SR = G.rng(99), STREAKS = [];
  for (var si = 0; si < 40; si++) STREAKS.push({ x: SR() * W, y: SR() * H, l: 200 + SR() * 700, sp: 1800 + SR() * 2600, ph: SR(), w: 1 + SR() * 3 });
  function streaks(ctx, t, alpha, ang) {
    if (alpha <= 0.01) return;
    var ca = Math.cos(ang), sa = Math.sin(ang);
    STREAKS.forEach(function (s) {
      var d = ((t * s.sp + s.ph * 5000) % 5000) - 1000, x = s.x + ca * d, y = s.y + sa * d;
      var g = ctx.createLinearGradient(x, y, x - ca * s.l, y - sa * s.l);
      g.addColorStop(0, 'rgba(255,220,140,' + alpha + ')'); g.addColorStop(1, 'rgba(255,200,92,0)');
      ctx.strokeStyle = g; ctx.lineWidth = s.w; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - ca * s.l, y - sa * s.l); ctx.stroke();
    });
  }

  /* ---------- scène de fond (canvas arrière) ---------- */
  G.drawBG = function (ctx, t) {
    var P = G.P, i;
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
    var gr = ctx.createLinearGradient(0, 0, 0, H);
    gr.addColorStop(0, '#040B1F'); gr.addColorStop(0.55, '#0A1F44'); gr.addColorStop(1, '#061333');
    ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);

    // lueur dorée (plus riche dans l'univers « solution » et « identité »)
    var rich = P(t, 10.6, 11.4) * (1 - P(t, 25, 27.6) * 0.7), glowA = 0.16 + 0.34 * rich;
    ctx.globalCompositeOperation = 'lighter';
    var g2 = ctx.createRadialGradient(CX, CY + 260, 0, CX, CY + 260, 1100);
    g2.addColorStop(0, 'rgba(245,166,35,' + glowA + ')'); g2.addColorStop(0.5, 'rgba(18,48,106,' + (0.35 + 0.2 * rich) + ')'); g2.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g2; ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'source-over';

    // roulis léger de la caméra
    cam.roll = Math.sin(t * 0.35) * 0.018 * (t > 5 ? 1 : 0.2) + (t > 4.6 && t < 5.4 ? Math.sin((t - 4.6) * 20) * 0.01 * (1 - P(t, 4.6, 5.4)) : 0);
    cam.px = 0; cam.py = 0;

    var gridA = t < 5 ? 0.95 : t < 10.3 ? 0.22 : t < 11 ? 0.22 * (1 - P(t, 10.3, 10.9)) : t < 19 ? 0.8 * P(t, 11, 12) : t < 25 ? 0.55 : 0.4 * (1 - P(t, 27.2, 28));
    grid(ctx, t, gridA, 560, t < 5, 1);

    particles(ctx, t, t < 5 ? 1 : t < 11 ? 0.7 : 0.9);
    for (i = 0; i < SHAPES.length; i++) drawShape(ctx, SHAPES[i], t);

    // anneaux 3D
    var a1 = P(t, 0.2, 1.2) * (1 - P(t, 4.5, 5));
    if (a1 > 0.01) { ring3(ctx, 0, -120, 1700, 620, 1.15, t * 0.5, t * 0.8, '255,200,92', 3, 0.5 * a1, [30, 24]); ring3(ctx, 0, -120, 1700, 430, 0.5, -t * 0.6, -t, '255,255,255', 2, 0.35 * a1); }
    var portal = P(t, 9.9, 10.5, E.outBack) * (1 - P(t, 10.95, 11.05));
    if (portal > 0.01) {
      var R = 130 + 140 * P(t, 10.3, 11, E.inExpo) * 20;
      ring3(ctx, 0, 0, 1150, R, 0, 0, t * 2, '255,200,92', 6, portal);
      ring3(ctx, 0, 0, 1150, R * 0.72, 0.9, 0.4, -t * 3, '255,255,255', 3, portal * 0.8, [18, 18]);
    }
    var a3 = P(t, 11.2, 12.4) * (1 - P(t, 18.4, 19));
    if (a3 > 0.01) {
      ring3(ctx, 0, 40, 1750, 760, 1.05, 0.25 + Math.sin(t * 0.3) * 0.1, t * 0.35, '255,200,92', 3, 0.4 * a3, [4, 22]);
      ring3(ctx, 0, 40, 1750, 560, 0.7, -0.5, -t * 0.4, '255,255,255', 2, 0.25 * a3);
    }
    var a4 = P(t, 20.4, 21.4, E.outCubic) * (1 - P(t, 25, 25.9));
    if (a4 > 0.01) {
      var base = (LOGO.cy - CY);
      ring3(ctx, 0, base, 1150, 330 + 40 * Math.sin(t), 1.2, t * 0.45, t * 0.9, '255,200,92', 3, 0.8 * a4);
      ring3(ctx, 0, base, 1150, 420, 0.4, -t * 0.4, -t * 0.7, '255,255,255', 2, 0.5 * a4, [3, 16]);
      ring3(ctx, 0, base, 1150, 520, -0.9, t * 0.3, t * 0.5, '255,200,92', 2, 0.45 * a4, [60, 30]);
    }
    var a5 = P(t, 25.4, 26.2) * (1 - P(t, 27.3, 28));
    if (a5 > 0.01) ring3(ctx, 0, 100, 1500, 700, 1.3, t * 0.3, t * 0.4, '255,200,92', 3, 0.35 * a5, [6, 26]);
  };

  /* ---------- avant-plan (canvas avant) : particules, lumières, transitions ---------- */
  G.drawFG = function (ctx, t) {
    var P = G.P, i;
    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'lighter';
    // traînées de vitesse : scène 1, explosion à 5 s, aspiration à 10,3 s
    streaks(ctx, t, 0.5 * P(t, 0, 0.4) * (1 - P(t, 4.9, 5.4)) + 0.6 * P(t, 10.3, 10.8) * (1 - P(t, 10.95, 11)), Math.PI / 2 * 0.98);
    streaks(ctx, t, 0.75 * P(t, 4.5, 5.0) * (1 - P(t, 5.0, 5.8)), Math.PI * 0.12);
    // étincelles dorées
    var R = G.rng(5);
    for (i = 0; i < 46; i++) {
      var x = R() * W, y = R() * H, ph = R() * 6.28, sp = 0.4 + R() * 0.9, sz = 18 + R() * 46;
      var tw = 0.5 + 0.5 * Math.sin(t * 2.2 * sp + ph);
      ctx.globalAlpha = tw * 0.55; var yy = (y - t * 30 * sp) % H; if (yy < 0) yy += H;
      ctx.drawImage(SPR.g, x - sz / 2, yy - sz / 2, sz, sz);
    }
    ctx.globalAlpha = 1;
    // aspiration vers le centre (fin de la solution) : lignes de lumière convergentes
    var conv = t < 19.05 ? P(t, 18.3, 19.0, E.inCubic) : 0;
    if (conv > 0) {
      var R2 = G.rng(61);
      for (i = 0; i < 60; i++) {
        var an = R2() * 6.283, d0 = 1500 + R2() * 600, d1 = d0 * (1 - conv * 0.96), l = 0.2 + R2() * 0.25;
        var xa = CX + Math.cos(an) * d1, ya = 800 + Math.sin(an) * d1, xb = CX + Math.cos(an) * d1 * (1 + l), yb = 800 + Math.sin(an) * d1 * (1 + l);
        var g = ctx.createLinearGradient(xa, ya, xb, yb); g.addColorStop(0, 'rgba(255,220,140,' + (0.9 * conv) + ')'); g.addColorStop(1, 'rgba(255,200,92,0)');
        ctx.strokeStyle = g; ctx.lineWidth = 2 + 2 * conv; ctx.beginPath(); ctx.moveTo(xa, ya); ctx.lineTo(xb, yb); ctx.stroke();
      }
      var s = 260 * conv + 60; ctx.globalAlpha = conv; ctx.drawImage(SPR.w, CX - s, 800 - s, s * 2, s * 2); ctx.globalAlpha = 1;
    }
    BEATS.forEach(function (b, k) { shock(ctx, t, b, k === 1 ? 1800 : 1500, 22 - k * 2); });
    shock(ctx, t, 5.08, 1100, 8, '255,255,255'); shock(ctx, t, 11.08, 1300, 10, '255,255,255');
    G.logoParticles(ctx, t);
    ctx.globalCompositeOperation = 'source-over';
  };
})();
