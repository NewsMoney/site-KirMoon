// Real-browser (Chromium) end-to-end checks of the Services -> Process wheel path.
// Usage: node harness.cjs <file.html> [scenario-filter]
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const file = path.resolve(process.argv[2] || 'orig.html');
const filter = process.argv[3] || '';
// Optional local copy of three.js r128 (npm i three@0.128.0) when the CDN is unreachable.
const threePath = path.join(__dirname, 'node_modules/three/build/three.min.js');
const THREE = fs.existsSync(threePath) ? fs.readFileSync(threePath) : null;

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function open(browser, w, h, hash = '') {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  if (THREE) await page.route('**/three.min.js', r => r.fulfill({ body: THREE, contentType: 'text/javascript' }));
  page.on('pageerror', e => console.log('  [pageerror]', e.message));
  await page.goto('file://' + file + hash);
  await page.waitForTimeout(700);
  await page.mouse.move(w / 2, h / 2);
  return { ctx, page };
}
const state = page => page.evaluate(() => {
  const cur = document.querySelector('.chapter-nav a[aria-current]');
  const p = document.getElementById('processo').getBoundingClientRect();
  const s = document.getElementById('servicos').getBoundingClientRect();
  return { hash:(document.documentElement.dataset.kmHash||location.hash), y: Math.round(scrollY), cur: cur && cur.hash, anim: document.body.classList.contains('scene-transitioning'),
    procTop: Math.round(p.top), procH: Math.round(p.height), svcBottom: Math.round(s.bottom), ih: innerHeight, iw: innerWidth };
});
async function waitIdle(page, max = 3000) {
  const t0 = Date.now();
  while (Date.now() - t0 < max) { const s = await state(page); if (!s.anim) return s; await sleep(50); }
  return state(page);
}
// Enter Services from the nav and settle.
async function toServices(page) {
  await page.evaluate(() => document.querySelector('a[href="#servicos"]').click());
  await sleep(1600); return waitIdle(page);
}
// Scroll Services to its bottom edge natively in small steps (large gaps defeat the quarantine).
async function toServicesEdge(page, above = 0) {
  await page.evaluate(a => { const s = document.getElementById('servicos').getBoundingClientRect();
    scrollTo({ top: scrollY + s.bottom - innerHeight - a, behavior: 'instant' }); }, above);
  await sleep(300);
  return state(page);
}
// Wheel down with a fixed delta and gap until Process is entered or attempts are exhausted.
async function pushUntilProcess(page, delta, gap, maxEvents) {
  for (let i = 0; i < maxEvents; i++) {
    const s = await state(page);
    if (s.hash === '#processo' || s.anim) return { ok: true, events: i };
    await page.mouse.wheel(0, delta); await sleep(gap);
  }
  await sleep(1200);
  const s = await state(page);
  return { ok: s.hash === '#processo' || s.anim, events: maxEvents };
}
const results = [];
async function run(name, fn) {
  if (filter && !name.includes(filter)) return;
  try { const r = await fn(); results.push({ name, ...r }); console.log((r.pass ? 'PASS ' : 'FAIL ') + name, JSON.stringify(r.info || '')); }
  catch (e) { results.push({ name, pass: false, info: e.message }); console.log('ERR  ' + name, e.message); }
}

(async () => {
  const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : { channel: 'chrome' });
  const sizes = [[1024, 600], [1280, 720], [1440, 900], [1920, 1080], [1920, 1200], [961, 700]];
  for (const [w, h] of sizes) {
    for (const [delta, gap, label, above] of [[40, 250, 'small+spaced at edge', 0], [40, 250, 'small+spaced from 200 above', 200], [54, 300, 'firefox-lines at edge', 0], [100, 120, 'notch from 500 above', 500], [40, 60, 'small+fast from 300 above', 300]]) {
      await run(`${w}x${h} ${label} (${delta}/${gap}ms)`, async () => {
        const { ctx, page } = await open(browser, w, h);
        await toServices(page);
        const edge = await toServicesEdge(page, above);
        await sleep(400);
        const r = await pushUntilProcess(page, delta, gap, 40);
        const end = await waitIdle(page, 3000); await sleep(300);
        const fin = await state(page);
        await ctx.close();
        // Process should be entered and centred (or top-aligned when taller than viewport).
        const centred = fin.procH >= fin.ih ? Math.abs(fin.procTop) <= 2 : Math.abs(fin.procTop - (fin.ih - fin.procH) / 2) <= 2;
        return { pass: r.ok && fin.hash === '#processo' && centred, info: { events: r.events, hash: fin.hash, procTop: fin.procTop, procH: fin.procH, ih: fin.ih, edgeReached: edge.svcBottom - edge.ih } };
      });
    }
  }
  // Resize while the entry is armed at the edge: shrink height, then continue wheeling.
  await run('resize after arriving at edge 1440x800->1440x600', async () => {
    const { ctx, page } = await open(browser, 1440, 800);
    await toServices(page); await toServicesEdge(page, 0); await sleep(400);
    await page.mouse.wheel(0, 40); await sleep(30);
    await page.setViewportSize({ width: 1440, height: 600 });
    await sleep(1500);
    let s = await state(page);
    const r = await pushUntilProcess(page, 40, 250, 14);
    await waitIdle(page); await sleep(300); s = await state(page);
    await ctx.close();
    const centred = s.procH >= s.ih ? Math.abs(s.procTop) <= 2 : Math.abs(s.procTop - (s.ih - s.procH) / 2) <= 2;
    return { pass: r.ok && s.hash === '#processo' && centred, info: s };
  });
  // Resize during the cinematic transition: destination must follow new geometry.
  await run('resize during transition 1440x900->1100x620', async () => {
    const { ctx, page } = await open(browser, 1440, 900);
    await toServices(page); await toServicesEdge(page, 0); await sleep(400);
    for (let i = 0; i < 6; i++) { await page.mouse.wheel(0, 100); await sleep(40); const st = await state(page); if (st.anim) break; }
    await sleep(250);
    await page.setViewportSize({ width: 1100, height: 620 });
    const s = await waitIdle(page, 4000); await sleep(300);
    const f = await state(page);
    await ctx.close();
    const centred = f.procH >= f.ih ? Math.abs(f.procTop) <= 2 : Math.abs(f.procTop - (f.ih - f.procH) / 2) <= 2;
    return { pass: f.hash === '#processo' && centred, info: f };
  });
  // Resize while already inside Process: stays centred and phases still respond.
  await run('resize inside Process 1920x1080->1280x700', async () => {
    const { ctx, page } = await open(browser, 1920, 1080, '#processo');
    await page.evaluate(() => document.querySelector('a[href="#processo"]').click()); await sleep(1800); await waitIdle(page);
    await page.setViewportSize({ width: 1280, height: 700 }); await sleep(600);
    const f = await state(page);
    await ctx.close();
    const centred = f.procH >= f.ih ? Math.abs(f.procTop) <= 2 : Math.abs(f.procTop - (f.ih - f.procH) / 2) <= 2;
    return { pass: f.hash === '#processo' && centred, info: f };
  });
  // Round trip: Process back to Services with the wheel, then forward again.
  await run('round trip 1440x900 Process->Services->Process', async () => {
    const { ctx, page } = await open(browser, 1440, 900);
    await toServices(page); await toServicesEdge(page, 0); await sleep(400);
    let r = await pushUntilProcess(page, 100, 120, 10); await waitIdle(page); await sleep(500);
    // step back through phases to Services
    for (let i = 0; i < 8; i++) { const s = await state(page); if (s.hash === '#servicos') break; await page.mouse.wheel(0, -100); await sleep(80); await page.mouse.wheel(0, -100); await sleep(1300); }
    const back = await waitIdle(page); await sleep(500);
    r = await pushUntilProcess(page, 40, 250, 14); await waitIdle(page); await sleep(300);
    const f = await state(page);
    await ctx.close();
    return { pass: back.hash === '#servicos' && f.hash === '#processo', info: { back: back.hash, final: f.hash } };
  });
  // Crossing the 960/961 breakpoint in Services then wheeling to Process.
  await run('breakpoint 961->960->961 then enter Process', async () => {
    const { ctx, page } = await open(browser, 961, 800);
    await toServices(page);
    await page.setViewportSize({ width: 960, height: 800 }); await sleep(500);
    await page.setViewportSize({ width: 961, height: 800 }); await sleep(500);
    await toServicesEdge(page, 0); await sleep(400);
    const r = await pushUntilProcess(page, 40, 250, 14); await waitIdle(page); await sleep(300);
    const f = await state(page);
    await ctx.close();
    return { pass: r.ok && f.hash === '#processo', info: f };
  });
  await browser.close();
  const failed = results.filter(r => !r.pass).length;
  console.log(`\n${results.length - failed}/${results.length} passed`);
  fs.writeFileSync(path.join(__dirname, 'scroll-results-' + path.basename(file) + '.json'), JSON.stringify(results, null, 2));
})();
