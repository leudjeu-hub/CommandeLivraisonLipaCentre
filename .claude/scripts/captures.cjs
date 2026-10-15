// Captures d'écran du site pour l'analyse design : mobile, tablette, ordinateur, en FR et EN.
// Usage : node .claude/scripts/captures.cjs [url]   (par défaut : http://127.0.0.1:4200)
// Prérequis : npm install, npx playwright install chromium, et le site servi (npm start).
const { chromium } = require('@playwright/test');
const fs = require('node:fs');

const base = process.argv[2] || 'http://127.0.0.1:4200';
const out = 'captures';
const viewports = { mobile: { width: 360, height: 740 }, tablette: { width: 768, height: 1024 }, ordinateur: { width: 1280, height: 800 } };

(async () => {
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch();
  const report = [];
  for (const lang of ['fr', 'en']) {
    for (const [name, viewport] of Object.entries(viewports)) {
      const page = await browser.newPage({ viewport, deviceScaleFactor: 1, isMobile: name === 'mobile', hasTouch: name !== 'ordinateur' });
      let bytes = 0;
      page.on('response', async (r) => { try { bytes += (await r.body()).length; } catch {} });
      await page.goto(`${base}/?lang=${lang}`, { waitUntil: 'networkidle' });
      const file = `${out}/${lang}-${name}.png`;
      await page.screenshot({ path: file, fullPage: true });
      // Débordement horizontal = défaut de mise en page
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
      // Cibles tactiles sous 44 px (recommandé) ; sous 24 px = non conforme WCAG 2.2 AA
      const smallTargets = await page.evaluate(() =>
        [...document.querySelectorAll('a, button, input, select, textarea')]
          .filter((n) => n.offsetParent !== null)
          .map((n) => ({ n, r: n.getBoundingClientRect() }))
          .filter(({ r }) => r.width > 0 && (r.height < 44 || r.width < 44))
          .map(({ n, r }) =>
            `${n.id ? '#' + n.id : n.tagName.toLowerCase()} « ${(n.textContent || n.placeholder || '').trim().replace(/\s+/g, ' ').slice(0, 30)} » ${Math.round(r.width)}×${Math.round(r.height)} px` +
            (Math.min(r.width, r.height) < 24 ? ' — NON CONFORME WCAG 2.5.8 (< 24 px)' : ''))
      );
      report.push({ lang, viewport: name, file, poids_approx_ko: Math.round(bytes / 1024), debordement: overflow, cibles_petites: name === 'ordinateur' ? [] : smallTargets });
      await page.close();
    }
  }
  await browser.close();
  fs.writeFileSync(`${out}/rapport.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
})();
