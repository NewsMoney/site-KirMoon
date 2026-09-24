const assert = require('node:assert/strict');
const { chromium } = require('C:/Users/milto/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');

const fileUrl = 'file:///C:/Users/milto/OneDrive/Desktop/KirMoon/kirmoon_site.html';
const chrome = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

async function loadPage(browser, options) {
  const context = await browser.newContext(options);
  const page = await context.newPage();
  await page.route('**/three.min.js', route => route.fulfill({
    path: 'assets/vendor/three-r128.min.js',
    contentType: 'application/javascript'
  }));
  await page.goto(fileUrl);
  await page.waitForTimeout(250);
  return { context, page };
}

(async () => {
  const browser = await chromium.launch({ executablePath: chrome, headless: true });
  try {
    const desktop = await loadPage(browser, {
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 1
    });
    const boundary = await desktop.page.evaluate(() => {
      document.documentElement.style.scrollBehavior = 'auto';
      const services = document.getElementById('servicos');
      const value = services.offsetTop + services.offsetHeight - innerHeight;
      scrollTo(0, value - 150);
      return value;
    });
    await desktop.page.waitForTimeout(80);
    await desktop.page.mouse.move(720, 700);
    await desktop.page.mouse.wheel(0, 200);
    await desktop.page.waitForTimeout(120);
    const entry = await desktop.page.evaluate(() => ({
      y: scrollY,
      pending: document.body.classList.contains('process-entry-pending'),
      transitioning: document.body.classList.contains('scene-transitioning')
    }));
    assert(
      entry.pending || entry.transitioning || entry.y > boundary + 1,
      `First decisive wheel gesture stalled at Services boundary: ${JSON.stringify({ boundary, entry })}`
    );
    await desktop.context.close();

    const mobile = await loadPage(browser, {
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true
    });
    const canvases = await mobile.page.evaluate(() => ({
      hero: (() => {
        const canvas = document.getElementById('moon-canvas');
        return canvas.width * canvas.height;
      })(),
      planets: [...document.querySelectorAll('.planet-canvas[data-planet]')]
        .map(canvas => canvas.width * canvas.height)
    }));
    assert(canvases.hero <= 800_000, `Mobile hero canvas exceeds pixel budget: ${canvases.hero}`);
    assert(canvases.planets.every(pixels => pixels <= 220_000),
      `Mobile planet canvas exceeds pixel budget: ${JSON.stringify(canvases.planets)}`);
    await mobile.context.close();

    console.log('PASS: first desktop Services→Process gesture transitions; mobile canvas budgets stay bounded.');
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
