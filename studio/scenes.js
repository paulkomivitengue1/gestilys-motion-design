/* Gestilys Studio — scénario de 28 s (9:16). Chaque élément est une fonction pure du temps :
 * window.seek(t) place tout à l'instant t, puis le script de rendu capture l'image. */
(function () {
  'use strict';
  var G = window.G, E = G.E, P = G.P, clamp = G.clamp, lerp = G.lerp, rng = G.rng;
  var CFG = window.__CONFIG__, TICK = [], FIT = [], LAY = [];
  var $cam = document.getElementById('cam');

  /* ---------- utilitaires DOM ---------- */
  function mk(tag, cls, parent, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html !== undefined && html !== null) e.innerHTML = html;
    if (parent) parent.appendChild(e);
    return e;
  }
  function vis(el, o) { el.style.opacity = o; el.style.visibility = o <= 0.003 ? 'hidden' : 'visible'; }
  // élément centré sur (x, y) dans le plan 1080×1920, avec profondeur z
  function place(el, o) {
    var s = o.s === undefined ? 1 : o.s;
    el.style.transform = 'translate3d(' + (o.x || 0).toFixed(2) + 'px,' + (o.y || 0).toFixed(2) + 'px,' + (o.z || 0).toFixed(2) + 'px) rotateX(' + (o.rx || 0).toFixed(2) + 'deg) rotateY(' + (o.ry || 0).toFixed(2) + 'deg) rotateZ(' + (o.rz || 0).toFixed(2) + 'deg) scale3d(' + (s * (o.sx || 1)).toFixed(4) + ',' + (s * (o.sy || 1)).toFixed(4) + ',1) translate(-50%,-50%)';
    vis(el, o.o === undefined ? 1 : o.o);
  }
  // transformation relative (lettres dans leur ligne)
  function rel(el, o) {
    var s = o.s === undefined ? 1 : o.s;
    el.style.transform = 'translate3d(' + (o.x || 0).toFixed(2) + 'px,' + (o.y || 0).toFixed(2) + 'px,' + (o.z || 0).toFixed(2) + 'px) rotateX(' + (o.rx || 0).toFixed(2) + 'deg) rotateY(' + (o.ry || 0).toFixed(2) + 'deg) rotateZ(' + (o.rz || 0).toFixed(2) + 'deg) scale3d(' + (s * (o.sx || 1)).toFixed(4) + ',' + (s * (o.sy || 1)).toFixed(4) + ',1)';
    vis(el, o.o === undefined ? 1 : o.o);
  }
  // ligne de texte découpée en lettres
  function kin(parent, text, cls, mask, q) {
    var row = mk('div', 'kr p3', parent), line = mk('div', 'kl ' + (cls || ''), row), chars = [];
    if (q !== false) row.setAttribute('data-q', '1');
    text.split(' ').forEach(function (w, wi, arr) {
      var wd = mk('span', 'kw' + (mask ? ' mk' : ''), line);
      for (var i = 0; i < w.length; i++) chars.push(mk('span', 'ch', wd, w[i]));
      if (wi < arr.length - 1) mk('span', 'sp', line);
    });
    return { row: row, line: line, chars: chars };
  }
  function fit(k, maxW, maxS) {
    FIT.push(function () {
      k.line.style.fontSize = '100px';
      var w = k.line.getBoundingClientRect().width || 1;
      k.line.style.fontSize = Math.min(maxS, 100 * maxW / w).toFixed(1) + 'px';
    });
  }
  function fitPx(el, maxW, maxS) { // même principe pour un bloc simple
    FIT.push(function () {
      el.style.fontSize = '100px';
      var w = el.getBoundingClientRect().width || 1;
      el.style.fontSize = Math.min(maxS, 100 * maxW / w).toFixed(1) + 'px';
    });
  }
  function fmt(v, dec) {
    var s = dec ? v.toFixed(dec).replace('.', ',') : String(Math.round(v));
    var parts = s.split(','); parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0');
    return parts.join(',');
  }
  var NAMES = ['Aminata Traoré', 'Moussa Keïta', 'Fatoumata Diarra', 'Ibrahim Coulibaly', 'Mariam Sangaré', 'Oumar Dembélé', 'Awa Camara', 'Seydou Konaté'];

  /* ---------- icônes et logo ---------- */
  var IC = {
    users: '<svg viewBox="0 0 24 24" fill="none" stroke="#0A1F44" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.6-3.6 3.2-5.5 6.5-5.5s5.9 1.9 6.5 5.5"/><circle cx="17.5" cy="9" r="2.6"/><path d="M17 14.6c2.4.1 4 1.6 4.5 4.4"/></svg>',
    coin: '<svg viewBox="0 0 24 24" fill="none" stroke="#0A1F44" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M14.8 9.2c-.5-1-1.5-1.5-2.8-1.5-1.6 0-2.8.8-2.8 2 0 3 5.8 1.4 5.8 4.4 0 1.2-1.2 2-2.9 2-1.4 0-2.5-.6-3-1.7M12 6v1.7M12 16.3V18"/></svg>',
    doc: '<svg viewBox="0 0 24 24" fill="none" stroke="#0A1F44" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2.5h8.5L19 7v14.5H6z"/><path d="M14 2.5V7.5h5M9 12h7M9 16h7"/></svg>',
    book: '<svg viewBox="0 0 24 24" fill="none" stroke="#0A1F44" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4.5h6.5c1 0 1.5.6 1.5 1.5v14c0-.9-.5-1.5-1.5-1.5H4zM20 4.5h-6.5c-1 0-1.5.6-1.5 1.5v14c0-.9.5-1.5 1.5-1.5H20z"/></svg>',
    cap: '<svg viewBox="0 0 24 24" fill="none" stroke="#0A1F44" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M2 9.5 12 5l10 4.5L12 14z"/><path d="M6 11.5V16c0 1.4 2.7 2.8 6 2.8s6-1.4 6-2.8v-4.5M22 9.5V15"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="#0A1F44" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9.5"/><path d="M7.5 12.5l3 3L16.5 9"/></svg>',
    receipt: '<svg viewBox="0 0 24 24" fill="none" stroke="#0A1F44" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 2.5h14v19l-3-2-2 2-2-2-2 2-2-2-3 2z"/><path d="M9 8h6M9 12h6"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="#6B7C9E" stroke-width="2.6" stroke-linecap="round"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5 21 21"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="#FFC85C" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12h15M13 6l6 6-6 6"/></svg>'
  };
  var GPATH = 'M71.45 32 A28 28 0 1 0 78 50 L54 50';
  function logoHTML() { return '<svg viewBox="0 0 100 100"><path d="' + GPATH + '" fill="none" stroke="#fff" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" pathLength="100" stroke-dasharray="100" stroke-dashoffset="0"/></svg><div class="shine"><i></i></div>'; }
  function logo(parent, size) { var l = mk('div', 'logo abs', parent, logoHTML()); l.style.width = size + 'px'; l.style.height = size + 'px'; return l; }

  /* =====================================================================
   * SCÈNE 1 — IMPACT (0 à 5 s)
   * ===================================================================== */
  var KINDS = ['doc', 'list', 'calc', 'pay', 'note'];
  function paperHTML(kind, i) {
    var r = rng(i * 77 + 3), nm = NAMES[i % NAMES.length], k;
    if (kind === 'list') {
      k = '<div class="band">LISTE · CM2 A</div>';
      for (var a = 0; a < 7; a++) k += '<div class="nm' + (r() < 0.4 ? ' x' : '') + '"><i></i>' + NAMES[(i + a) % NAMES.length] + '</div>';
      return k;
    }
    if (kind === 'calc') {
      k = '<div class="band">CALCULS</div>';
      for (var b = 0; b < 6; b++) k += '<div class="num"><span>' + (10 + Math.floor(r() * 80)) + ' × ' + (2 + Math.floor(r() * 9)) + '</span>' + fmt(Math.round(r() * 90000) + 1000) + '</div>';
      return k + '<div class="num"><span>TOTAL</span>= ?</div>';
    }
    if (kind === 'pay') return '<div class="band g">PAIEMENT</div><div class="ln"></div><div class="nm">' + nm + '</div><div class="big">' + fmt(15000 * (1 + (i % 4))) + '</div><div class="num"><span>FCFA</span></div><span class="tag late">EN RETARD</span>';
    return '<div class="band">' + ['BULLETIN', 'REGISTRE', 'INSCRIPTION', 'REÇU'][i % 4] + '</div><div class="nm">' + nm + '</div>' + '<div class="ln"></div><div class="ln" style="width:80%"></div><div class="ln"></div><div class="ln" style="width:60%"></div><div class="ln"></div><div class="ln" style="width:75%"></div><div class="ln"></div><div class="ln" style="width:50%"></div>';
  }
  function makePaper(parent, kind, i, dark) {
    if (kind === 'note') {
      var s = mk('div', 'sticky abs', parent, ['Relancer<br>les parents', 'Notes à<br>saisir', 'Reçu à<br>refaire', 'Liste<br>à jour ?'][i % 4]);
      return s;
    }
    return mk('div', 'paper abs' + (dark ? ' dk' : ''), parent, paperHTML(kind, i));
  }

  function buildImpact() {
    var T = CFG.texts.impact;
    // — papiers sombres flottant en profondeur, derrière le texte
    var floaters = [], r = rng(31), i;
    for (i = 0; i < 16; i++) {
      var el = makePaper($cam, KINDS[i % 5], i, true);
      floaters.push({ el: el, x: (i % 2 ? 1 : -1) * (330 + r() * 260), y: (r() - 0.5) * 1700, off: r() * 3300, rot: (r() - 0.5) * 60, sp: (r() - 0.5) * 40, s: 0.8 + r() * 0.5 });
    }
    var nums = ['12/20', '45 000', '%', '= ?', 'N° 0148', '÷', '+', '3e tranche'];
    var fn = nums.map(function (n, k) { var e = mk('div', 'floatnum abs', $cam, n); e.style.fontSize = (90 + (k % 3) * 40) + 'px'; return { el: e, x: (k % 2 ? 1 : -1) * (250 + r() * 220), y: (r() - 0.5) * 1500, z: -500 - r() * 1400, k: k }; });

    // — texte
    var blk = mk('div', 'kb p3', $cam), L = [];
    T.forEach(function (tx, i) { var k = kin(blk, tx, i === 4 ? 'gold' : '', i === 2); L.push(k); fit(k, 900, [235, 170, 170, 210, 160][i]); });
    var bar = mk('div', 'bar-gold', blk); bar.style.width = '0px'; bar.style.left = '90px';
    LAY.push(function () { blk.style.top = (930 - blk.offsetHeight / 2 - 10) + 'px'; bar.style.top = (L[0].row.offsetTop - 26) + 'px'; });

    var R = rng(5), rot = L[4].chars.map(function () { return (R() - 0.5) * 120; });
    var ang = L[4].chars.map(function (c, i) { return R() * 6.283; });

    TICK.push(function (t) {
      if (t > 5.2) { blk.style.display = 'none'; floaters.forEach(function (f) { vis(f.el, 0); }); fn.forEach(function (f) { vis(f.el, 0); }); return; }
      blk.style.display = '';
      floaters.forEach(function (f, i) {
        var z = -3400 + ((t * 1500 + f.off) % 3250), a = Math.min(1, (z + 3400) / 500) * (1 - P(t, 4.5, 5));
        place(f.el, { x: 540 + f.x, y: 930 + f.y, z: z, rz: f.rot + t * f.sp, ry: Math.sin(t + i) * 24, rx: Math.cos(t * 0.8 + i) * 16, s: f.s, o: a * 0.95 });
      });
      fn.forEach(function (f) {
        var z = f.z + ((t * 220) % 600) - 300;
        place(f.el, { x: 540 + f.x, y: 930 + f.y - t * 20, z: z, rz: Math.sin(t + f.k) * 8, o: 0.8 * (1 - P(t, 4.5, 5)) * P(t, 0, 0.4) });
      });
      // 1 — « GÉRER » : arrive de la gauche, lettres étirées
      L[0].chars.forEach(function (c, i) { var p = P(t, i * 0.05, 0.55 + i * 0.05, E.outExpo); rel(c, { x: -(1 - p) * 1100, sx: 1 + (1 - p) * 0.7, rz: -(1 - p) * 6, o: p > 0.01 ? 1 : 0 }); });
      var bw = P(t, 0.45, 1.0, E.outExpo); bar.style.width = (bw * 900) + 'px'; bar.style.opacity = bw > 0 ? 1 : 0;
      // 2 — « UNE ÉCOLE » : arrive de la profondeur, lettre par lettre
      L[1].chars.forEach(function (c, i) { var p = P(t, 1.0 + i * 0.045, 1.65 + i * 0.045, E.outCubic); rel(c, { z: -(1 - p) * 2400, ry: (1 - p) * 70, o: p }); });
      // 3 — « NE DEVRAIT » : masque de révélation (monte depuis le bas)
      L[2].chars.forEach(function (c, i) { var p = P(t, 2.0 + i * 0.035, 2.55 + i * 0.035, E.outExpo); rel(c, { y: (1 - p) * 150, o: p > 0.01 ? 1 : 0 }); });
      // 4 — « PAS ÊTRE » : traverse depuis la droite
      L[3].chars.forEach(function (c, i) { var p = P(t, 3.0 + i * 0.04, 3.55 + i * 0.04, E.outExpo); rel(c, { x: (1 - p) * 1200, sx: 1 + (1 - p) * 0.9, o: p > 0.01 ? 1 : 0 }); });
      // 5 — « COMPLIQUÉ. » : tombe, vibre, se décompose puis explose
      var jit = P(t, 4.0, 4.5, E.inQuad), ex = P(t, 4.5, 5.0, E.inCubic);
      L[4].chars.forEach(function (c, i) {
        var p = P(t, 3.5 + i * 0.06, 4.1 + i * 0.06, E.outBackSoft);
        var jx = Math.sin(t * 41 + i * 3) * 9 * jit, jy = Math.cos(t * 37 + i * 5) * 7 * jit;
        rel(c, { x: jx + Math.cos(ang[i]) * ex * 900, y: -(1 - p) * 900 + jy + Math.sin(ang[i]) * ex * 900, z: ex * 2600, rz: (1 - p) * 40 + Math.sin(t * 30 + i) * 4 * jit + rot[i] * ex, s: 1 + 0.08 * jit, o: p > 0.01 ? 1 - P(t, 4.8, 5.0) : 0 });
      });
      // sortie des lignes 1 à 4 : poussées vers la caméra
      [0, 1, 2, 3].forEach(function (k) { var o = P(t, 4.55 + k * 0.03, 5.0, E.inExpo); rel(L[k].row, { z: o * 1000, y: -o * 160 * (k + 1), o: 1 - o }); });
    });
  }

  /* =====================================================================
   * SCÈNE 2 — LE PROBLÈME (5 à 11 s) : chaos puis ordre
   * ===================================================================== */
  function buildProblem() {
    var r = rng(88), i, A = [], B = [];
    for (i = 0; i < 18; i++) {
      var el = makePaper($cam, KINDS[i % 5], i + 3, false);
      A.push({ el: el, x: (r() - 0.5) * 1000, y: (r() - 0.5) * 1750, z: -900 + r() * 1100, rz: (r() - 0.5) * 140, sp: (r() - 0.5) * 50, ph: r() * 6.28, d: i * 0.025, s: 0.8 + r() * 0.5, side: r() < 0.5 ? -1 : 1 });
    }
    for (i = 0; i < 14; i++) {
      var el2 = makePaper($cam, KINDS[(i + 2) % 5], i + 9, false);
      B.push({ el: el2, y: (r() - 0.5) * 1500, z: -300 + r() * 500, t0: 5.5 + i * 0.16, dur: 1.0 + r() * 0.5, dir: i % 2 ? 1 : -1, rz: (r() - 0.5) * 50, s: 0.9 + r() * 0.6 });
    }
    var sweep = mk('div', 'sweep abs', $cam);

    // — textes
    var T = CFG.texts.problem, blk = mk('div', 'kb p3', $cam);
    var w = T[0].split(' '), k1 = kin(blk, w[0], '', false), k2 = kin(blk, w[1], '', false);
    var v = T[1].split(' '), k3 = kin(blk, v[0], 'gold', false), k4 = kin(blk, v[1], 'gold', false);
    fit(k1, 900, 160); fit(k2, 900, 130); fit(k3, 900, 160); fit(k4, 900, 160);
    LAY.push(function () { blk.style.top = '200px'; });

    // — cartes d'ordre (6)
    var CARDS = [['users', 'Élèves', '1 248 inscrits'], ['coin', 'Paiements', '87 % encaissé'], ['book', 'Bulletins', '1er trimestre'], ['cap', 'Classes', '36 classes'], ['receipt', 'Reçus', 'N° 2026-0412'], ['doc', 'Documents', 'Tout au même endroit']];
    var cs = CARDS.map(function (c, k) {
      var e = mk('div', 'oc abs', $cam, '<div class="ic">' + IC[c[0]] + '</div><div><div class="t">' + c[1] + '</div><div class="s">' + c[2] + '</div></div>');
      return { el: e, x: 300 + (k % 2) * 480, y: 920 + Math.floor(k / 2) * 262, s0: 8.0 + k * 0.25, k: k };
    });

    TICK.push(function (t) {
      var show = t > 4.9 && t < 11.1;
      if (!show) { A.concat(B).forEach(function (f) { vis(f.el, 0); }); cs.forEach(function (c) { vis(c.el, 0); }); [k1, k2, k3, k4].forEach(function (k) { k.chars.forEach(function (c) { vis(c, 0); }); }); vis(sweep, 0); return; }
      // vague A : explosion depuis le centre, flottement puis balayage par la lumière dorée
      A.forEach(function (f, i) {
        var p = P(t, 5.0 + f.d, 5.9 + f.d, E.outExpo), out = P(t, 7.55 + f.d, 8.3, E.inCubic);
        var x = lerp(540, 540 + f.x, p) + Math.sin(t * 1.3 + f.ph) * 36 + f.side * out * 1500;
        var y = lerp(930, 930 + f.y, p) + Math.cos(t * 1.1 + f.ph) * 30;
        place(f.el, { x: x, y: y, z: lerp(-500, f.z, p), rz: f.rz * p + (t - 5) * f.sp + out * 90 * f.side, rx: Math.sin(t * 1.4 + f.ph) * 22, ry: Math.cos(t * 1.2 + f.ph) * 26, s: lerp(0.15, f.s, p), o: t < 5.0 ? 0 : 1 - P(t, 8.0, 8.4) });
      });
      // vague B : papiers qui traversent l'écran à toute vitesse
      B.forEach(function (f) {
        var p = (t - f.t0) / f.dur; if (p < 0 || p > 1) { vis(f.el, 0); return; }
        var x = lerp(f.dir > 0 ? -450 : 1530, f.dir > 0 ? 1530 : -450, E.outQuad(p) * 0.35 + p * 0.65);
        place(f.el, { x: x, y: 930 + f.y + Math.sin(p * 6) * 30, z: f.z, rz: f.rz + p * 160 * f.dir, ry: p * 70 * f.dir, s: f.s, o: 1 });
      });
      // balayage de lumière dorée (7,7 → 8,3 s) qui nettoie l'écran
      var sw = P(t, 7.65, 8.35, E.inOutCubic);
      place(sweep, { x: lerp(-500, 1700, sw), y: 930, z: 250, rz: 18, o: sw > 0 && sw < 1 ? 0.9 : 0 });
      // textes : « TOUT RASSEMBLER » puis « CHANGE TOUT. »
      [k1, k2].forEach(function (k, ki) { k.chars.forEach(function (c, i) { var p = P(t, 8.0 + ki * 0.25 + i * 0.04, 8.7 + ki * 0.25 + i * 0.04, E.outBack); rel(c, { y: (1 - p) * -260, z: (1 - p) * 700, rz: (1 - p) * 20, o: P(t, 8.0 + ki * 0.25 + i * 0.04, 8.15 + ki * 0.25 + i * 0.04) * (1 - P(t, 10.1, 10.5)) }); }); });
      [k3, k4].forEach(function (k, ki) { k.chars.forEach(function (c, i) { var p = P(t, 9.0 + ki * 0.25 + i * 0.05, 9.6 + ki * 0.25 + i * 0.05, E.outExpo); rel(c, { x: (1 - p) * (ki ? 900 : -900), sx: 1 + (1 - p) * 0.6, o: (p > 0.01 ? 1 : 0) * (1 - P(t, 10.1, 10.5)) }); }); });
      // cartes d'ordre : s'assemblent sur les temps, puis aspirées par l'anneau
      cs.forEach(function (c) {
        var p = P(t, c.s0, c.s0 + 0.75, E.outBack), inh = P(t, 10.1 + c.k * 0.03, 10.75, E.inCubic);
        place(c.el, { x: lerp(540 + (c.k % 2 ? 900 : -900), c.x, p) * (1 - inh) + 540 * inh, y: lerp(c.y + 500, c.y, p) * (1 - inh) + 930 * inh, z: -(1 - p) * 1800 + inh * 200, ry: (1 - p) * (c.k % 2 ? -60 : 60), rz: inh * (c.k % 2 ? 140 : -140), s: lerp(0.5, 1, p) * (1 - inh * 0.85), o: p > 0.02 ? 1 - P(t, 10.55, 10.8) : 0 });
      });
    });
  }

  /* =====================================================================
   * SCÈNE 3 — LA SOLUTION (11 à 19 s) : interfaces en 3D
   * ===================================================================== */
  function feedRow(ic, a, b, c) { return '<div class="fr rv"><div class="ico">' + IC[ic] + '</div><div class="tx"><b>' + a + '</b><span>' + b + '</span></div><div class="am">' + c + '</div></div>'; }
  function uiHead(right) { return '<div class="uh"><div class="logo">' + logoHTML() + '</div><b>Gestilys</b><div class="sp2"></div>' + right + '</div>'; }

  var MODS = {
    dashboard: { kick: 'TABLEAU DE BORD', t1: 'Toute l’école', t2: 'en un coup d’œil', html: function () {
      var bars = [46, 58, 52, 74, 68, 92, 120].map(function (h, i) { return '<div class="' + (i === 5 ? 'hi' : '') + '" data-h="' + (h + 40) + '"></div>'; }).join('');
      return uiHead('<span class="pill navy">2026–2027</span>') +
        '<div class="up rv"><h3>Tableau de bord</h3><p>Groupe scolaire Horizon · 1er trimestre</p></div>' +
        '<div class="kpis rv"><div class="kpi"><small>Élèves</small><b data-n="1248">0</b><em>+38 cette année</em></div><div class="kpi"><small>Classes</small><b data-n="36">0</b><em>Primaire à lycée</em></div><div class="kpi g"><small>Bulletins prêts</small><b data-n="1120">0</b><em>sur 1 248</em></div></div>' +
        '<div class="panels rv"><div class="panel" style="width:330px"><h4>Scolarité encaissée</h4><div class="sub">1re tranche</div><div class="donut"><svg viewBox="0 0 200 200"><circle cx="100" cy="100" r="82" fill="none" stroke="#E3EAF8" stroke-width="22"/><circle data-ring="87" cx="100" cy="100" r="82" fill="none" stroke="#F5A623" stroke-width="22" stroke-linecap="round" stroke-dasharray="515.2" stroke-dashoffset="515.2"/></svg><div class="c"><b data-n="87" data-s=" %">0</b><span>encaissé</span></div></div></div>' +
        '<div class="panel" style="flex:1"><h4>Encaissements</h4><div class="sub">Sept. → mars</div><div class="bars">' + bars + '</div><div class="lab"><span>S</span><span>O</span><span>N</span><span>D</span><span>J</span><span>F</span><span>M</span></div></div></div>' +
        '<div class="feed">' + feedRow('coin', 'Paiement reçu', 'Aminata Traoré · CM2 A', '45\u00a0000') + feedRow('users', 'Nouvelle inscription', 'Awa Camara · CE1 A', 'CE1') + feedRow('book', 'Bulletin prêt', 'Classe de 6e B', '32/32') + '</div>';
    } },
    students: { kick: 'ÉLÈVES & CLASSES', t1: 'Tous vos élèves,', t2: 'classe par classe', html: function () {
      var rows = NAMES.slice(0, 5).map(function (n, i) { return '<div class="row rv"><div class="av av' + (i % 5) + '">' + n.split(' ').map(function (x) { return x[0]; }).join('') + '</div><div class="g"><div class="n">' + n + '</div><div class="s">N° 2026-0' + (148 + i * 7) + ' · CM2 A</div></div><span class="pill ' + (i === 1 ? 'late' : 'ok') + '">' + (i === 1 ? 'À jour bientôt' : 'Inscrit') + '</span></div>'; }).join('');
      return uiHead('<span class="pill navy">36 classes</span>') +
        '<div class="search rv">' + IC.search + 'Rechercher un élève</div>' +
        '<div class="chips rv"><span class="chip on">CM2 A</span><span class="chip">CM2 B</span><span class="chip">6e A</span><span class="chip">6e B</span><span class="chip">5e A</span></div>' +
        '<div class="ccard rv"><div class="r"><div><small>Classe</small><br><b>CM2 · A</b></div><div style="text-align:right"><small>Effectif</small><br><b data-n="32">0</b></div></div><div class="meter"><i data-mw="91"></i></div></div>' +
        '<div class="rows">' + rows + '</div><div class="fab rv">+ Ajouter un élève</div>';
    } },
    payments: { kick: 'PAIEMENTS', t1: 'Suivez chaque', t2: 'tranche de scolarité', html: function () {
      var d = [['Aminata Traoré', 'ok', 45000], ['Moussa Keïta', 'flip', 45000], ['Fatoumata Diarra', 'ok', 45000], ['Ibrahim Coulibaly', 'late', 45000], ['Mariam Sangaré', 'ok', 45000]];
      var rows = d.map(function (x, i) { var pill = x[1] === 'ok' ? '<span class="pill ok">Payé</span>' : x[1] === 'late' ? '<span class="pill late">En retard</span>' : '<span class="pill late" data-flip="a" style="position:absolute;right:0">En retard</span><span class="pill ok" data-flip="b" style="position:absolute;right:0">Payé</span>'; return '<div class="row rv"><div class="av av' + (i % 5) + '">' + x[0].split(' ').map(function (z) { return z[0]; }).join('') + '</div><div class="g"><div class="n">' + x[0] + '</div><div class="s">1re tranche · ' + fmt(x[2]) + ' FCFA</div></div><div style="position:relative;width:150px;height:44px;text-align:right">' + pill + '</div></div>'; }).join('');
      return uiHead('<span class="pill navy">Scolarité</span>') +
        '<div class="up rv"><h3>Suivi des paiements</h3><p>1re tranche · Année 2026–2027</p></div>' +
        '<div class="pwrap rv"><div class="donut" style="width:180px;height:180px"><svg viewBox="0 0 200 200" style="width:180px;height:180px"><circle cx="100" cy="100" r="82" fill="none" stroke="#E3EAF8" stroke-width="22"/><circle data-ring="87" cx="100" cy="100" r="82" fill="none" stroke="#F5A623" stroke-width="22" stroke-linecap="round" stroke-dasharray="515.2" stroke-dashoffset="515.2"/></svg><div class="c"><b data-n="87" data-s=" %" style="font-size:44px">0</b></div></div><div style="flex:1"><div class="kpi" style="margin-bottom:12px"><small>Encaissé</small><b data-n="14820000" style="font-size:38px">0</b><em>FCFA</em></div><div class="kpi g"><small>Reste à payer</small><b data-n="2210000" style="font-size:38px">0</b><em>FCFA</em></div></div></div>' +
        '<div class="rows">' + rows + '</div>';
    } },
    receipts: { kick: 'REÇUS', t1: 'Un reçu pour', t2: 'chaque paiement', html: function () {
      return uiHead('<span class="pill ok">Payé</span>') +
        '<div class="rc"><div class="ttl rv">REÇU DE PAIEMENT</div><div class="no rv">N° 2026-0412</div>' +
        '<div style="margin-top:14px">' + [['Élève', 'Aminata Traoré'], ['Classe', 'CM2 · A'], ['Désignation', 'Scolarité · 1re tranche'], ['Date', '12 octobre 2026'], ['Mode', 'Espèces']].map(function (l) { return '<div class="ln2 rv"><span>' + l[0] + '</span><b>' + l[1] + '</b></div>'; }).join('') + '</div>' +
        '<div class="tot rv"><div><small>Montant reçu</small></div><b data-n="45000" data-s=" FCFA">0</b></div></div><div class="stamp" data-stamp="1">PAYÉ</div>';
    } },
    report: { kick: 'BULLETINS', t1: 'Préparez les', t2: 'bulletins scolaires', html: function () {
      var S = [['Mathématiques', 14], ['Français', 15], ['Histoire-Géo', 12], ['Sciences', 16], ['Anglais', 13], ['EPS', 17]];
      return uiHead('<span class="pill navy">1er trimestre</span>') +
        '<div class="bhead rv"><div class="av av0">AT</div><div><h3>Aminata Traoré</h3><p>CM2 · A · Année 2026–2027</p></div></div>' +
        '<div style="padding-top:16px">' + S.map(function (s) { return '<div class="subj rv"><div class="sn">' + s[0] + '</div><div class="tr"><i class="' + (s[1] >= 16 ? 'hi' : '') + '" data-mw="' + (s[1] * 5) + '"></i></div><div class="nt" data-n="' + s[1] + '">0</div></div>'; }).join('') + '</div>' +
        '<div class="avg rv"><div><small>Moyenne générale</small><b data-n="14.5" data-d="2">0</b></div><div class="ok">Bon trimestre</div></div>';
    } }
  };

  function buildSolution() {
    var order = ['dashboard', 'students', 'payments', 'receipts', 'report'].filter(function (k) { return CFG.features[k]; });
    var n = order.length, slot = 7.5 / n, st = order.map(function (k, i) { return 11 + i * slot; });
    var entry = [[0, 0, -900, 0], [-1000, 200, -400, 55], [1000, 120, -400, -55], [0, -1100, -300, 0], [-1000, -200, -400, 55]];

    // titres de modules
    var titles = order.map(function (k, i) {
      var M = MODS[k], w = mk('div', 'kb p3', $cam);
      var kick = mk('div', 'kick', mk('div', 'kr', w), M.kick); kick.setAttribute('data-q', '1');
      var a = kin(w, M.t1, '', true), b = kin(w, M.t2, 'gold', true);
      fit(a, 900, 98); fit(b, 900, 98);
      LAY.push(function () { w.style.top = '196px'; });
      return { w: w, kick: kick, a: a, b: b };
    });
    // cartes
    var cards = order.map(function (k, i) {
      var c = mk('div', 'ui abs', $cam, MODS[k].html() + '<div class="gloss"></div>');
      var dim = mk('div', 'dim', c);
      var rv = [].slice.call(c.querySelectorAll('.rv')), nums = [].slice.call(c.querySelectorAll('[data-n]')), rings = [].slice.call(c.querySelectorAll('[data-ring]')), mws = [].slice.call(c.querySelectorAll('[data-mw]')), hs = [].slice.call(c.querySelectorAll('[data-h]')), fa = c.querySelector('[data-flip="a"]'), fb = c.querySelector('[data-flip="b"]'), stamp = c.querySelector('[data-stamp]');
      return { el: c, dim: dim, rv: rv, nums: nums, rings: rings, mws: mws, hs: hs, fa: fa, fb: fb, stamp: stamp };
    });
    var dots = order.map(function () { return mk('div', 'dot abs', $cam); });
    var disc = mk('div', 'disc abs', $cam, CFG.texts.disclaimer); disc.setAttribute('data-q', '1');

    function arrive(i, t) { return i === 0 ? P(t, 11.0, 11.95, E.outExpo) : P(t, st[i] - 0.2, st[i] + 0.55, E.outCubic); }

    TICK.push(function (t) {
      var on = t > 10.9 && t < 19.1;
      if (!on) { cards.forEach(function (c) { vis(c.el, 0); }); titles.forEach(function (w) { vis(w.w, 0); }); dots.forEach(function (d) { vis(d, 0); }); vis(disc, 0); return; }
      var implode = P(t, 18.5, 19.0, E.inCubic);
      cards.forEach(function (c, i) {
        var u = arrive(i, t), d = 0, k;
        for (k = i + 1; k < n; k++) d += arrive(k, t);
        var e = entry[i % 5], side = i % 2 ? 1 : -1, tl = t - st[i];
        var bob = Math.sin(t * 1.3 + i) * 10;
        var x = 540 + (1 - u) * e[0] + side * d * 105, y = 1090 + (1 - u) * e[1] + bob - d * 26;
        var z = (1 - u) * e[2] - d * 330 + (i === 0 ? 0 : 0), ry = (1 - u) * e[3] + side * d * -13 + Math.sin(t * 0.5 + i) * 2.2, rx = Math.cos(t * 0.6 + i) * 1.8 + (i === 3 ? (1 - u) * 25 : 0);
        var o = (i === 0 ? P(t, 10.95, 11.35) : u > 0.02 ? 1 : 0) * (1 - clamp(d - 2.5, 0, 1) * 0.8);
        // implosion finale : toutes les cartes sont aspirées vers le point de lumière
        x = lerp(x, 540, implode); y = lerp(y, 800, implode); z = lerp(z, 0, implode);
        place(c.el, { x: x, y: y, z: z, ry: ry + implode * 200 * side, rx: rx, rz: implode * 140 * side, s: lerp(1, 0.04, implode) * (i === 0 ? lerp(0.62, 1, u) : 1), o: o * (1 - P(t, 18.8, 19.0)) });
        c.dim.style.opacity = clamp(d * 0.28, 0, 0.72);
        // contenus qui se révèlent (compteurs, barres, anneaux)
        c.rv.forEach(function (el, j) { var p = P(tl, 0.2 + j * 0.07, 0.7 + j * 0.07, E.outCubic); el.style.opacity = p; el.style.transform = 'translateY(' + ((1 - p) * 34).toFixed(1) + 'px)'; });
        var cp = P(tl, 0.35, 1.25, E.outCubic);
        c.nums.forEach(function (el) { var v = parseFloat(el.getAttribute('data-n')) * cp, dec = +(el.getAttribute('data-d') || 0); el.textContent = fmt(v, dec) + (el.getAttribute('data-s') || ''); });
        c.rings.forEach(function (el) { el.style.strokeDashoffset = (515.2 * (1 - parseFloat(el.getAttribute('data-ring')) / 100 * cp)).toFixed(1); });
        c.mws.forEach(function (el) { el.style.width = (parseFloat(el.getAttribute('data-mw')) * P(tl, 0.5, 1.5, E.outCubic)) + '%'; });
        c.hs.forEach(function (el, j) { el.style.height = (parseFloat(el.getAttribute('data-h')) * P(tl, 0.4 + j * 0.07, 1.2 + j * 0.07, E.outBackSoft)) + 'px'; });
        if (c.fa) { var f = P(tl, 0.95, 1.2); c.fa.style.opacity = 1 - f; c.fb.style.opacity = f; c.fb.style.transform = 'scale(' + (0.6 + 0.4 * E.outBack(P(tl, 0.95, 1.4))) + ')'; }
        if (c.stamp) { var sp = P(tl, 0.9, 1.25, E.outBack); c.stamp.style.opacity = P(tl, 0.9, 1.0); c.stamp.style.transform = 'rotate(-14deg) scale(' + (2.6 - 1.6 * sp) + ')'; }
      });
      // titres : chaque module remplace le précédent par un masque de révélation
      titles.forEach(function (w, i) {
        var a = st[i], b = i < n - 1 ? st[i + 1] : 18.55, tin = i === 0 ? 11.35 : a - 0.05, o = P(t, tin, tin + 0.1) * (1 - P(t, b - 0.28, b + 0.05));
        vis(w.w, o);
        vis(w.kick, P(t, tin, tin + 0.35)); w.kick.style.transform = 'translateY(' + ((1 - P(t, tin, tin + 0.5, E.outCubic)) * 30) + 'px)';
        [w.a, w.b].forEach(function (k, ki) {
          k.chars.forEach(function (c, j) { var p = P(t, tin + 0.1 + ki * 0.15 + j * 0.025, tin + 0.65 + ki * 0.15 + j * 0.025, E.outExpo); rel(c, { y: (1 - p) * 120 + P(t, b - 0.28, b + 0.05, E.inQuad) * -80, o: p > 0.01 ? 1 : 0 }); });
        });
      });
      dots.forEach(function (d, i) {
        var a = st[i], b = i < n - 1 ? st[i + 1] : 18.6, act = P(t, a - 0.05, a + 0.25) * (1 - P(t, b - 0.05, b + 0.25));
        d.style.width = (14 + 56 * act) + 'px'; d.style.background = act > 0.5 ? '#F5A623' : 'rgba(255,255,255,.28)';
        place(d, { x: 540 + (i - (n - 1) / 2) * 44 + (act * 0), y: 1745, o: P(t, 11.6, 12) * (1 - implode) });
      });
      place(disc, { x: 540, y: 1820, o: P(t, 12, 12.6) * (1 - implode) * 0.9 });
      // légère dérive de caméra pendant tout l'univers « solution »
      $cam.style.transform = 'translate3d(' + (Math.sin(t * 0.5) * 12) + 'px,' + (Math.cos(t * 0.4) * 8) + 'px,' + (-(1 - P(t, 11, 12.2, E.outExpo)) * 700) + 'px) rotateY(' + (Math.sin(t * 0.45) * 1.6) + 'deg)';
    });
  }

  /* =====================================================================
   * SCÈNE 4 — IDENTITÉ (19 à 25 s) et SCÈNE 5 — CONCLUSION (25 à 28 s)
   * ===================================================================== */
  function buildFinale() {
    var C = CFG.texts, lg = logo($cam, 310), shine = lg.querySelector('.shine i'), gp = lg.querySelector('path');
    var wm = kin($cam, C.wordmark, 'wm', false); wm.row.className = 'kr abs p3'; wm.line.style.letterSpacing = '.1em';
    fitPx(wm.line, 880, 128); fit(wm, 900, 126); wm.line.className = 'kl wm';
    var dash = mk('div', 'dash abs', $cam);
    var sl = C.slogan.split(', '), s1 = kin($cam, sl[0] + ',', 'slogan', true), s2 = kin($cam, sl[1], 'gold', true);
    s1.row.className = 'kr abs p3'; s2.row.className = 'kr abs p3'; fit(s1, 860, 60); fit(s2, 860, 96);
    s2.line.style.fontWeight = '900';
    var close = C.closing, c1 = kin($cam, close[0], '', false), c2 = kin($cam, close[1].split(' ')[0], 'gold', false), c3 = kin($cam, close[1].split(' ')[1], 'gold', false);
    [c1, c2, c3].forEach(function (k) { k.row.className = 'kr abs p3'; });
    fit(c1, 900, 112); fit(c2, 900, 230); fit(c3, 900, 128);
    var cta = mk('div', 'cta abs', $cam, '<div class="sheen"></div><div style="text-align:left">' + C.cta[0] + '<br>' + C.cta[1] + '</div><div class="arr">' + IC.arrow + '</div>'); cta.setAttribute('data-q', '1');
    var R = rng(404), sc = wm.chars.map(function () { return { a: R() * 6.283, d: 500 + R() * 600, z: -600 + R() * 1200, r: (R() - 0.5) * 160 }; });
    var R2 = rng(9), rot = c1.chars.concat(c2.chars, c3.chars).map(function () { return (R2() - 0.5) * 70; });
    var allClose = c1.chars.concat(c2.chars, c3.chars);

    TICK.push(function (t) {
      var on = t > 18.9;
      if (!on) { vis(lg, 0); vis(dash, 0); [wm, s1, s2, c1, c2, c3].forEach(function (k) { vis(k.row, 0); k.chars.forEach(function (c) { vis(c, 0); }); }); vis(cta, 0); return; }
      // — logo : apparition (20,5 s), puis glissement en haut (25 s) et retour au centre pour la fin
      var pin = P(t, 20.5, 21.15, E.outBack), mv = P(t, 24.55, 25.35, E.inOutCubic), fin = P(t, 27.4, 27.9, E.inOutCubic);
      var ly = lerp(lerp(800, 330, mv), 930, fin), ls = lerp(lerp(1, 0.5, mv), 0.78, fin);
      place(lg, { x: 540, y: ly, z: 0, s: ls * lerp(0.7, 1, pin), ry: (1 - pin) * -80 + Math.sin(t * 0.8) * 3, o: P(t, 20.45, 20.75) * (1 - P(t, 27.75, 27.98)) });
      gp.style.strokeDashoffset = (100 * (1 - P(t, 20.5, 21.1, E.inOutCubic))).toFixed(1);
      shine.style.left = (lerp(-60, 130, P(t, 21.2, 21.9, E.inOutCubic)) + P(t, 26.4, 27.2, E.inOutCubic) * 0) + '%';
      // — « GESTILYS » : les lettres se décomposent puis se recomposent
      var wo = 1 - P(t, 24.5, 25.1, E.inExpo);
      wm.chars.forEach(function (c, i) { var p = P(t, 21.15 + i * 0.045, 22.05 + i * 0.045, E.outExpo), s = sc[i]; rel(c, { x: Math.cos(s.a) * s.d * (1 - p), y: Math.sin(s.a) * s.d * (1 - p) - (1 - wo) * 140, z: s.z * (1 - p), rz: s.r * (1 - p), s: lerp(0.4, 1, p), o: (p > 0.01 ? Math.min(1, p * 3) : 0) * wo }); });
      place(wm.row, { x: 540, y: 1100, o: 1 });
      // — tiret doré, puis slogan « LA GESTION SCOLAIRE, SIMPLIFIÉE. »
      place(dash, { x: 540, y: 1196, sx: P(t, 22.3, 22.9, E.outExpo), o: P(t, 22.3, 22.4) * wo });
      s1.chars.forEach(function (c, i) { var p = P(t, 22.55 + i * 0.022, 23.05 + i * 0.022, E.outExpo); rel(c, { y: (1 - p) * 90 - (1 - wo) * 100, o: (p > 0.01 ? 1 : 0) * wo }); });
      s2.chars.forEach(function (c, i) { var p = P(t, 23.1 + i * 0.03, 23.7 + i * 0.03, E.outBackSoft); rel(c, { y: (1 - p) * 110 - (1 - wo) * 100, o: (p > 0.01 ? 1 : 0) * wo }); });
      place(s1.row, { x: 540, y: 1286, o: 1 }); place(s2.row, { x: 540, y: 1394, o: 1 });
      // — conclusion : « VOTRE ÉCOLE, MIEUX ORGANISÉE. »
      var co = 1 - P(t, 27.1, 27.5, E.inCubic), up = P(t, 27.1, 27.55, E.inCubic) * 120;
      place(c1.row, { x: 540, y: 560 - up, o: 1 }); place(c2.row, { x: 540, y: 740 - up, o: 1 }); place(c3.row, { x: 540, y: 896 - up, o: 1 });
      allClose.forEach(function (c, i) { var base = i < c1.chars.length ? 25.15 : i < c1.chars.length + c2.chars.length ? 25.65 : 25.95; var p = P(t, base + (i % 9) * 0.04, base + 0.6 + (i % 9) * 0.04, E.outBack); rel(c, { y: (1 - p) * -420, z: (1 - p) * 500, rz: (1 - p) * rot[i], o: (p > 0.02 ? 1 : 0) * co }); });
      // — bouton d'appel à l'action
      var cp = P(t, 26.0, 26.65, E.outBack), pulse = 1 + 0.025 * Math.sin((t - 26.6) * 7) * P(t, 26.6, 26.9);
      place(cta, { x: 540, y: 1300 - up * 0.8, s: lerp(0.5, 1, cp) * pulse, z: (1 - cp) * -400, o: P(t, 26.0, 26.2) * co });
      cta.firstChild.style.left = lerp(-200, 1200, P(t, 26.75, 27.25, E.inOutCubic)) + 'px';
    });
  }

  /* =====================================================================
   * Assemblage, flash de transition, boucle de rendu
   * ===================================================================== */
  var bg = document.getElementById('bg').getContext('2d'), fg = document.getElementById('fg').getContext('2d'), flash = document.getElementById('flash');
  var fade = mk('div', '', document.getElementById('stage')); fade.style.cssText = 'position:absolute;inset:0;background:#050F26;opacity:0;pointer-events:none';
  document.getElementById('stage').insertBefore(fade, document.getElementById('vignette'));

  function flashAt(t) {
    var a = 0;
    function pulse(t0, up, down, k) { return Math.max(0, P(t, t0 - up, t0) * (1 - P(t, t0, t0 + down, E.outQuad))) * k; }
    a = Math.max(pulse(5.0, 0.1, 0.5, 0.95), pulse(11.0, 0.18, 0.85, 1), pulse(19.0, 0.2, 0.6, 0.85), pulse(20.62, 0.1, 0.35, 0.45), pulse(25.0, 0.12, 0.4, 0.5));
    return a;
  }

  window.seek = function (t) {
    for (var i = 0; i < TICK.length; i++) TICK[i](t);
    if (t < 10.9 || t > 19.1) $cam.style.transform = t > 5 && t < 11 ? 'translate3d(0,0,' + (P(t, 10.2, 10.95, E.inExpo) * 700) + 'px)' : 'none';
    G.drawBG(bg, t); G.drawFG(fg, t);
    flash.style.opacity = flashAt(t);
    fade.style.opacity = P(t, 27.45, 27.98, E.inOutCubic);
  };
  window.__TOTAL__ = CFG.video.duration;

  function boot() {
    Object.keys(CFG.colors).forEach(function (k) { document.documentElement.style.setProperty('--' + k, CFG.colors[k]); });
    buildImpact(); buildProblem(); buildSolution(); buildFinale();
    return document.fonts.ready.then(function () {
      FIT.forEach(function (f) { f(); }); LAY.forEach(function (f) { f(); });
      window.seek(0); window.__READY__ = true;
    });
  }
  function start() { boot().catch(function (e) { window.__ERROR__ = String((e && e.stack) || e); console.error(window.__ERROR__); }); }
  if (window.__CONFIG__) { CFG = window.__CONFIG__; start(); }
  else fetch('config.json').then(function (r) { return r.json(); }).then(function (c) { CFG = window.__CONFIG__ = c; start(); });
})();
