// Musique instrumentale ORIGINALE synthétisée par code (aucun échantillon, aucune dépendance, libre de droits).
// 120 BPM : 1 temps = 0,5 s → les transitions de la vidéo (5, 11, 19, 25 s…) tombent exactement sur des temps.
// Sortie : WAV stéréo 44,1 kHz. Usage : node scripts/studio-music.mjs out/studio-music.wav
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
const SR = 44100, DUR = 28, N = SR * DUR, TAU = Math.PI * 2;
const L = new Float32Array(N), R = new Float32Array(N), WL = new Float32Array(N), WR = new Float32Array(N);
const rnd = (() => { let s = 123456789; return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296 * 2 - 1; }; })();
function put(t, dur, fn, gain = 1, pan = 0, send = 0) {
  const s = Math.floor(t * SR), n = Math.floor(dur * SR), gl = pan <= 0 ? 1 : 1 - pan, gr = pan >= 0 ? 1 : 1 + pan;
  for (let i = 0; i < n && s + i < N; i++) {
    const x = fn(i / SR, i / n) * gain;
    L[s + i] += x * gl; R[s + i] += x * gr;
    if (send) { WL[s + i] += x * send * gl; WR[s + i] += x * send * gr; }
  }
}
const env = (u, a, p = 3) => Math.min(1, u / a) * Math.pow(1 - u, p);
const hz = (n) => 440 * Math.pow(2, (n - 69) / 12);
const kick = (t, g = 1) => { let ph = 0; put(t, 0.34, (x, u) => { const f = 46 + 110 * Math.exp(-x * 32); ph += TAU * f / SR; return Math.sin(ph) * Math.exp(-x * 9) + 0.35 * Math.exp(-x * 120) * rnd(); }, 0.95 * g); };
const hat = (t, g = 0.3, open = false) => { let p = 0; put(t, open ? 0.22 : 0.06, (x, u) => { const n = rnd(), o = n - p; p = n; return o * Math.exp(-x * (open ? 14 : 70)); }, g, 0.25); };
const clap = (t, g = 0.5) => { let lp = 0; put(t, 0.22, (x) => { lp += (rnd() - lp) * 0.45; return lp * (Math.exp(-x * 24) + 0.6 * Math.exp(-((x - 0.012) ** 2) * 4e4)); }, g, -0.1, 0.25); };
const bass = (t, d, n, g = 0.5) => { let ph = 0, lp = 0; put(t, d, (x, u) => { ph += TAU * hz(n) / SR; const s = Math.sin(ph) + 0.4 * Math.sin(2 * ph) + 0.18 * Math.sin(3 * ph); lp += (s - lp) * 0.2; return lp * env(u, 0.02, 1.4); }, g); };
const pluck = (t, n, g = 0.3, pan = 0) => { let ph = 0; put(t, 0.7, (x, u) => { ph += TAU * hz(n) / SR; return (Math.sin(ph) + 0.5 * Math.sin(2 * ph) * Math.exp(-x * 12) + 0.25 * Math.sin(3 * ph) * Math.exp(-x * 20)) * Math.exp(-x * 6.5); }, g, pan, 0.55); };
const bell = (t, n, g = 0.25, d = 1.8) => { let ph = 0; put(t, d, (x, u) => { ph += TAU * hz(n) / SR; return Math.sin(ph + 2.2 * Math.exp(-x * 3) * Math.sin(ph * 3.5)) * Math.exp(-x * 2.4); }, g, 0, 0.7); };
const pad = (t, d, notes, g = 0.12, att = 1.2) => notes.forEach((n, k) => { let a = 0, b = 0, lp = 0; put(t, d, (x, u) => { a += TAU * hz(n) * 1.003 / SR; b += TAU * hz(n) * 0.997 / SR; const s = (Math.sin(a) + 0.5 * Math.sin(2 * a) + 0.3 * Math.sin(3 * a) + Math.sin(b) + 0.5 * Math.sin(2 * b)) * 0.4; lp += (s - lp) * 0.12; return lp * Math.min(1, x / att) * Math.min(1, (d - x) / 0.9); }, g, (k - 1) * 0.35, 0.3); });
const riser = (t0, t1, g = 0.35) => { let lp = 0; const d = t1 - t0; put(t0, d, (x, u) => { const c = 0.01 + 0.5 * u * u; lp += (rnd() - lp) * c; return lp * u * u * 3; }, g, 0, 0.2); };
const revcrash = (t1, d = 1.2, g = 0.3) => { let p = 0; put(t1 - d, d, (x, u) => { const n = rnd(), o = n - p; p = n; return o * Math.pow(u, 3); }, g, 0, 0.2); };
const impact = (t, g = 1) => { let ph = 0; put(t, 1.6, (x) => { ph += TAU * (38 + 40 * Math.exp(-x * 5)) / SR; return Math.sin(ph) * Math.exp(-x * 2.2); }, 0.95 * g); let lp = 0; put(t, 1.2, (x) => { lp += (rnd() - lp) * 0.5; return lp * Math.exp(-x * 4); }, 0.5 * g, 0, 0.5); };
const whoosh = (t, d = 0.5, g = 0.25) => { let lp = 0; put(t - d * 0.4, d, (x, u) => { lp += (rnd() - lp) * (0.02 + 0.45 * Math.sin(u * Math.PI)); return lp * Math.sin(u * Math.PI) * 2.2; }, g, 0.3, 0.3); };

// grille : accords de ré mineur → si♭ → fa → do (une mesure = 2 s)
const CH = [[50, 53, 57], [46, 50, 53], [53, 57, 60], [48, 52, 55]], ROOT = [38, 34, 41, 36];
const beats = DUR * 2;
for (let i = 0; i < beats; i++) {
  const t = i * 0.5, bar = Math.floor(t / 2) % 4, on = (a, b) => t >= a && t < b;
  const drums = on(0, 10) || on(11, 18.5) || on(21, 27);
  if (drums) kick(t, on(19, 25) ? 0.7 : 1);
  if (on(19, 21)) kick(t, 0.5);
  if (on(1, 10) || on(11, 18.5) || on(21, 27)) hat(t + 0.25, 0.28 + (i % 4 === 3 ? 0.15 : 0), i % 4 === 3);
  if (on(5, 8)) { hat(t, 0.2); hat(t + 0.125, 0.14); hat(t + 0.375, 0.16); }
  if ((i % 2 === 1) && (on(5, 8) || on(11, 18.5) || on(25, 27))) clap(t, 0.45);
  if (on(1, 5) || on(5, 10) || on(11, 18.5) || on(21, 25)) { bass(t, 0.22, ROOT[bar], 0.5); bass(t + 0.25, 0.18, ROOT[bar] + (i % 4 === 2 ? 7 : 0), 0.38); }
  if (on(11, 18.5)) { const c = CH[bar]; pluck(t, c[i % 3] + 24, 0.22, -0.3); pluck(t + 0.25, c[(i + 1) % 3] + 31, 0.16, 0.3); }
  if (on(21, 25)) pluck(t, CH[bar][(i + 2) % 3] + 36, 0.1, (i % 2 ? 0.4 : -0.4));
}
// nappes
for (let b = 0; b < 14; b++) { const t = b * 2; if (t >= 25) break; pad(t, 2.1, CH[b % 4].map((n) => n + 12), t >= 19 && t < 25 ? 0.15 : 0.1, t >= 19 ? 1.0 : 0.6); }
pad(25, 3, [50, 57, 62, 66].map((n) => n + 12), 0.14, 0.15); // résolution en ré majeur
bass(25, 2.8, 38, 0.5);
// montées, impacts et effets
riser(3.0, 5.0); revcrash(5.0, 1.0); impact(5.0);
riser(9.4, 11.0, 0.42); revcrash(11.0, 1.2, 0.35); impact(11.0);
riser(17.6, 19.0, 0.4); revcrash(19.0, 1.0, 0.3); impact(19.0, 0.9);
riser(23.7, 25.0, 0.3); revcrash(25.0, 1.0, 0.25); impact(25.0, 0.8);
// ordre qui se met en place (cartes à 8,0 + k·0,25 s) : gammes pentatoniques ascendantes
[62, 65, 69, 72, 74, 77].forEach((n, k) => pluck(8.0 + k * 0.25, n + 12, 0.3, (k % 2 ? 0.4 : -0.4)));
// changements de module (12,5 / 14 / 15,5 / 17 s) et compteurs
[12.5, 14, 15.5, 17].forEach((t, k) => { whoosh(t, 0.5); bell(t, [74, 77, 81, 86][k], 0.22, 1.2); });
// logo, mot-symbole, bouton
bell(20.6, 86, 0.3, 2.6); bell(20.6, 74, 0.25, 2.6); bell(22.0, 81, 0.22, 2.0); bell(23.1, 90, 0.18, 2.0); bell(26.0, 86, 0.28, 2.4); bell(26.0, 78, 0.2, 2.4); whoosh(21.15, 0.9, 0.25);

// écho stéréo (réverbération légère) puis mixage
const dl = Math.floor(0.375 * SR), dr = Math.floor(0.5 * SR);
for (let i = 0; i < N; i++) {
  const el = i >= dl ? WL[i - dl] : 0, er = i >= dr ? WR[i - dr] : 0;
  WL[i] += el * 0.42 + (i >= dr ? WR[i - dr] * 0.15 : 0); WR[i] += er * 0.42 + (i >= dl ? WL[i - dl] * 0.15 : 0);
  L[i] += WL[i] * 0.4; R[i] += WR[i] * 0.4;
}
let peak = 0;
for (let i = 0; i < N; i++) { const f = Math.min(1, i / (0.01 * SR)) * Math.min(1, (N - i) / (0.9 * SR)); L[i] = Math.tanh(L[i] * 0.9) * f; R[i] = Math.tanh(R[i] * 0.9) * f; peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i])); }
const g = 0.89 / peak, out = Buffer.alloc(44 + N * 4);
out.write('RIFF', 0); out.writeUInt32LE(36 + N * 4, 4); out.write('WAVEfmt ', 8); out.writeUInt32LE(16, 16); out.writeUInt16LE(1, 20); out.writeUInt16LE(2, 22);
out.writeUInt32LE(SR, 24); out.writeUInt32LE(SR * 4, 28); out.writeUInt16LE(4, 32); out.writeUInt16LE(16, 34); out.write('data', 36); out.writeUInt32LE(N * 4, 40);
for (let i = 0; i < N; i++) { out.writeInt16LE(Math.round(L[i] * g * 32767), 44 + i * 4); out.writeInt16LE(Math.round(R[i] * g * 32767), 46 + i * 4); }
const path = process.argv[2] || 'out/studio-music.wav'; mkdirSync(dirname(path), { recursive: true }); writeFileSync(path, out);
console.log(`Musique écrite : ${path} (${DUR} s, 120 BPM, pic normalisé à ${(20 * Math.log10(0.89)).toFixed(1)} dBFS)`);
