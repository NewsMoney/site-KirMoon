const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const assert = require('node:assert/strict');
const {chromium} = require('C:/Users/milto/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');

const root = path.resolve(__dirname, '..');
const before = 'C:/Users/milto/Downloads/index (2).html';
const chrome = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const width = Number(process.env.KM_QA_WIDTH || 390);
const probe = `<script id="qa-mobile-probe">
(() => {
  const errors = [];
  let initialScripts = [];
  addEventListener('error', event => errors.push(event.message || 'resource error'), true);
  addEventListener('unhandledrejection', event => errors.push(String(event.reason)));
  const jump = id => document.getElementById(id)?.scrollIntoView({behavior:'instant'});
  addEventListener('DOMContentLoaded', () => {
    setTimeout(() => { initialScripts = [...document.querySelectorAll('script[src]')].map(script => script.getAttribute('src')); }, 500);
    setTimeout(() => jump('apps'), 600);
    setTimeout(() => document.getElementById('svc-apps-tab-web')?.click(), 1600);
    setTimeout(() => jump('processo'), 2100);
    setTimeout(() => jump('compromissos'), 3300);
    setTimeout(() => document.querySelector('.carousel-next')?.click(), 4300);
    setTimeout(() => jump('faq'), 5200);
    setTimeout(() => jump('contato'), 6200);
    setTimeout(() => {
      const report = {
        viewportWidth: innerWidth,
        scrollWidth: document.documentElement.scrollWidth,
        moonImageWidth: document.getElementById('moonsrc')?.naturalWidth,
        staticMoonLoaded: performance.getEntriesByType('resource').some(resource => resource.name.includes('moon-hero-static-20260924.webp')),
        phasesDrawn: document.querySelectorAll('canvas[data-phase].drawn').length,
        serviceTabSelected: document.getElementById('svc-apps-tab-web')?.getAttribute('aria-selected'),
        carouselIndex: document.querySelector('[data-cmt-carousel]')?.cmtState?.().index ?? null,
        initialScripts,
        loadedScripts: [...document.querySelectorAll('script[src]')].map(script => script.getAttribute('src')),
        planets: [...document.querySelectorAll('.planet-canvas')].map(canvas => ({
          type: canvas.dataset.planet,
          renderer: canvas.parentElement?.dataset.planetRenderer || null,
          width: canvas.width,
          height: canvas.height
        })),
        errors
      };
      const pre = document.createElement('pre');
      pre.id = 'qa-state';
      pre.textContent = JSON.stringify(report);
      document.body.appendChild(pre);
    }, 7800);
  }, {once:true});
})();
</script>`;

const mime = file => ({'.html':'text/html; charset=utf-8','.js':'application/javascript',
  '.avif':'image/avif','.webp':'image/webp','.jpg':'image/jpeg','.png':'image/png',
  '.ico':'image/x-icon','.svg':'image/svg+xml'}[path.extname(file)] || 'application/octet-stream');

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://127.0.0.1');
  let file;
  if (url.pathname === '/before') file = before;
  else if (url.pathname === '/after') file = path.join(root, 'index.html');
  else {
    const relative = decodeURIComponent(url.pathname).replace(/^\/+/, '');
    file = path.resolve(root, relative);
    if (!file.startsWith(root + path.sep)) { res.writeHead(403); res.end(); return; }
  }
  if (!fs.existsSync(file)) { res.writeHead(404); res.end(); return; }
  res.setHeader('Content-Type', mime(file));
  if (file.endsWith('.html')) res.end(fs.readFileSync(file, 'utf8').replace('</head>', probe + '</head>'));
  else res.end(fs.readFileSync(file));
});

async function browse(browser, port, route) {
  const context = await browser.newContext({viewport:{width,height:844},deviceScaleFactor:1});
  try {
    const page = await context.newPage();
    await page.goto(`http://127.0.0.1:${port}/${route}`, {waitUntil:'domcontentloaded'});
    await page.locator('#qa-state').waitFor({state:'attached',timeout:15000});
    return JSON.parse(await page.locator('#qa-state').textContent());
  } finally { await context.close(); }
}

server.listen(0, '127.0.0.1', async () => {
  let browser;
  try {
    const port = server.address().port;
    browser = await chromium.launch({executablePath:chrome,headless:true});
    const baseline = await browse(browser, port, 'before');
    const fixed = await browse(browser, port, 'after');
    console.log(JSON.stringify({baseline, fixed}, null, 2));
    assert.equal(fixed.viewportWidth, width);
    assert.equal(fixed.phasesDrawn, 8);
    assert.equal(fixed.staticMoonLoaded, true);
    assert(fixed.scrollWidth <= fixed.viewportWidth);
    assert(fixed.planets.every(planet => planet.renderer && planet.width > 0));
    assert.equal(fixed.serviceTabSelected, 'true');
    assert.equal(fixed.carouselIndex, 1);
    assert(!fixed.initialScripts.includes('assets/service-demos-20260924.js'));
    assert(!fixed.initialScripts.includes('assets/commitments-carousel-20260924.js'));
    assert(fixed.loadedScripts.includes('assets/service-demos-20260924.js'));
    assert(fixed.loadedScripts.includes('assets/commitments-carousel-20260924.js'));
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  } finally { if (browser) await browser.close(); server.close(); }
});
