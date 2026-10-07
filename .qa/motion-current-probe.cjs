const { chromium } = require('C:/Users/milto/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');

const fileUrl = 'file:///C:/Users/milto/OneDrive/Desktop/KirMoon/kirmoon_site.html';

(async () => {
  const browser = await chromium.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: true
  });
  try {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 1
    });
    const page = await context.newPage();
    await page.route('**/three.min.js', route => route.fulfill({
      path: 'assets/vendor/three-r128.min.js',
      contentType: 'application/javascript'
    }));
    await page.goto(fileUrl);
    await page.waitForTimeout(250);

    const setup = await page.evaluate(() => {
      document.documentElement.style.scrollBehavior = 'auto';
      const services = document.getElementById('servicos');
      const boundary = services.offsetTop + services.offsetHeight - innerHeight;
      scrollTo(0, boundary - 150);
      return { boundary, serviceHeight: services.offsetHeight, processTop: document.getElementById('processo').offsetTop };
    });
    await page.waitForTimeout(80);

    const samples = [];
    const started = Date.now();
    const sampler = setInterval(async () => {
      samples.push(await page.evaluate(() => ({
        t: performance.now(),
        y: scrollY,
        hash: location.hash,
        pending: document.body.classList.contains('process-entry-pending'),
        transitioning: document.body.classList.contains('scene-transitioning'),
        centered: document.querySelector('main > section.is-centered')?.id || null
      })));
    }, 16);

    await page.mouse.move(720, 700);
    await page.mouse.wheel(0, 200);
    await page.waitForTimeout(520);
    clearInterval(sampler);

    console.log(JSON.stringify({ setup, elapsed: Date.now() - started, samples }, null, 2));
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
