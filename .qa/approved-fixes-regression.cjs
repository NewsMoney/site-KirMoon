const assert = require('node:assert/strict');
const { chromium } = require('C:/Users/milto/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');

(async () => {
  const browser = await chromium.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: true
  });
  const errors = [];
  try {
    const context = await browser.newContext({
      viewport: { width: 1285, height: 912 },
      deviceScaleFactor: 1
    });
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/three.min.js', route => route.fulfill({
      path: 'assets/vendor/three-r128.min.js',
      contentType: 'application/javascript'
    }));
    await page.goto('file:///C:/Users/milto/OneDrive/Desktop/KirMoon/kirmoon_site.html');
    await page.waitForFunction(() => document.querySelectorAll('.is-3d').length === 3);

    const mission = await page.evaluate(() => ({
      exists: !!document.getElementById('servicos'),
      links: [...document.querySelectorAll('#servicos [data-mission-index]')].map(link => link.getAttribute('href')),
      precedesApps: !!document.querySelector('#servicos + #apps')
    }));
    assert(mission.exists && mission.precedesApps, 'Services mission must precede the three offers');
    assert.deepEqual(mission.links, ['#apps', '#sites', '#ti']);

    for (const id of ['compromissos', 'faq', 'contato']) {
      await page.evaluate(sectionId => {
        document.documentElement.style.scrollBehavior = 'auto';
        const section = document.getElementById(sectionId);
        scrollTo(0, section.offsetTop + section.offsetHeight / 2 - innerHeight / 2);
      }, id);
      await page.waitForTimeout(800);
      const metrics = await page.locator(`#${id} .planet-canvas`).evaluate(canvas => {
        const rect = canvas.getBoundingClientRect();
        return {
          left: rect.left,
          top: rect.top,
          right: rect.right,
          bottom: rect.bottom,
          viewportWidth: innerWidth,
          viewportHeight: innerHeight,
          backingWidth: canvas.width,
          cssWidth: rect.width,
          dpr: devicePixelRatio
        };
      });
      assert(metrics.left >= -1 && metrics.top >= -1, `${id} is clipped at top/left: ${JSON.stringify(metrics)}`);
      assert(metrics.right <= metrics.viewportWidth + 1 && metrics.bottom <= metrics.viewportHeight + 1,
        `${id} is clipped at bottom/right: ${JSON.stringify(metrics)}`);
      assert(metrics.backingWidth >= Math.round(metrics.cssWidth * .9),
        `${id} canvas backing store is smaller than its visible frame: ${JSON.stringify(metrics)}`);
    }

    const finalArtifacts = await page.evaluate(() => {
      const faqPlanet = document.querySelector('#faq .faq-celestial');
      const faqGrid = document.querySelector('#faq .faq-grid');
      const earth = document.querySelector('#contato .contact-moon');
      const earthCanvas = earth.querySelector('canvas').getBoundingClientRect();
      const form = document.querySelector('#contato .briefing-form').getBoundingClientRect();
      return {
        faqAdornmentOpacity: getComputedStyle(faqPlanet, '::after').opacity,
        faqNumberDisplay: getComputedStyle(faqGrid, '::after').display,
        earthAdornmentOpacity: getComputedStyle(earth, '::after').opacity,
        earthClearOfForm: earthCanvas.right <= form.left + 1
      };
    });
    assert.equal(finalArtifacts.faqAdornmentOpacity, '0');
    assert.equal(finalArtifacts.faqNumberDisplay, 'none');
    assert.equal(finalArtifacts.earthAdornmentOpacity, '0');
    assert.equal(finalArtifacts.earthClearOfForm, true);

    await page.evaluate(() => scrollTo(0, 0));
    await page.waitForTimeout(250);
    const heroBrand = await page.evaluate(() => {
      const brand = document.getElementById('floating-brand');
      const matrix = new DOMMatrixReadOnly(getComputedStyle(brand).transform);
      return { scaleX: matrix.a, scaleY: matrix.d, fontSize: parseFloat(getComputedStyle(brand.querySelector('.wm')).fontSize) };
    });
    assert.equal(heroBrand.fontSize, 21, `Hero brand base typography changed: ${JSON.stringify(heroBrand)}`);
    assert(Number.isFinite(heroBrand.scaleX) && Number.isFinite(heroBrand.scaleY),
      `Hero brand transform is invalid: ${JSON.stringify(heroBrand)}`);

    await page.evaluate(() => {
      const section = document.getElementById('processo');
      scrollTo(0, section.offsetTop + section.offsetHeight / 2 - innerHeight / 2);
    });
    await page.waitForTimeout(350);
    await page.keyboard.press('PageDown');
    await page.waitForTimeout(1050);
    const processState = await page.evaluate(() => ({
      active: [...document.querySelectorAll('[data-process-step]')].findIndex(step => step.classList.contains('is-active')),
      centered: Math.abs(document.getElementById('processo').getBoundingClientRect().top) < innerHeight
    }));
    assert.deepEqual(processState, { active: 1, centered: true }, 'PageDown must advance exactly one process phase');

    const serviceScroll = await page.evaluate(() => {
      document.documentElement.style.scrollBehavior = 'auto';
      scrollTo(0, document.getElementById('apps').offsetTop + 24);
      return { before: scrollY, appsTop: document.getElementById('apps').offsetTop };
    });
    await page.waitForTimeout(250);
    await page.keyboard.press('PageDown');
    await page.waitForTimeout(250);
    const afterFirstPageDown = await page.evaluate(() => scrollY);
    assert(afterFirstPageDown > serviceScroll.before, 'PageDown must scroll naturally inside Services');
    const pageHeight = await page.evaluate(() => document.documentElement.scrollHeight);
    assert(afterFirstPageDown < pageHeight, 'PageDown must stay within the document');
    await page.keyboard.press('PageUp');
    await page.waitForTimeout(250);
    const afterPageUp = await page.evaluate(() => scrollY);
    assert(afterPageUp < afterFirstPageDown, 'PageUp must reverse native Services scrolling');

    await page.evaluate(() => scrollTo(0, document.getElementById('contato').offsetTop));
    await page.waitForTimeout(350);
    const fabWidth = await page.locator('#fab').evaluate(el => el.getBoundingClientRect().width);
    assert(fabWidth <= 60, `WhatsApp FAB still overlaps the contact CTA at ${fabWidth}px`);

    assert.deepEqual(errors, []);
    console.log('PASS: approved visual, navigation, mission and branding regressions.');
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
