// Rendu image par image du studio (Chromium + seek(t)). Variables : WORKERS, TIMES="1,2.5" (aperçu), FRAMES_DIR, QUALITY
import { chromium } from 'playwright';
import { readFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const cfg = JSON.parse(readFileSync(join(root, 'studio', 'config.json'), 'utf8'));
const { fps, width, height, duration } = cfg.video;
const cuesFile = join(root, 'out', 'studio-voice', 'cues.json');
const cues = existsSync(cuesFile) ? JSON.parse(readFileSync(cuesFile, 'utf8')) : [];
console.log(cues.length ? `Sous-titres : ${cues.length} (out/studio-voice/cues.json)` : 'Sous-titres : aucun (pas de voix générée)');
const workers = Math.max(1, Math.min(8, parseInt(process.env.WORKERS || '4', 10) || 4));
const times = process.env.TIMES ? process.env.TIMES.split(',').map(Number) : null;
const outDir = resolve(root, process.env.FRAMES_DIR || (times ? 'out/studio-preview' : 'out/studio-frames'));
const ext = times ? 'png' : 'jpg';
if (existsSync(outDir)) rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

const jobs = times ? times.map((t) => ({ name: `t${t.toFixed(2).padStart(6, '0')}.png`, t })) :
  Array.from({ length: Math.round(duration * fps) }, (_, i) => ({ name: `${String(i + 1).padStart(5, '0')}.jpg`, t: i / fps }));
console.log(`Rendu studio : ${jobs.length} image(s), ${width}×${height}, ${fps} i/s, ${duration} s, ${workers} onglet(s)`);

const browser = await chromium.launch({ args: ['--force-color-profile=srgb', '--font-render-hinting=none', '--disable-lcd-text', '--enable-unsafe-swiftshader'] });
const errors = [];
const url = pathToFileURL(join(root, 'studio', 'index.html')).href;
let done = 0; const t0 = Date.now();

async function worker(id) {
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  await page.addInitScript(([c, s]) => { window.__CONFIG__ = c; window.__SUBS__ = s; }, [cfg, cues]);
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__READY__ === true || !!window.__ERROR__, null, { timeout: 60000 });
  const err = await page.evaluate(() => window.__ERROR__ || null);
  if (err) throw new Error('Erreur dans la page : ' + err);
  for (let i = id; i < jobs.length; i += workers) {
    const job = jobs[i];
    await page.evaluate((t) => window.seek(t), job.t);
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
    await page.screenshot({ path: join(outDir, job.name), type: ext === 'png' ? 'png' : 'jpeg', quality: ext === 'png' ? undefined : parseInt(process.env.QUALITY || '95', 10) });
    done++;
    if (done % 30 === 0 || done === jobs.length) { const s = (Date.now() - t0) / 1000; console.log(`  ${done}/${jobs.length} (${(done / s).toFixed(1)} i/s, ${s.toFixed(0)} s)`); }
  }
  await ctx.close();
}
try { await Promise.all(Array.from({ length: workers }, (_, i) => worker(i))); }
catch (e) { console.error('ÉCHEC DU RENDU :', e.message); if (errors.length) console.error([...new Set(errors)].slice(0, 20).join('\n')); await browser.close(); process.exit(1); }
await browser.close();
if (errors.length) { console.error('Erreurs dans la page :\n' + [...new Set(errors)].slice(0, 20).join('\n')); process.exit(1); }
console.log(`Terminé : ${jobs.length} image(s) dans ${outDir}`);
