const { chromium } = require('C:/Users/milto/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');

(async () => {
  const browser = await chromium.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: true
  });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto('file:///C:/Users/milto/OneDrive/Desktop/KirMoon/kirmoon_site.html');
    const boundaries = await page.evaluate(() => ({
      processTop: getComputedStyle(document.querySelector('#processo')).borderTopWidth,
      nextTop: getComputedStyle(document.querySelector('#processo + .section')).borderTopWidth,
      chapterOutline: (() => {
        const process = document.querySelector('#processo');
        process.focus({ preventScroll: true });
        const style = getComputedStyle(process);
        return `${style.outlineWidth} ${style.outlineStyle}`;
      })()
    }));
    if (boundaries.processTop !== '0px' || boundaries.nextTop !== '0px' || !boundaries.chapterOutline.endsWith(' none')) {
      throw new Error(`Visible process boundary: ${JSON.stringify(boundaries)}`);
    }
    console.log('PASS: process entry and exit have no separator borders.');
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
