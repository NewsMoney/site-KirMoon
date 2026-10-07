const { chromium } = require('C:/Users/milto/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');

(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
    await page.goto('file:///C:/Users/milto/OneDrive/Desktop/KirMoon/kirmoon_site.html');
    await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; });

    for (const section of ['compromissos', 'faq', 'contato']) {
      await page.evaluate(id => {
        const element = document.getElementById(id);
        scrollTo(0, element.offsetTop + element.offsetHeight / 2 - innerHeight / 2);
      }, section);
      await page.waitForTimeout(700);
      await page.screenshot({ path: `.qa/identity-${section}.png` });
    }

    const closedIcon = await page.evaluate(() => ({
      before: getComputedStyle(document.querySelector('#faq-q3 .faq-icon'),'::before').transform,
      after: getComputedStyle(document.querySelector('#faq-q3 .faq-icon'),'::after').transform
    }));
    await page.locator('#faq-q3').click();
    await page.waitForTimeout(180);
    await page.screenshot({ path: '.qa/identity-faq-open.png' });
    const faq = await page.evaluate(() => ({
      phase: document.querySelector('#faq .faq-grid').dataset.activePhase,
      open: document.querySelectorAll('#faq .faq-item.is-open').length,
      expanded: document.getElementById('faq-q3').getAttribute('aria-expanded'),
      hidden: document.getElementById('faq-a3').getAttribute('aria-hidden'),
      icon: {
        before: getComputedStyle(document.querySelector('#faq-q3 .faq-icon'),'::before').transform,
        after: getComputedStyle(document.querySelector('#faq-q3 .faq-icon'),'::after').transform
      }
    }));
    if (faq.phase !== '3' || faq.open !== 1 || faq.expanded !== 'true' || faq.hidden !== 'false' ||
        faq.icon.before === closedIcon.before || faq.icon.after === closedIcon.after || faq.icon.before === faq.icon.after) {
      throw new Error(`FAQ phase interaction regressed: ${JSON.stringify(faq)}`);
    }

    const layout = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth - innerWidth,
      commitmentMoon: getComputedStyle(document.querySelector('.commitment-moon')).display,
      faqMoon: getComputedStyle(document.querySelector('.faq-celestial')).display,
      contactMoon: getComputedStyle(document.querySelector('.contact-moon')).display,
      planetCanvases: [...document.querySelectorAll('.planet-canvas')].map(el => ({
        type: el.dataset.planet,
        opacity: getComputedStyle(el).opacity,
        ready: el.parentElement.classList.contains('is-3d')
      })),
      hasMicrocopy: /Saturno · estrutura|Mercúrio · resposta|Júpiter ·|Terra · canal|Contexto antes da solução|Ponto de partida/.test(document.body.innerText),
      firstField: getComputedStyle(document.querySelector('label[for="f-nome"]'), '::before').content
    }));
    if (layout.overflow > 1 || [layout.commitmentMoon, layout.faqMoon, layout.contactMoon].includes('none') ||
        layout.planetCanvases.length !== 3 || layout.planetCanvases.some(p => !p.ready || +p.opacity < .9) ||
        layout.hasMicrocopy || layout.firstField === 'none') {
      throw new Error(`Final chapter identity regressed: ${JSON.stringify(layout)}`);
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(500);
    for (const section of ['compromissos', 'faq', 'contato']) {
      await page.evaluate(id => scrollTo(0, document.getElementById(id).offsetTop), section);
      await page.waitForTimeout(500);
      await page.screenshot({ path: `.qa/identity-${section}-mobile.png` });
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      if (overflow > 1) throw new Error(`${section} mobile overflow: ${overflow}px`);
    }
    console.log('PASS: Saturn, Jupiter and Earth identities, responsive width and interactive planetary FAQ.');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
