const { chromium } = require('C:/Users/milto/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');

const fileUrl = 'file:///C:/Users/milto/OneDrive/Desktop/KirMoon/kirmoon_site.html';

(async () => {
  const browser = await chromium.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: true
  });
  try {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true
    });
    const page = await context.newPage();
    await page.addInitScript(() => {
      window.__motionProbe = { requested: 0, executed: 0 };
      const nativeRaf = window.requestAnimationFrame.bind(window);
      window.requestAnimationFrame = callback => {
        window.__motionProbe.requested += 1;
        return nativeRaf(time => {
          window.__motionProbe.executed += 1;
          callback(time);
        });
      };
    });
    await page.route('**/three.min.js', route => route.fulfill({
      path: 'assets/vendor/three-r128.min.js',
      contentType: 'application/javascript'
    }));
    await page.goto(fileUrl);
    await page.waitForTimeout(350);

    const baseline = await page.evaluate(() => {
      const animated = [...document.querySelectorAll('*')].map(el => {
        const style = getComputedStyle(el);
        return { el, style };
      }).filter(({ style }) => style.animationName !== 'none' && style.animationPlayState !== 'paused')
        .map(({ el, style }) => ({
          target: el.id ? `#${el.id}` : `${el.tagName.toLowerCase()}.${[...el.classList].join('.')}`,
          name: style.animationName,
          duration: style.animationDuration,
          iterations: style.animationIterationCount
        }));
      return {
        scrollHeight: document.documentElement.scrollHeight,
        canvases: [...document.querySelectorAll('canvas')].map(canvas => ({
          id: canvas.id,
          width: canvas.width,
          height: canvas.height,
          visible: !!(canvas.offsetWidth || canvas.offsetHeight)
        })),
        animated,
        raf: { ...window.__motionProbe }
      };
    });

    const motion = await page.evaluate(async () => {
      const gaps = [];
      const positions = [];
      const startY = scrollY;
      const endY = document.documentElement.scrollHeight - innerHeight;
      const duration = 4200;
      const start = performance.now();
      let previous = start;
      await new Promise(resolve => {
        const step = now => {
          gaps.push(now - previous);
          previous = now;
          const progress = Math.min(1, (now - start) / duration);
          const eased = progress * progress * (3 - 2 * progress);
          scrollTo(0, startY + (endY - startY) * eased);
          positions.push(scrollY);
          if (progress < 1) requestAnimationFrame(step);
          else resolve();
        };
        requestAnimationFrame(step);
      });
      gaps.sort((a, b) => a - b);
      const percentile = p => gaps[Math.min(gaps.length - 1, Math.floor(gaps.length * p))];
      return {
        frames: gaps.length,
        meanGap: gaps.reduce((sum, value) => sum + value, 0) / gaps.length,
        p95Gap: percentile(.95),
        maxGap: gaps[gaps.length - 1],
        nonMonotonic: positions.some((value, i) => i && value < positions[i - 1]),
        endY: scrollY,
        raf: { ...window.__motionProbe }
      };
    });

    console.log(JSON.stringify({ baseline, motion }, null, 2));
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
