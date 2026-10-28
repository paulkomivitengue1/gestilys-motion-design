/* Gestilys — publicité 9:16
 *
 * Principe : toutes les animations sont créées avec l'API Web Animations, puis mises en pause.
 * `window.seek(t)` positionne chaque animation à l'instant t (en secondes). Le script de rendu
 * appelle seek(t) puis capture une image : le résultat est identique à chaque exécution, quelle
 * que soit la vitesse de la machine.
 *
 * Textes, couleurs et durées : config/video.config.json
 * v2 : écran final avec carte « essai gratuit » + contact WhatsApp (brand.ctaCard, style : endcard.css)
 */
(function () {
  'use strict';

  var EASE_OUT = 'cubic-bezier(0.22, 1, 0.36, 1)';
  var EASE_IO = 'cubic-bezier(0.65, 0, 0.35, 1)';
  var EASE_POP = 'cubic-bezier(0.34, 1.56, 0.64, 1)';
  var SVG_NS = 'http://www.w3.org/2000/svg';
  var SVG_TAGS = { svg: 1, path: 1, circle: 1, rect: 1, line: 1, g: 1, ellipse: 1, polygon: 1, polyline: 1 };
  var C = {}; // couleurs (remplies depuis la config)

  /* ------------------------------------------------------------------ */
  /* Utilitaires                                                         */
  /* ------------------------------------------------------------------ */

  function h(tag, props) {
    var el = SVG_TAGS[tag] ? document.createElementNS(SVG_NS, tag) : document.createElement(tag);
    var p = props || {};
    Object.keys(p).forEach(function (k) {
      var v = p[k];
      if (v === null || v === undefined || v === false) return;
      if (k === 'style' && typeof v === 'object') {
        Object.keys(v).forEach(function (sk) { el.style[sk] = v[sk]; });
      } else {
        el.setAttribute(k, String(v));
      }
    });
    for (var i = 2; i < arguments.length; i++) append(el, arguments[i]);
    return el;
  }

  function append(el, kid) {
    if (kid === null || kid === undefined || kid === false) return;
    if (Array.isArray(kid)) { kid.forEach(function (k) { append(el, k); }); return; }
    el.appendChild(typeof kid === 'string' ? document.createTextNode(kid) : kid);
  }

  // Générateur pseudo-aléatoire déterministe (même résultat à chaque rendu)
  function rnd(seed) {
    var s = seed;
    return function () { s = (s * 16807) % 2147483647; return s / 2147483647; };
  }

  var ALL = [];
  function anim(el, frames, o) {
    var opt = o || {};
    var a = el.animate(frames, {
      delay: Math.round((opt.at || 0) * 1000),
      duration: Math.max(1, Math.round((opt.dur === undefined ? 1 : opt.dur) * 1000)),
      easing: opt.ease || EASE_OUT,
      fill: 'both',
      iterations: opt.iterations || 1
    });
    a.pause();
    ALL.push(a);
    return a;
  }

  // Apparition : opacité + déplacement (+ flou / échelle optionnels)
  function enter(el, at, o) {
    var opt = o || {};
    var dy = opt.dy === undefined ? 40 : opt.dy;
    var dx = opt.dx || 0;
    var sc = opt.scale === undefined ? 1 : opt.scale;
    var from = { opacity: 0, transform: 'translate(' + dx + 'px, ' + dy + 'px) scale(' + sc + ')' };
    var to = { opacity: 1, transform: 'translate(0px, 0px) scale(1)' };
    if (opt.blur) { from.filter = 'blur(' + opt.blur + 'px)'; to.filter = 'blur(0px)'; }
    return anim(el, [from, to], { at: at, dur: opt.dur || 0.8, ease: opt.ease || EASE_OUT });
  }

  function rise(el, at, dy) {
    return enter(el, at, { dur: 0.7, dy: dy === undefined ? 34 : dy });
  }

  // Fenêtre de visibilité d'un élément : entrée, maintien, sortie (une seule animation)
  function fadeWindow(el, from, to, o) {
    var opt = o || {};
    var total = to - from;
    var inD = opt.inD === undefined ? 0.5 : opt.inD;
    var outD = opt.outD === undefined ? 0.4 : opt.outD;
    var dy = opt.dy === undefined ? 30 : opt.dy;
    var f0 = Math.min(inD / total, 0.45);
    var frames = [
      { opacity: 0, transform: 'translateY(' + dy + 'px)', offset: 0, easing: EASE_OUT },
      { opacity: 1, transform: 'translateY(0px)', offset: f0 }
    ];
    if (opt.noOut) {
      frames.push({ opacity: 1, transform: 'translateY(0px)', offset: 1 });
    } else {
      var f1 = 1 - Math.min(outD / total, 0.45);
      frames[1].easing = 'linear';
      frames.push({ opacity: 1, transform: 'translateY(0px)', offset: f1, easing: EASE_IO });
      frames.push({ opacity: 0, transform: 'translateY(' + (-dy / 2) + 'px)', offset: 1 });
    }
    return anim(el, frames, { at: from, dur: total, ease: 'linear' });
  }

  // Enveloppe d'une séquence : fondu enchaîné de 0,5 s avec la séquence voisine
  function shell(cls, start, dur, o) {
    var opt = o || {};
    var lead = opt.first ? 0 : 0.5;
    var tail = opt.last ? 0 : 0.5;
    var total = lead + dur;
    var el = h('div', { class: 'scene ' + cls });
    var frames = [];
    if (opt.first) {
      frames.push({ opacity: 1, offset: 0 });
    } else {
      frames.push({ opacity: 0, offset: 0 });
      frames.push({ opacity: 1, offset: lead / total });
    }
    if (opt.last) {
      frames.push({ opacity: 1, offset: 1 });
    } else {
      frames.push({ opacity: 1, offset: 1 - tail / total });
      frames.push({ opacity: 0, offset: 1 });
    }
    anim(el, frames, { at: start - lead, dur: total, ease: 'linear' });
    return el;
  }

  // Titre mot par mot
  function words(lines, at, accent, step) {
    var wrap = h('div', { class: 'hl' });
    var i = 0;
    lines.forEach(function (line) {
      var row = h('div', { class: 'hl-line' });
      line.split(' ').forEach(function (word) {
        var isAcc = (accent || []).some(function (a) { return word.toLowerCase().indexOf(a.toLowerCase()) !== -1; });
        var span = h('span', { class: 'w' + (isAcc ? ' acc' : '') }, word);
        row.appendChild(span);
        row.appendChild(document.createTextNode(' '));
        enter(span, at + i * step, { dur: 0.7, dy: 36, blur: 10 });
        i++;
      });
      wrap.appendChild(row);
    });
    return wrap;
  }

  /* ------------------------------------------------------------------ */
  /* Icônes et logo                                                      */
  /* ------------------------------------------------------------------ */

  function iconSearch(color) {
    return h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: color, 'stroke-width': 2.4, 'stroke-linecap': 'round' },
      h('circle', { cx: 10.5, cy: 10.5, r: 6.5 }),
      h('line', { x1: 15.5, y1: 15.5, x2: 21, y2: 21 }));
  }

  function iconCheck(color) {
    return h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: color, 'stroke-width': 3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' },
      h('circle', { cx: 12, cy: 12, r: 10 }),
      h('path', { d: 'M7 12.5l3.2 3.2L17 9' }));
  }

  function iconArrow(color) {
    return h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: color, 'stroke-width': 2.8, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' },
      h('path', { d: 'M4 12h15M13 6l6 6-6 6' }));
  }

  // Combiné téléphonique (icône générique de contact, tracé simple)
  function iconPhone(color) {
    return h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: color, 'stroke-width': 2.2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' },
      h('path', { d: 'M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z' }));
  }

  // Logo : carré orange doré avec un « G » blanc tracé
  function logoMark(small, drawAt) {
    var path = h('path', {
      d: 'M71.45 32 A28 28 0 1 0 78 50 L54 50', fill: 'none', stroke: '#FFFFFF', 'stroke-width': 10,
      'stroke-linecap': 'round', 'stroke-linejoin': 'round', pathLength: 100, 'stroke-dasharray': 100
    });
    if (drawAt === undefined) {
      path.style.strokeDashoffset = '0';
    } else {
      anim(path, [{ strokeDashoffset: 100 }, { strokeDashoffset: 0 }], { at: drawAt, dur: 1.0, ease: EASE_IO });
    }
    return h('div', { class: 'mark' + (small ? ' sm' : '') }, h('svg', { viewBox: '0 0 100 100' }, path));
  }

  /* ------------------------------------------------------------------ */
  /* Séquence 1 — le problème                                            */
  /* ------------------------------------------------------------------ */

  function buildProblem(stage, start, dur, cfg) {
    var P = cfg.scenes.problem;
    var sc = shell('s1', start, dur, { first: true });
    var camera = h('div', { class: 'layer' });
    var clutter = h('div', { class: 'layer' });
    camera.appendChild(clutter);
    sc.appendChild(camera);

    // Lent zoom de caméra sur toute la séquence
    anim(camera, [
      { transform: 'scale(1) translate(0px, 0px)' },
      { transform: 'scale(1.08) translate(-14px, -24px)' }
    ], { at: start, dur: dur, ease: 'linear' });

    // Feuilles de papier qui s'accumulent (plan arrière flou, plan avant net)
    var R = rnd(11);
    var i;
    for (i = 0; i < 18; i++) {
      var back = i < 7;
      var x = 40 + R() * (1080 - 80 - 340);
      var y = 210 + R() * 520;
      var rot = (R() - 0.5) * 50;
      var spin = R() < 0.5 ? -45 : 45;
      var drift = (R() - 0.5) * 300;
      var sc0 = back ? 0.85 : 1;
      var paper = h('div', { class: 'paper' + (back ? ' back' : ''), style: { left: x.toFixed(1) + 'px', top: y.toFixed(1) + 'px' } },
        h('div', { class: 'paper-band ' + (i % 3 === 0 ? 'gold' : 'navy') }),
        h('div', { class: 'paper-lines' }));
      anim(paper, [
        { opacity: 0, transform: 'translate(' + drift.toFixed(1) + 'px, -1300px) rotate(' + (rot + spin).toFixed(1) + 'deg) scale(' + sc0 + ')' },
        { opacity: 1, transform: 'translate(0px, 0px) rotate(' + rot.toFixed(1) + 'deg) scale(' + sc0 + ')' }
      ], { at: start + 0.15 + i * 0.2, dur: 0.9 });
      clutter.appendChild(paper);
    }

    // Registres
    [{ x: 60, y: 880, r: -7, at: 1.4 }, { x: 560, y: 840, r: 6, at: 2.1 }].forEach(function (L) {
      var el = h('div', { class: 'ledger', style: { left: L.x + 'px', top: L.y + 'px' } }, 'REGISTRE');
      anim(el, [
        { opacity: 0, transform: 'translateY(500px) rotate(' + (L.r + 12) + 'deg)' },
        { opacity: 1, transform: 'translateY(0px) rotate(' + L.r + 'deg)' }
      ], { at: start + L.at, dur: 0.9 });
      clutter.appendChild(el);
    });

    // Notes adhésives : les tâches qui s'empilent
    var spots = [
      { x: 70, y: 560, r: -7, at: 2.6 }, { x: 770, y: 470, r: 6, at: 3.5 },
      { x: 120, y: 960, r: 5, at: 4.4 }, { x: 740, y: 900, r: -5, at: 5.3 }
    ];
    (P.notes || []).slice(0, 4).forEach(function (txt, k) {
      var s = spots[k];
      var el = h('div', { class: 'sticky', style: { left: s.x + 'px', top: s.y + 'px' } }, txt);
      anim(el, [
        { opacity: 0, transform: 'scale(0.5) rotate(' + (s.r - 14) + 'deg)' },
        { opacity: 1, transform: 'scale(1) rotate(' + s.r + 'deg)' }
      ], { at: start + s.at, dur: 0.55, ease: EASE_POP });
      clutter.appendChild(el);
    });

    // Horloge : le temps qui file
    var ticks = [];
    for (i = 0; i < 12; i++) {
      var a = i * Math.PI / 6;
      ticks.push(h('line', {
        x1: (87 + 72 * Math.sin(a)).toFixed(2), y1: (87 - 72 * Math.cos(a)).toFixed(2),
        x2: (87 + 82 * Math.sin(a)).toFixed(2), y2: (87 - 82 * Math.cos(a)).toFixed(2),
        stroke: C.navy, 'stroke-width': 4, 'stroke-linecap': 'round'
      }));
    }
    var minHand = h('div', { class: 'hand min' });
    var hrHand = h('div', { class: 'hand hr' });
    var clock = h('div', { class: 'clock' }, h('svg', { viewBox: '0 0 174 174' }, ticks), minHand, hrHand, h('div', { class: 'pin' }));
    anim(minHand, [{ transform: 'rotate(0deg)' }, { transform: 'rotate(2160deg)' }], { at: start + 0.3, dur: dur - 1.5, ease: 'linear' });
    anim(hrHand, [{ transform: 'rotate(0deg)' }, { transform: 'rotate(180deg)' }], { at: start + 0.3, dur: dur - 1.5, ease: 'linear' });
    anim(clock, [{ opacity: 0, transform: 'scale(0.6)' }, { opacity: 1, transform: 'scale(1)' }], { at: start + 0.4, dur: 0.7, ease: EASE_POP });
    clutter.appendChild(clock);

    // Fin de séquence : le papier est balayé par un trait de lumière dorée
    anim(clutter, [{ transform: 'translateY(0px)' }, { transform: 'translateY(-1500px)' }],
      { at: start + dur - 1.4, dur: 1.1, ease: 'cubic-bezier(0.6, 0, 0.9, 0.4)' });
    var sweep = h('div', { class: 'sweep' });
    anim(sweep, [
      { opacity: 0, transform: 'translateX(-100px) skewX(-14deg)', offset: 0 },
      { opacity: 1, transform: 'translateX(700px) skewX(-14deg)', offset: 0.5 },
      { opacity: 0, transform: 'translateX(1500px) skewX(-14deg)', offset: 1 }
    ], { at: start + dur - 1.7, dur: 1.2, ease: 'linear' });
    sc.appendChild(sweep);

    // Texte
    sc.appendChild(h('div', { class: 's1-shade' }));
    sc.appendChild(words(P.headline, start + 0.6, P.accent, 0.14));
    stage.appendChild(sc);
  }

  /* ------------------------------------------------------------------ */
  /* Séquence 2 — la transition                                          */
  /* ------------------------------------------------------------------ */

  function buildTransition(stage, start, dur, cfg) {
    var T = cfg.scenes.transition;
    var B = cfg.brand;
    var sc = shell('s2', start, dur, {});

    var glow = h('div', { class: 'glow', style: { left: '90px', top: '410px', width: '900px', height: '900px' } });
    anim(glow, [{ opacity: 0, transform: 'scale(0.5)' }, { opacity: 1, transform: 'scale(1.1)' }], { at: start, dur: 3, ease: EASE_OUT });
    sc.appendChild(glow);

    // Anneaux dorés qui s'étendent
    [0.2, 0.7, 1.2].forEach(function (d) {
      var ring = h('div', { class: 'ring' });
      anim(ring, [
        { opacity: 0, transform: 'scale(0.3)', offset: 0 },
        { opacity: 0.85, offset: 0.15 },
        { opacity: 0, transform: 'scale(3.4)', offset: 1 }
      ], { at: start + d, dur: 2.4, ease: 'cubic-bezier(0.2, 0.6, 0.3, 1)' });
      sc.appendChild(ring);
    });

    // « Et si vous simplifiiez votre quotidien ? »
    var hl = words(T.headline, start + 0.5, T.accent, 0.14);
    anim(hl, [
      { opacity: 1, transform: 'translateY(0px)', filter: 'blur(0px)' },
      { opacity: 0, transform: 'translateY(-60px)', filter: 'blur(12px)' }
    ], { at: start + 3.2, dur: 0.55, ease: EASE_IO });
    sc.appendChild(hl);

    // Apparition de Gestilys
    var mark = logoMark(false, start + 4.3);
    enter(mark, start + 3.9, { dur: 0.8, dy: 0, scale: 0.5, ease: EASE_POP });
    var word = h('div', { class: 'wordmark' }, B.name);
    enter(word, start + 4.5, { dur: 0.9, dy: 40, blur: 12 });
    var desc = h('div', { class: 'descriptor' }, B.descriptor);
    enter(desc, start + 5.0, { dur: 0.8, dy: 24 });
    sc.appendChild(h('div', { class: 'logo-reveal' }, mark, word, desc));
    stage.appendChild(sc);
  }

  /* ------------------------------------------------------------------ */
  /* Séquence 3 — la solution : écrans de gestion scolaire               */
  /* ------------------------------------------------------------------ */

  function pill(text, kind) { return h('span', { class: 'pill ' + kind }, text); }

  function avatar(initials, i) { return h('div', { class: 'avatar av' + (i % 5) }, initials); }

  function personRow(initials, i, name, sub, rightEl) {
    return h('div', { class: 'row' },
      avatar(initials, i),
      h('div', { class: 'grow' }, h('div', { class: 'rname' }, name), h('div', { class: 'rsub' }, sub)),
      rightEl);
  }

  function screenStudents(at) {
    var s = h('div', { class: 'screen' });
    var n = 0;
    var t = function () { return at + 0.45 + (n++) * 0.09; };
    var search = h('div', { class: 'search' }, iconSearch('#6B7C9E'), h('span', {}, 'Rechercher un élève'));
    rise(search, t()); s.appendChild(search);
    var chips = h('div', { class: 'chips' }, ['Tous', 'Primaire', 'Collège', 'Lycée'].map(function (c, i) {
      return h('span', { class: 'chip' + (i === 0 ? ' on' : '') }, c);
    }));
    rise(chips, t()); s.appendChild(chips);
    var people = [
      ['AT', 'Aminata Traoré', 'CM2 · A'], ['MK', 'Moussa Keïta', 'Collège · B'], ['FD', 'Fatoumata Diarra', 'CE1 · A'],
      ['IC', 'Ibrahim Coulibaly', 'Collège · A'], ['MS', 'Mariam Sangaré', 'Lycée · B']
    ];
    people.forEach(function (p, i) {
      var row = personRow(p[0], i, p[1], p[2], pill('Inscrit', 'info'));
      rise(row, t());
      if (i === 1) anim(row, [{ backgroundColor: '#FFFFFF' }, { backgroundColor: '#FFF1D6' }], { at: at + 2.2, dur: 0.4 });
      s.appendChild(row);
    });
    return s;
  }

  function screenEnrollment(at) {
    var s = h('div', { class: 'screen' });
    var n = 0;
    var t = function () { return at + 0.45 + (n++) * 0.1; };
    var steps = [h('i'), h('i'), h('i')];
    var stepper = h('div', { class: 'stepper' }, steps.map(function (i) { return h('div', { class: 'step' }, i); }));
    rise(stepper, t()); s.appendChild(stepper);
    steps.forEach(function (i, k) {
      anim(i, [{ width: '0%' }, { width: '100%' }], { at: at + 0.9 + k * 0.9, dur: 0.6, ease: EASE_IO });
    });
    var labels = h('div', { class: 'steplabels' }, h('span', {}, 'Élève'), h('span', {}, 'Parent'), h('span', {}, 'Classe'));
    rise(labels, t()); s.appendChild(labels);
    [['Nom de l’élève', 'Aminata Traoré'], ['Classe', 'CM2 · A'], ['Parent ou tuteur', 'M. Traoré']].forEach(function (f, k) {
      var lab = h('div', { class: 'slab' }, f[0]);
      rise(lab, t()); s.appendChild(lab);
      var text = h('span', {}, f[1]);
      var field = h('div', { class: 'field' }, text);
      rise(field, t());
      anim(text, [{ clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)' }], { at: at + 1.0 + k * 0.8, dur: 0.7, ease: 'steps(14)' });
      s.appendChild(field);
    });
    var btn = h('div', { class: 'btn' }, 'Valider l’inscription');
    rise(btn, t()); s.appendChild(btn);
    var toast = h('div', { class: 'toast' }, iconCheck('#17803D'), h('span', {}, 'Inscription enregistrée'));
    enter(toast, at + 3.3, { dur: 0.6, dy: 30, ease: EASE_POP });
    s.appendChild(toast);
    return s;
  }

  function screenPayments(at) {
    var s = h('div', { class: 'screen' });
    var n = 0;
    var t = function () { return at + 0.45 + (n++) * 0.09; };
    var fill = h('div', { class: 'bar-fill' });
    var card = h('div', { class: 'pcard' }, h('div', { class: 'pc-title' }, 'Scolarité · 1re tranche'), h('div', { class: 'bar' }, fill));
    rise(card, t()); s.appendChild(card);
    anim(fill, [{ width: '0%' }, { width: '70%' }], { at: at + 0.9, dur: 1.6, ease: EASE_OUT });
    var amount = '45\u00a0000\u00a0FCFA';
    var data = [
      ['Aminata Traoré', 'ok', null], ['Moussa Keïta', 'late', 'ok'],
      ['Fatoumata Diarra', 'ok', null], ['Ibrahim Coulibaly', 'late', null]
    ];
    data.forEach(function (d, i) {
      var slot = h('div', { class: 'pill-slot' });
      var first = pill(d[1] === 'ok' ? 'Payé' : 'En retard', d[1]);
      slot.appendChild(first);
      if (d[2]) {
        var paid = pill('Payé', 'ok');
        anim(first, [{ opacity: 1 }, { opacity: 0 }], { at: at + 2.7, dur: 0.25, ease: 'linear' });
        anim(paid, [{ opacity: 0, transform: 'scale(0.6)' }, { opacity: 1, transform: 'scale(1)' }], { at: at + 2.8, dur: 0.5, ease: EASE_POP });
        slot.appendChild(paid);
      }
      var row = h('div', { class: 'row' },
        h('div', { class: 'grow' }, h('div', { class: 'rname' }, d[0]), h('div', { class: 'rsub' }, '1re tranche · ' + amount)),
        slot);
      rise(row, t());
      s.appendChild(row);
    });
    return s;
  }

  function screenReceipt(at) {
    var s = h('div', { class: 'screen' });
    var rc = h('div', { class: 'receipt' });
    rise(rc, at + 0.45, 60);
    rc.appendChild(h('div', { class: 'rc-title' }, 'Reçu de paiement'));
    rc.appendChild(h('div', { class: 'rc-no' }, 'N° 0001 · exemple'));
    [['Élève', 'Aminata Traoré'], ['Classe', 'CM2 · A'], ['Désignation', 'Scolarité · 1re tranche'], ['Montant', '45\u00a0000\u00a0FCFA']].forEach(function (l, k) {
      var line = h('div', { class: 'rc-line' }, h('span', {}, l[0]), h('b', {}, l[1]));
      rise(line, at + 0.9 + k * 0.18, 24);
      rc.appendChild(line);
    });
    var stamp = h('div', { class: 'stamp' }, 'PAYÉ');
    anim(stamp, [{ opacity: 0, transform: 'scale(2.4)' }, { opacity: 1, transform: 'scale(1)' }], { at: at + 2.0, dur: 0.4, ease: EASE_POP });
    rc.appendChild(h('div', { class: 'stamp-pos' }, stamp));
    s.appendChild(rc);
    return s;
  }

  function screenReport(at) {
    var s = h('div', { class: 'screen' });
    var n = 0;
    var t = function () { return at + 0.45 + (n++) * 0.09; };
    var head = h('div', { class: 'rp-head' }, avatar('AT', 0),
      h('div', { class: 'grow' }, h('div', { class: 'rp-title' }, 'Aminata Traoré'), h('div', { class: 'rsub' }, 'Bulletin · 1er trimestre')));
    rise(head, t()); s.appendChild(head);
    [['Mathématiques', 14], ['Français', 15], ['Histoire-Géo', 12], ['Sciences', 16], ['Anglais', 13]].forEach(function (m) {
      var fill = h('div', { class: 'bar-fill' });
      var row = h('div', { class: 'subj' }, h('div', { class: 'subj-name' }, m[0]), h('div', { class: 'bar' }, fill), h('div', { class: 'note' }, String(m[1])));
      var when = t();
      rise(row, when);
      anim(fill, [{ width: '0%' }, { width: (m[1] / 20 * 100) + '%' }], { at: when + 0.3, dur: 1.0, ease: EASE_OUT });
      s.appendChild(row);
    });
    var avg = h('div', { class: 'avg' }, h('span', {}, 'Moyenne générale'), h('b', {}, '14,00'));
    rise(avg, t() + 0.2, 40);
    s.appendChild(avg);
    return s;
  }

  var SCREENS = {
    students: screenStudents,
    enrollment: screenEnrollment,
    payments: screenPayments,
    receipts: screenReceipt,
    report: screenReport
  };

  function buildSolution(stage, start, dur, cfg) {
    var feats = (cfg.scenes.solution.features || []).filter(function (f) { return f.enabled && SCREENS[f.id]; });
    var n = Math.max(1, feats.length);
    var slot = dur / n;
    var sc = shell('s3', start, dur, {});

    var glow = h('div', { class: 'glow', style: { left: '-100px', top: '700px', width: '1280px', height: '1280px', opacity: 0.55 } });
    sc.appendChild(glow);

    var titles = h('div', { class: 's3-titles' });
    var cardFloat = h('div', { class: 'card-float' });
    var card = h('div', { class: 'card' });
    var head = h('div', { class: 'card-head' }, logoMark(true), h('span', {}, cfg.brand.name), h('div', { class: 'spacer' }), h('div', { class: 'avatar-top' }));
    var body = h('div', { class: 'card-body' });
    card.appendChild(head);
    card.appendChild(body);
    cardFloat.appendChild(card);

    anim(card, [
      { opacity: 0, transform: 'translateY(160px) rotateX(10deg) scale(0.94)' },
      { opacity: 1, transform: 'translateY(0px) rotateX(0deg) scale(1)' }
    ], { at: start + 0.1, dur: 1.1 });
    anim(cardFloat, [
      { transform: 'translateY(0px)' }, { transform: 'translateY(-18px)' }, { transform: 'translateY(0px)' }
    ], { at: start, dur: dur, ease: EASE_IO });

    feats.forEach(function (f, k) {
      var from = start + k * slot;
      var to = from + slot;
      var last = k === n - 1;
      var base = from + (k === 0 ? 0.5 : 0);

      var tk = h('div', { class: 'ftitle' }, h('div', { class: 'kicker' }, f.kicker), h('div', { class: 'ttl' }, f.title));
      fadeWindow(tk, from + (k === 0 ? 0.2 : 0), to, { inD: 0.55, outD: 0.35, dy: 40, noOut: last });
      titles.appendChild(tk);

      var screen = SCREENS[f.id](base);
      fadeWindow(screen, from + (k === 0 ? 0.3 : 0), to, { inD: 0.4, outD: 0.35, dy: 24, noOut: last });
      body.appendChild(screen);
    });

    sc.appendChild(titles);
    sc.appendChild(cardFloat);

    // Points de progression
    var dots = h('div', { class: 'dots' });
    var INACT = 'rgba(255, 255, 255, 0.25)';
    feats.forEach(function (f, k) {
      var dot = h('div', { class: 'dot' });
      var a0 = (k * slot) / dur, a1 = a0 + 0.3 / dur;
      var b0 = ((k + 1) * slot) / dur, b1 = b0 + 0.3 / dur;
      var frames = [{ width: '16px', backgroundColor: INACT, offset: 0 }];
      if (a0 > 0) frames.push({ width: '16px', backgroundColor: INACT, offset: a0 });
      frames.push({ width: '64px', backgroundColor: C.gold, offset: a1 });
      if (k < n - 1) {
        frames.push({ width: '64px', backgroundColor: C.gold, offset: b0 });
        frames.push({ width: '16px', backgroundColor: INACT, offset: b1 });
      } else {
        frames.push({ width: '64px', backgroundColor: C.gold, offset: 1 });
      }
      anim(dot, frames, { at: start, dur: dur, ease: 'linear' });
      dots.appendChild(dot);
    });
    sc.appendChild(dots);

    var disc = h('div', { class: 'disc' }, cfg.brand.disclaimer);
    anim(disc, [{ opacity: 0 }, { opacity: 1 }], { at: start + 1.2, dur: 0.8, ease: 'linear' });
    sc.appendChild(disc);
    stage.appendChild(sc);
  }

  /* ------------------------------------------------------------------ */
  /* Séquence 4 — la signature + carte d'appel à l'action                */
  /* ------------------------------------------------------------------ */

  // Carte finale : « Profitez de 7 jours d'essai gratuit… » puis contact WhatsApp (aucun numéro affiché).
  // Textes : brand.ctaCard dans config/video.config.json. `at` = instant d'apparition (secondes).
  function buildEndCard(sc, at, E) {
    var lines = E.lines || [];
    var hi = E.highlight === undefined ? 1 : E.highlight;
    var contactAt = at + (E.contactDelay === undefined ? 4.0 : E.contactDelay);

    var card = h('div', { class: 'endcard' });
    enter(card, at, { dur: 0.8, dy: 90, scale: 0.94, ease: EASE_POP });

    if (E.badge) {
      var badge = h('div', { class: 'ec-badge' }, E.badge);
      enter(badge, at + 0.3, { dur: 0.6, dy: 20 });
      card.appendChild(badge);
    }

    // Message principal, ligne par ligne ; la ligne mise en valeur est surlignée en doré
    var title = h('div', { class: 'ec-title' });
    lines.forEach(function (txt, i) {
      var inner = i === hi ? h('span', { class: 'ec-hi' }, txt) : txt;
      var line = h('div', { class: 'ec-line' }, inner);
      enter(line, at + 0.5 + i * 0.3, { dur: 0.7, dy: 30, blur: 8 });
      if (i === hi) {
        anim(inner, [{ backgroundSize: '0% 100%' }, { backgroundSize: '100% 100%' }], { at: at + 1.5, dur: 0.8, ease: EASE_IO });
      }
      title.appendChild(line);
    });
    card.appendChild(title);

    // Séparateur, puis invitation à contacter sur WhatsApp
    var sep = h('div', { class: 'ec-sep' });
    anim(sep, [{ opacity: 0, transform: 'scaleX(0)' }, { opacity: 1, transform: 'scaleX(1)' }], { at: contactAt - 0.2, dur: 0.6, ease: EASE_IO });
    card.appendChild(sep);

    var ico = h('div', { class: 'ec-ico' }, iconPhone('#FFFFFF'));
    enter(ico, contactAt, { dur: 0.6, dy: 0, scale: 0.4, ease: EASE_POP });
    // légère pulsation de l'icône, après son apparition (propriété différente de l'apparition : pas de conflit)
    anim(ico, [{ filter: 'brightness(1)' }, { filter: 'brightness(1.15)' }, { filter: 'brightness(1)' }],
      { at: contactAt + 1.4, dur: 1.2, iterations: 2, ease: EASE_IO });

    var text = h('div', { class: 'ec-text' });
    (E.contact || []).forEach(function (txt, i) {
      var span = h('span', {}, txt);
      enter(span, contactAt + 0.2 + i * 0.3, { dur: 0.7, dy: 24, blur: 6 });
      text.appendChild(span);
    });
    card.appendChild(h('div', { class: 'ec-contact' }, ico, text));
    sc.appendChild(card);
  }

  function buildSignature(stage, start, dur, cfg) {
    var B = cfg.brand;
    var sc = shell('s4', start, dur, { last: true });

    var glow = h('div', { class: 'glow', style: { left: '90px', top: '170px', width: '900px', height: '900px' } });
    anim(glow, [{ opacity: 0, transform: 'scale(0.7)' }, { opacity: 1, transform: 'scale(1)' }], { at: start, dur: 2.5 });
    sc.appendChild(glow);

    // Grands arcs concentriques en rotation lente
    var arcs = h('svg', { class: 'arcs', viewBox: '0 0 1680 1680' }, [560, 700, 820].map(function (r, i) {
      return h('circle', {
        cx: 840, cy: 840, r: r, fill: 'none', stroke: C.gold, 'stroke-opacity': (0.30 - i * 0.07).toFixed(2),
        'stroke-width': 3, 'stroke-dasharray': i === 1 ? '6 18' : (i === 2 ? '120 40' : 'none')
      });
    }));
    anim(arcs, [{ transform: 'rotate(0deg) scale(1.25)', opacity: 0 }, { transform: 'rotate(8deg) scale(1.1)', opacity: 1, offset: 0.12 }, { transform: 'rotate(30deg) scale(1)', opacity: 1 }],
      { at: start, dur: dur, ease: 'linear' });
    sc.appendChild(arcs);

    var mark = logoMark(false, start + 0.6);
    enter(mark, start + 0.3, { dur: 0.8, dy: 0, scale: 0.5, ease: EASE_POP });
    var word = h('div', { class: 'wordmark' }, B.name);
    enter(word, start + 1.0, { dur: 0.9, dy: 50, blur: 14 });
    var rule = h('div', { class: 'rule' });
    anim(rule, [{ width: '0px', opacity: 0 }, { width: '380px', opacity: 1 }], { at: start + 1.6, dur: 0.8, ease: EASE_IO });
    var tag = h('div', { class: 'tagline' }, B.tagline);
    enter(tag, start + 2.0, { dur: 0.9, dy: 30, blur: 8 });
    var center = h('div', { class: 's4-center' }, mark, word, rule, tag);
    sc.appendChild(center);

    if (B.ctaCard) {
      // v2 : le bloc logo + slogan remonte et rétrécit, puis la carte « essai gratuit » prend la place
      var cardAt = (cfg.scenes.signature.ctaAt === undefined ? 5.4 : cfg.scenes.signature.ctaAt);
      anim(center, [
        { transform: 'translateY(0px) scale(1)' },
        { transform: 'translateY(-210px) scale(0.72)' }
      ], { at: start + cardAt - 0.2, dur: 1.0, ease: EASE_IO });
      buildEndCard(sc, start + cardAt, B.ctaCard);
    } else {
      // Version d'origine : simple bouton
      var cta = h('div', { class: 'cta' }, h('span', {}, B.cta), iconArrow(C.navy));
      enter(cta, start + 3.6, { dur: 0.7, dy: 40, scale: 0.9, ease: EASE_POP });
      sc.appendChild(cta);
      // Légère pulsation du bouton, après son apparition
      anim(cta, [{ filter: 'brightness(1)' }, { filter: 'brightness(1.12)' }, { filter: 'brightness(1)' }],
        { at: start + 4.8, dur: 1.4, iterations: 2, ease: EASE_IO });
    }
    stage.appendChild(sc);
  }

  /* ------------------------------------------------------------------ */
  /* Assemblage                                                          */
  /* ------------------------------------------------------------------ */

  function applyTheme(cfg) {
    C = cfg.colors || {};
    Object.keys(C).forEach(function (k) { document.documentElement.style.setProperty('--' + k, C[k]); });
  }

  function loadConfig() {
    if (window.__CONFIG__) return Promise.resolve(window.__CONFIG__);
    return fetch('../config/video.config.json').then(function (r) { return r.json(); });
  }

  function main() {
    return loadConfig().then(function (cfg) {
      applyTheme(cfg);
      var stage = document.getElementById('stage');
      var S = cfg.scenes;
      var dP = S.problem.duration, dT = S.transition.duration, dS = S.solution.duration, dG = S.signature.duration;
      var sT = dP, sS = dP + dT, sG = dP + dT + dS;

      buildProblem(stage, 0, dP, cfg);
      buildTransition(stage, sT, dT, cfg);
      buildSolution(stage, sS, dS, cfg);
      buildSignature(stage, sG, dG, cfg);

      stage.appendChild(h('div', { class: 'vignette' }));
      stage.appendChild(h('div', { class: 'grain' }));

      window.__TOTAL__ = dP + dT + dS + dG;
      window.__SCENES__ = { problem: [0, dP], transition: [sT, dT], solution: [sS, dS], signature: [sG, dG] };
      window.seek = function (t) {
        var ms = t * 1000;
        for (var i = 0; i < ALL.length; i++) ALL[i].currentTime = ms;
      };
      window.seek(0);
      return document.fonts.ready;
    }).then(function () {
      window.__READY__ = true;
    });
  }

  main().catch(function (e) {
    window.__ERROR__ = String((e && e.stack) || e);
    console.error(window.__ERROR__);
  });
})();
