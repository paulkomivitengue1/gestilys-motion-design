// Rend la publicité image par image : Chromium ouvre src/index.html, positionne le temps (seek)
// puis capture une image PNG 1080 × 1920. FFmpeg assemble ensuite les images (scripts/encode.sh).
//
// Variables d'environnement :
//   WORKERS=4      nombre d'onglets de rendu en parallèle
//   PREVIEW=1      ne rend que quelques images clés (rapide) dans out/preview/
import { chromium } from 'playwright';
import { readFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const cfg = JSON.parse(readFileSync(join(root, 'config', 'video.config.json'), 'utf8'));
const { fps, width, height } = cfg.video;
const preview = process.env.PREVIEW === '1';
const workers = Math.max(1, Math.min(8, parseInt(process.env.WORKERS || '4', 10) || 4));

const S = cfg.scenes;
const total = S.problem.duration + S.transition.duration + S.solution.duration + S.signature.duration;
const totalFrames = Math.round(total * fps);

const outDir = join(root, preview ? 'out/preview' : 'frames');
if (existsSync(outDir)) rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

// Liste des images à produire : [numéro, instant en secondes]
let jobs = [];
if (preview) {
  const starts = [0, S.problem.duration, S.problem.duration + S.transition.duration, S.problem.duration + S.transition.duration + S.solution.duration];
  const lens = [S.problem.duration, S.transition.duration, S.solution.duration, S.signature.duration];
  const names = ['1-probleme', '2-transition', '3-solution', '4-signature'];
  // plusieurs instants par séquence, pour juger les animations
  // (signature : logo, apparition de la carte d'essai gratuit, titre complet, contact WhatsApp, image finale)
  const fractions = [[0.25, 0.55, 0.9], [0.2, 0.55, 0.9], [0.1, 0.3, 0.5, 0.7, 0.9], [0.25, 0.45, 0.62, 0.8, 0.96]];
  starts.forEach((s, i) => fractions[i].forEach((f, k) => {
    const t = Math.min(total - 1 / fps, s + lens[i] * f);
    jobs.push({ name: `${names[i]}-${String(k + 1).padStart(2, '0')}-t${t.toFixed(1)}s.png`, t });
  }));
} else {
  for (let i = 0; i < totalFrames; i++) jobs.push({ name: `${String(i + 1).padStart(5, '0')}.png`, t: i / fps });
}

console.log(`Rendu ${preview ? 'APERÇU' : 'VIDÉO'} : ${jobs.length} image(s), ${width}×${height}, ${fps} i/s, durée ${total} s, ${workers} onglet(s)`);

const browser = await chromium.launch({
  args: ['--force-color-profile=srgb', '--font-render-hinting=none', '--disable-lcd-text']
});

const errors = [];
const pageUrl = pathToFileURL(join(root, 'src', 'index.html')).href;
let done = 0;
const t0 = Date.now();

async function openPage() {
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });
  await page.addInitScript((c) => { window.__CONFIG__ = c; }, cfg);
  await page.goto(pageUrl, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__READY__ === true || !!window.__ERROR__, null, { timeout: 60000 });
  const err = await page.evaluate(() => window.__ERROR__ || null);
  if (err) throw new Error(`Erreur dans la page : ${err}`);
  return page;
}

async function worker(id) {
  const page = await openPage();
  for (let i = id; i < jobs.length; i += workers) {
    const job = jobs[i];
    await page.evaluate((t) => window.seek(t), job.t);
    // laisse le navigateur appliquer le style (avec sécurité si requestAnimationFrame ne répond pas)
    await page.evaluate(() => new Promise((r) => { const t = setTimeout(r, 400); requestAnimationFrame(() => { clearTimeout(t); r(); }); }));
    await page.screenshot({ path: join(outDir, job.name), type: 'png' });
    done++;
    if (done % 60 === 0 || done === jobs.length) {
      const sec = (Date.now() - t0) / 1000;
      console.log(`  ${done}/${jobs.length} images (${(done / sec).toFixed(1)} i/s, ${sec.toFixed(0)} s)`);
    }
  }
  await page.context().close();
}

try {
  await Promise.all(Array.from({ length: workers }, (_, i) => worker(i)));
} catch (e) {
  console.error('ÉCHEC DU RENDU :', e.message);
  if (errors.length) console.error(errors.slice(0, 20).join('\n'));
  await browser.close();
  process.exit(1);
}
await browser.close();

if (errors.length) {
  console.error('Erreurs détectées dans la page pendant le rendu :');
  console.error([...new Set(errors)].slice(0, 20).join('\n'));
  process.exit(1);
}
console.log(`Terminé : ${jobs.length} image(s) dans ${outDir}`);
