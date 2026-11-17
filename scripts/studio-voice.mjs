// Agent voix off : génère (ou importe) la voix de chaque segment, l'ajuste à sa fenêtre, produit le minutage et les sous-titres.
// Fournisseurs (studio/voice.json → "provider", ou variable VOICE_PROVIDER) :
//   piper   : Piper local, gratuit, sans clé API (voix masculine configurable)
//   file    : vos propres enregistrements déposés dans audio/voice/<id>.wav|mp3
//   standin : voix de SUBSTITUTION pour tester le montage (bip vocal, inaudible comme parole) — refusée en production
//   none    : aucune voix
// Sorties : out/studio-voice/{voice.wav, timing.json, cues.json, VOICE-ATTRIBUTION.txt}
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const cfg = JSON.parse(readFileSync(join(root, 'studio', 'voice.json'), 'utf8'));
const provider = process.env.VOICE_PROVIDER || cfg.provider;
const out = join(root, 'out', 'studio-voice');
const TOTAL = JSON.parse(readFileSync(join(root, 'studio', 'config.json'), 'utf8')).video.duration;
rmSync(out, { recursive: true, force: true }); mkdirSync(out, { recursive: true });
if (provider === 'none') { console.log('Voix désactivée (provider = none).'); process.exit(0); }
if (provider === 'standin' && process.env.STUDIO_ALLOW_STANDIN !== '1') throw new Error('Le fournisseur « standin » est réservé aux tests (STUDIO_ALLOW_STANDIN=1) : il ne produit pas une vraie voix.');

const run = (cmd, args, opts = {}) => { const r = spawnSync(cmd, args, { encoding: 'utf8', ...opts }); if (r.error) throw r.error; if (r.status !== 0) throw new Error(`${cmd} a échoué (code ${r.status}) : ${(r.stderr || '').slice(-400)}`); return r; };
const duration = (f) => parseFloat(run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).stdout);
const meanDb = (f) => { const r = spawnSync('ffmpeg', ['-hide_banner', '-i', f, '-af', 'volumedetect', '-f', 'null', '-'], { encoding: 'utf8' }); const m = /mean_volume:\s*(-?[\d.]+|-inf)/.exec(r.stderr || ''); return m ? parseFloat(m[1]) : -99; };

/* ---------- fournisseurs ---------- */
function syllables(w) { const m = w.toLowerCase().replace(/e$/, '').match(/[aeiouyàâäéèêëîïôöùûü]+/g); return Math.max(1, m ? m.length : 1); }
function writeWav(path, samples, sr = 22050) {
  const b = Buffer.alloc(44 + samples.length * 2);
  b.write('RIFF', 0); b.writeUInt32LE(36 + samples.length * 2, 4); b.write('WAVEfmt ', 8); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22);
  b.writeUInt32LE(sr, 24); b.writeUInt32LE(sr * 2, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34); b.write('data', 36); b.writeUInt32LE(samples.length * 2, 40);
  for (let i = 0; i < samples.length; i++) b.writeInt16LE(Math.max(-32767, Math.min(32767, Math.round(samples[i] * 32767))), 44 + i * 2);
  writeFileSync(path, b);
}
function standin(text, file) {
  const sr = 22050, parts = []; let ph = 0;
  for (const w of text.replace(/[^\p{L}\s']/gu, ' ').split(/\s+/).filter(Boolean)) {
    for (let s = 0; s < syllables(w); s++) {
      const n = Math.floor(0.17 * sr), f0 = 105 + 12 * Math.sin(parts.length);
      for (let i = 0; i < n; i++) { const u = i / n, e = Math.sin(Math.PI * u) ** 0.7; ph += 2 * Math.PI * f0 / sr; parts.push(e * 0.35 * (Math.sin(ph) + 0.5 * Math.sin(2 * ph) + 0.35 * Math.sin(3 * ph) + 0.2 * Math.sin(8 * ph))); }
    }
    for (let i = 0; i < 0.07 * sr; i++) parts.push(0);
  }
  writeWav(file, parts, sr);
}
let piperNote = '';
function piperSynth(segments) {
  const voice = process.env.PIPER_VOICE || cfg.piper.voice, dir = join(out, 'piper-voices'), model = join(dir, voice + '.onnx');
  mkdirSync(dir, { recursive: true });
  if (!existsSync(model)) run(process.env.PYTHON || 'python3', ['-m', 'piper.download_voices', voice, '--data-dir', dir], { stdio: 'inherit' });
  const [lang, name, quality] = [voice.split('-')[0], voice.split('-')[1], voice.split('-')[2]];
  piperNote = `https://huggingface.co/rhasspy/piper-voices/resolve/main/${lang.slice(0, 2)}/${lang}/${name}/${quality}/MODEL_CARD`;
  for (const s of segments) run(process.env.PYTHON || 'python3', ['-m', 'piper', '-m', model, '-f', s.raw, '--', s.text], { stdio: ['ignore', 'inherit', 'inherit'] });
}

/* ---------- génération des segments ---------- */
const segs = cfg.segments.map((s) => ({ ...s, raw: join(out, `${s.id}.raw.wav`) }));
if (provider === 'piper') piperSynth(segs);
else if (provider === 'file') {
  const dir = join(root, cfg.file.dir);
  for (const s of segs) {
    const f = ['wav', 'mp3', 'm4a'].map((e) => join(dir, `${s.id}.${e}`)).find(existsSync);
    if (!f) throw new Error(`Enregistrement manquant : ${cfg.file.dir}/${s.id}.wav (texte : « ${s.text} »)`);
    run('ffmpeg', ['-y', '-v', 'error', '-i', f, '-ar', '44100', s.raw]);
  }
} else if (provider === 'standin') segs.forEach((s) => standin(s.text, s.raw));
else throw new Error('Fournisseur de voix inconnu : ' + provider);

/* ---------- ajustement à la fenêtre, contrôle, minutage ---------- */
const timing = [], cues = [];
for (const s of segs) {
  if (!existsSync(s.raw)) throw new Error(`Segment non généré : ${s.id}`);
  const db = meanDb(s.raw);
  if (db < -45) throw new Error(`Segment « ${s.id} » quasi silencieux (${db} dB) : voix invalide.`);
  let dur = duration(s.raw), f = 1;
  const avail = s.end - s.start;
  if (dur > avail) { f = dur / avail; if (f > cfg.maxSpeedup) throw new Error(`Segment « ${s.id} » trop long : ${dur.toFixed(2)} s pour une fenêtre de ${avail.toFixed(2)} s (accélération ${f.toFixed(2)}× > ${cfg.maxSpeedup}×). Raccourcissez le texte dans studio/voice.json.`); dur = avail; }
  if (s.start + dur > TOTAL - 0.1) throw new Error(`Segment « ${s.id} » dépasse la fin de la vidéo.`);
  s.f = f; s.dur = dur;
  timing.push({ id: s.id, start: s.start, end: +(s.start + dur).toFixed(3), speed: +f.toFixed(3), text: s.text });
  // sous-titres : phrases courtes réparties au prorata de leur longueur
  let chunks = s.text.split(/(?<=[.,:;!?])\s+/), merged = [];
  for (const c of chunks) { if (merged.length && (merged[merged.length - 1] + ' ' + c).length <= cfg.maxCueChars && merged[merged.length - 1].length < 14) merged[merged.length - 1] += ' ' + c; else merged.push(c); }
  const total = merged.reduce((a, c) => a + c.length, 0); let t = s.start;
  merged.forEach((c, i) => { const d = dur * c.length / total; cues.push({ k: `${s.id}-${i}`, s: +(t - 0.04).toFixed(3), e: +(t + d + 0.18).toFixed(3), text: c }); t += d; });
}
const ms = (x) => Math.round(x * 1000);
const inputs = segs.flatMap((s) => ['-i', s.raw]);
const chain = segs.map((s, i) => `[${i}:a]aresample=44100,aformat=channel_layouts=stereo,${s.f > 1.001 ? `atempo=${s.f.toFixed(4)},` : ''}adelay=${ms(s.start)}|${ms(s.start)}[v${i}]`).join(';');
const mix = segs.map((_, i) => `[v${i}]`).join('') + `amix=inputs=${segs.length}:normalize=0,apad=whole_dur=${TOTAL},loudnorm=I=-16:TP=-2:LRA=7[out]`;
run('ffmpeg', ['-y', '-v', 'error', ...inputs, '-filter_complex', `${chain};${mix}`, '-map', '[out]', '-t', String(TOTAL), '-ar', '44100', join(out, 'voice.wav')]);
writeFileSync(join(out, 'timing.json'), JSON.stringify({ provider, voice: provider === 'piper' ? (process.env.PIPER_VOICE || cfg.piper.voice) : provider, segments: timing }, null, 2));
writeFileSync(join(out, 'cues.json'), JSON.stringify(cues, null, 2));
if (provider === 'piper') writeFileSync(join(out, 'VOICE-ATTRIBUTION.txt'), `Voix Piper : ${process.env.PIPER_VOICE || cfg.piper.voice}\nFiche du modèle (licence à respecter) : ${piperNote}\nMoteur Piper : GPL-3.0-or-later, utilisé comme outil externe.\n${cfg.piper.note}\n`);
console.log(`VOIX OK (${provider}) : ${segs.length} segments, ${cues.length} sous-titres, piste de ${TOTAL} s.`);
timing.forEach((t) => console.log(`  ${t.id.padEnd(9)} ${t.start.toFixed(2)} → ${t.end.toFixed(2)} s  (vitesse ×${t.speed})`));
