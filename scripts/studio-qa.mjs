// Contrôle automatique de la mise en page : aucun texte coupé ni hors écran aux instants où il doit être lisible.
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
const root = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const cfg = JSON.parse(readFileSync(join(root, 'studio', 'config.json'), 'utf8'));
const HOLDS = [4.3, 4.45, 9.9, 10.05, 12.3, 13.9, 15.4, 16.9, 18.3, 22.9, 24.3, 26.9, 27.05];
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
const errs = []; page.on('pageerror', (e) => errs.push(e.message));
await page.addInitScript((c) => { window.__CONFIG__ = c; }, cfg);
await page.goto(pathToFileURL(join(root, 'studio', 'index.html')).href);
await page.waitForFunction(() => window.__READY__ === true || !!window.__ERROR__);
let bad = 0;
for (const t of HOLDS) {
  await page.evaluate((x) => window.seek(x), t);
  const res = await page.evaluate(() => {
    const M = 20, out = [];
    const eff = (n) => { let o = 1; for (; n && n.nodeType === 1; n = n.parentElement) { const c = getComputedStyle(n); if (c.display === 'none') return 0; o *= parseFloat(c.opacity); } return o; };
    document.querySelectorAll('[data-q]').forEach((el) => {
      const ch = el.querySelector('.ch'), target = el.querySelector('.kl') || el, o = eff(ch || el);
      if (o < 0.9) return;
      const rg = document.createRange(); rg.selectNodeContents(el.querySelector('.kl') ? target : el); const useEl = el.classList.contains('cta'); const r = (el.querySelector('.kl') || useEl) ? target.getBoundingClientRect() : rg.getBoundingClientRect(), txt = el.textContent.trim().slice(0, 28);
      if (r.width < 2) return;
      if (r.left < M || r.right > 1080 - M || r.top < M || r.bottom > 1920 - M) out.push(`${txt} → [${r.left | 0},${r.top | 0},${r.right | 0},${r.bottom | 0}]`);
    });
    return out;
  });
  if (res.length) { bad += res.length; console.log(`t=${t}s : HORS ÉCRAN`, res); } else console.log(`t=${t}s : OK`);
}
await browser.close();
if (errs.length) { console.error('Erreurs JS :', errs); process.exit(1); }
if (bad) process.exit(1);
console.log('QA mise en page : OK');
