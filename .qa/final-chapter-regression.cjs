const { chromium } = require('C:/Users/milto/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');

(async () => {
  const browser = await chromium.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: true
  });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto('file:///C:/Users/milto/OneDrive/Desktop/KirMoon/kirmoon_site.html');
    await page.waitForTimeout(300);

    const cases = [
      ['#processo', '#processo'],
      ['#compromissos', '#faq'],
      ['#faq', '#faq'],
      ['#contato', '#contato']
    ];
    for (const [section, expected] of cases) {
      await page.evaluate(selector => {
        document.documentElement.style.scrollBehavior = 'auto';
        const element = document.querySelector(selector);
        scrollTo(0, element.offsetTop + element.offsetHeight / 2 - innerHeight / 2);
      }, section);
      await page.waitForTimeout(80);
      const current = await page.locator('.nav a[aria-current="true"]').getAttribute('href');
      if (current !== expected) throw new Error(`${section}: expected ${expected}, received ${current}`);
      const currentCount = await page.locator('.nav a[aria-current="true"]').count();
      if (currentCount !== 1) throw new Error(`${section}: expected one active navigation item, received ${currentCount}`);
      if (section === '#compromissos') await page.screenshot({ path: '.qa/final-chapter-desktop.png' });
    }
    const composition = await page.evaluate(() => {
      const main = getComputedStyle(document.querySelector('#compromissos .commitment-main'));
      const diagnostic = getComputedStyle(document.querySelector('#compromissos .diagnostic-panel'));
      return {
        mainBorder: main.borderTopWidth,
        mainBackground: main.backgroundImage,
        diagnosticBorderTop: diagnostic.borderTopWidth,
        diagnosticBorderLeft: diagnostic.borderLeftWidth
      };
    });
    if (composition.mainBorder !== '0px' || composition.mainBackground !== 'none' || composition.diagnosticBorderLeft !== '1px') {
      throw new Error(`Commitment composition regressed: ${JSON.stringify(composition)}`);
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.evaluate(() => {
      const element = document.querySelector('#compromissos');
      scrollTo(0, element.offsetTop);
    });
    await page.waitForTimeout(600);
    const mobile = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth - innerWidth,
      current: document.querySelector('.nav a[aria-current="true"]')?.getAttribute('href'),
      columns: getComputedStyle(document.querySelector('#compromissos .commitment-diagnostic')).gridTemplateColumns
    }));
    if (mobile.overflow > 1 || mobile.current !== '#faq' || mobile.columns.split(' ').length !== 1) {
      throw new Error(`Mobile final chapter regressed: ${JSON.stringify(mobile)}`);
    }
    await page.screenshot({ path: '.qa/final-chapter-mobile.png', fullPage: false });
    console.log('PASS: navigation identifies Processo, Dúvidas and Contato throughout the final chapter.');
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
