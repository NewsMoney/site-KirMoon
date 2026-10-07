// Endereço limpo: nenhuma navegação deixa #secao na URL. Usage: node url-test.cjs <file.html>
const { chromium } = require(require('path').join(process.env.NODE_PATH || '', 'playwright'));
const fs = require('fs'), path = require('path');
const file = path.resolve(process.argv[2]);
const THREE = fs.readFileSync(path.join(__dirname, 'node_modules/three/build/three.min.js'));
const sleep = ms => new Promise(r => setTimeout(r, ms));
let pass = 0, total = 0;
const t = (name, ok, info) => { total++; if (ok) pass++; console.log(`${ok ? 'PASS' : 'FAIL'} ${name} ${JSON.stringify(info)}`); };
async function open(browser, w, h, suffix = '', touch = false) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, hasTouch: touch, isMobile: touch });
  const page = await ctx.newPage();
  const errors = [], warnings = [];
  await page.route('**/three.min.js', r => r.fulfill({ body: THREE, contentType: 'text/javascript' }));
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (/Throttling|SecurityError/i.test(m.text())) warnings.push(m.text()); });
  await page.goto('file://' + file + suffix); await sleep(900); await page.mouse.move(w / 2, h / 2);
  return { ctx, page, errors, warnings };
}
const st = (page, id) => page.evaluate(id => {
  const el = id && document.getElementById(id);
  return { hash: location.hash, href: location.href.split('/').pop(), hist: history.length, km: document.documentElement.dataset.kmHash || '',
    top: el ? Math.round(el.getBoundingClientRect().top) : null, y: Math.round(scrollY) };
}, id);

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined });
  // Desktop: menu, nave do hero, rodas, setas, CTA do carrossel, rodapé.
  {
    const { ctx, page, errors, warnings } = await open(browser, 1440, 900);
    const steps = [];
    await page.click('.scroll-rocket'); await sleep(1800); steps.push(['nave → serviços', await st(page, 'servicos')]);
    for (let i = 0; i < 12; i++) { await page.keyboard.press('ArrowDown'); await sleep(1300); }
    steps.push(['setas até o fim', await st(page)]);
    await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' })); await sleep(900);
    await page.click('#nav a[href="#processo"]'); await sleep(2200); steps.push(['menu → processo', await st(page, 'processo')]);
    await page.click('#nav a[href="#contato"]'); await sleep(2200); steps.push(['menu → contato', await st(page, 'contato')]);
    await page.evaluate(() => document.getElementById('compromissos').scrollIntoView({ behavior: 'instant' })); await sleep(900);
    await page.click('.cmt-slide.is-active .cmt-cta, #compromissos .cmt-cta >> visible=true'); await sleep(1600); steps.push(['CTA do carrossel', await st(page, 'contato')]);
    await page.click('footer a[href="#servicos"]'); await sleep(2200); steps.push(['rodapé → serviços', await st(page, 'servicos')]);
    for (let i = 0; i < 30; i++) { await page.mouse.wheel(0, 100); await sleep(140); }
    await sleep(1500); steps.push(['roda do mouse', await st(page)]);
    await page.click('footer a[href="#"]', { force: true }).catch(() => {}); await sleep(300); steps.push(['link sem destino', await st(page)]);
    const clean = steps.every(([, s]) => s.hash === '' && !s.href.includes('#'));
    t('desktop: URL sem # em todas as navegações', clean, steps.map(([n, s]) => `${n}: ${s.href} (${s.km})`));
    t('desktop: seções certas', Math.abs(steps[0][1].top) < 120 && Math.abs(steps[2][1].top) < 120 && Math.abs(steps[5][1].top) < 120, steps.map(([n, s]) => `${n}: top ${s.top}`));
    t('desktop: histórico não cresce', steps.every(([, s]) => s.hist === steps[0][1].hist), steps.map(([, s]) => s.hist));
    t('desktop: sem erros nem throttling', !errors.length && !warnings.length, { errors, warnings });
    await ctx.close();
  }
  // Celular: menu e links diretos (#faq e #contato caem no scroll nativo).
  {
    const { ctx, page, errors, warnings } = await open(browser, 390, 844, '', true);
    const steps = [];
    for (const id of ['processo', 'faq', 'contato', 'servicos']) {
      await page.click('#burger'); await sleep(500);
      await page.click(`#nav a[href="#${id}"]`); await sleep(1400); steps.push([id, await st(page, id)]);
    }
    await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' })); await sleep(1800);
    await page.click('.scroll-rocket'); await sleep(1400); steps.push(['nave → serviços', await st(page, 'servicos')]);
    t('celular: URL sem #', steps.every(([, s]) => s.hash === ''), steps.map(([n, s]) => `${n}: ${s.href}`));
    t('celular: seções certas', steps.every(([, s]) => s.top !== null && Math.abs(s.top) < 140), steps.map(([n, s]) => `${n}: top ${s.top}`));
    t('celular: sem erros', !errors.length && !warnings.length, { errors, warnings });
    await ctx.close();
  }
  // Link antigo com # ainda leva à seção, e o # some depois do carregamento.
  for (const [w, h] of [[1440, 900], [390, 844]]) {
    const { ctx, page, errors } = await open(browser, w, h, '#contato', w < 900);
    await sleep(1200);
    const s = await st(page, 'contato');
    t(`link antigo #contato em ${w}px`, s.hash === '' && Math.abs(s.top) < 160 && !errors.length, s);
    await ctx.close();
  }
  await browser.close();
  console.log(`\n${pass}/${total} passed`);
})();
