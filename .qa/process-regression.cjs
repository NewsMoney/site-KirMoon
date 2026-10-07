const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { chromium } = require('C:/Users/milto/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const html = fs.readFileSync('kirmoon_site.html', 'utf8');

(async () => {
  const failures = [];
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  try {
    const page = await browser.newPage();
    const styles = html.match(/<style[\s\S]*?<\/style>/g).join('\n');
    const sequence = html.slice(html.indexOf('<div class="process-sequence"'), html.indexOf('<div class="process-active-shade"')) + '</div>';
    for (const width of [1440, 1100, 390]) {
      await page.setViewportSize({ width, height: 900 });
      await page.setContent(styles + sequence);
      const errors = await page.evaluate(() => {
        const seq = document.querySelector('.process-sequence');
        seq.style.cssText += ';position:absolute;top:30px;left:20px;';
        const cards = [...seq.querySelectorAll('.process-phase')];
        const shift = parseFloat(getComputedStyle(seq).getPropertyValue('--diag-shift'));
        const errors = [];
        if (innerWidth > 960) {
          for (let i = 0; i < cards.length - 1; i++) {
            const r = cards[i].getBoundingClientRect();
            for (const ratio of [.15, .85]) {
              const boundary = r.right - shift * ratio;
              for (const offset of [-4, 4]) {
                const hit = document.elementFromPoint(boundary + offset, r.top + r.height * ratio)?.closest('[data-process-step]');
                const expected = offset < 0 ? i : i + 1;
                if (Number(hit?.dataset.processStep) !== expected) errors.push(`border ${i}, height ${ratio}, side ${offset}: expected ${expected}, got ${hit?.dataset.processStep}`);
              }
            }
          }
        } else {
          const r = cards[0].getBoundingClientRect();
          const hit = document.elementFromPoint(r.left + 8, r.bottom - 8)?.closest('[data-process-step]');
          if (hit !== cards[0]) errors.push('mobile card corner');
        }
        return errors;
      });
      failures.push(...errors.map(e => `${width}px: ${e}`));
    }
  } finally { await browser.close(); }

  const setter = html.slice(html.indexOf('  function setProcessStep('), html.indexOf('  function updateProcessStory('));
  for (const transitioning of [false, true]) {
    let calls = 0;
    const context = {
      processSteps: Array.from({length:4}, () => ({ classList:{toggle(){}}, setAttribute(){} })),
      processActiveStep:3, processPhaseTransitioning:transitioning, processData:[],
      reduce:false, setProcessMoon3DPhase(){ calls++; }, processEl:null,
      requestAnimationFrame(){}, setTimeout(){}, updateProcessShade(){},
      processMobilePrev:null, processMobileNext:null, desktop:{matches:true},
      endProcessPhaseTransition(){}, beginProcessPhaseTransition(){}
    };
    vm.createContext(context);
    vm.runInContext(setter + '; setProcessStep(3, {fromUser:true}); setProcessStep(3, {fromUser:true});', context);
    if (calls !== 0) failures.push(`repeated active clicks (transitioning=${transitioning}) updated moon ${calls} times`);
  }
  assert.deepEqual(failures, []);
  console.log('PASS: diagonal hit areas at 1440/1100px, mobile corner, repeated clicks while idle/animating.');
})().catch(error => { console.error(error); process.exitCode = 1; });
