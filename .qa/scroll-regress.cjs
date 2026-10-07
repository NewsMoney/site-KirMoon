// Regression checks for behaviour that must be preserved. Usage: node regress.cjs <file.html>
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const file = path.resolve(process.argv[2]);
// Optional local copy of three.js r128 (npm i three@0.128.0) when the CDN is unreachable.
const threePath = path.join(__dirname, 'node_modules/three/build/three.min.js');
const THREE = fs.existsSync(threePath) ? fs.readFileSync(threePath) : null;
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function open(browser, w, h, opts = {}) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, reducedMotion: opts.reduce ? 'reduce' : 'no-preference', hasTouch: !!opts.touch });
  const page = await ctx.newPage();
  const errors = [];
  if (THREE) await page.route('**/three.min.js', r => r.fulfill({ body: THREE, contentType: 'text/javascript' }));
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('file://' + file); await sleep(700); await page.mouse.move(w / 2, h / 2);
  return { ctx, page, errors };
}
const st = page => page.evaluate(() => {
  const p = document.getElementById('processo').getBoundingClientRect(), s = document.getElementById('servicos').getBoundingClientRect();
  const steps = [...document.querySelectorAll('[data-process-step]')];
  return { hash:(document.documentElement.dataset.kmHash||location.hash), y: Math.round(scrollY), anim: document.body.classList.contains('scene-transitioning'), procTop: Math.round(p.top),
    svcTop: Math.round(s.top), svcEdge: Math.round(s.bottom - innerHeight), ih: innerHeight,
    step: steps.findIndex(x => x.classList.contains('is-active')) };
});
async function idle(page) { for (let i = 0; i < 80; i++) { const s = await st(page); if (!s.anim) return s; await sleep(50); } return st(page); }
async function click(page, sel) { await page.evaluate(s => document.querySelector(s).click(), sel); await sleep(1700); return idle(page); }
const out = [];
async function t(name, fn) { try { const r = await fn(); out.push({ name, ...r }); console.log((r.pass ? 'PASS ' : 'FAIL ') + name, JSON.stringify(r.info)); } catch (e) { out.push({ name, pass: false }); console.log('ERR  ' + name, e.message); } }

(async () => {
  const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : { channel: 'chrome' });
  for (const [w, h] of [[1440, 900], [1920, 1080], [1024, 600]]) {
    await t(`${w}x${h} mid-Services wheel stays native (no early entry)`, async () => {
      const { ctx, page, errors } = await open(browser, w, h);
      await click(page, 'a[href="#servicos"]');
      const s0 = await st(page);
      for (let i = 0; i < 6; i++) { await page.mouse.wheel(0, 100); await sleep(120); }
      await sleep(600); const s1 = await st(page); await ctx.close();
      return { pass: s1.hash === '#servicos' && s1.y > s0.y && !errors.length, info: { from: s0.y, to: s1.y, hash: s1.hash, errors } };
    });
    await t(`${w}x${h} reversal at edge does not enter Process`, async () => {
      const { ctx, page } = await open(browser, w, h);
      await click(page, 'a[href="#servicos"]');
      await page.evaluate(() => { const s = document.getElementById('servicos').getBoundingClientRect(); scrollTo({ top: scrollY + s.bottom - innerHeight - 150, behavior: 'instant' }); });
      await sleep(300);
      await page.mouse.wheel(0, 100); await sleep(80); await page.mouse.wheel(0, -100); await sleep(80); await page.mouse.wheel(0, -100);
      await sleep(1500); const s = await st(page); await ctx.close();
      return { pass: s.hash === '#servicos' && s.svcEdge > 0, info: s };
    });
    await t(`${w}x${h} Process phases advance one per gesture, then Final, then back to Process`, async () => {
      const { ctx, page } = await open(browser, w, h);
      await click(page, 'a[href="#processo"]'); await sleep(400);
      const steps = [(await st(page)).step];
      const gesture = async d => { for (let k = 0; k < 3; k++) { await page.mouse.wheel(0, d); await sleep(16); } await sleep(300); };
      for (let g = 0; g < 3; g++) { const before = (await st(page)).step; await gesture(100);
        for (let i = 0; i < 50 && (await st(page)).step === before; i++) await sleep(50); await sleep(1400); steps.push((await st(page)).step); }
      await gesture(100); await sleep(2000); const fin = await idle(page); await sleep(500);
      // back up from Final top into Process
      await gesture(-100); await sleep(2200); const back = await idle(page);
      await ctx.close();
      return { pass: steps.join() === '0,1,2,3' && ['#compromissos','#faq'].includes(fin.hash) && back.hash === '#processo', info: { steps, final: fin.hash, back: back.hash } };
    });
  }
  await t('keyboard PageDown Services edge -> Process', async () => {
    const { ctx, page } = await open(browser, 1440, 900);
    await click(page, 'a[href="#servicos"]');
    for (let i = 0; i < 30; i++) { const s = await st(page); if (s.hash === '#processo') break; await page.keyboard.press('PageDown'); await sleep(450); }
    const s = await idle(page); await ctx.close();
    return { pass: s.hash === '#processo', info: s };
  });
  await t('reduced motion: nav click lands on Process instantly', async () => {
    const { ctx, page } = await open(browser, 1440, 900, { reduce: true });
    await page.evaluate(() => document.querySelector('a[href="#processo"]').click()); await sleep(200);
    const s = await st(page); await ctx.close();
    return { pass: s.hash === '#processo' && Math.abs(s.procTop) <= 2, info: s };
  });
  await t('narrow 800x900: native wheel scrolling, no errors', async () => {
    const { ctx, page, errors } = await open(browser, 800, 900);
    const y0 = (await st(page)).y;
    for (let i = 0; i < 20; i++) { await page.mouse.wheel(0, 300); await sleep(60); }
    await sleep(800); const s = await st(page); await ctx.close();
    return { pass: s.y > y0 + 2000 && !errors.length, info: { y: s.y, errors } };
  });
  // Layout fingerprint of all sections (CSS/HTML untouched => identical).
  const layout = {};
  for (const [w, h] of [[1440, 900], [800, 900], [1920, 1080]]) {
    const { ctx, page } = await open(browser, w, h);
    layout[`${w}x${h}`] = await page.evaluate(() => [...document.querySelectorAll('section, header, footer, main > *')].map(e => { const r = e.getBoundingClientRect(); return [e.id || e.tagName, Math.round(r.top + scrollY), Math.round(r.height), Math.round(r.width)]; }));
    await ctx.close();
  }
  await browser.close();
  fs.writeFileSync(path.join(__dirname, 'layout-' + path.basename(file) + '.json'), JSON.stringify(layout));
  console.log(`\n${out.filter(r => r.pass).length}/${out.length} passed`);
})();
