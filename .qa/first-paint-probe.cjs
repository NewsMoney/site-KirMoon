const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const zlib = require('node:zlib');
const { chromium } = require('C:/Users/milto/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');

const root = path.resolve(__dirname, '..');
const htmlFile = process.argv[2] ? path.resolve(process.argv[2]) : path.join(root, 'index.html');
const device = process.argv[3] === 'desktop' ? 'desktop' : 'mobile';
const width = Number(process.argv[4]) || (device === 'mobile' ? 412 : 1365);
const height = Number(process.argv[5]) || (device === 'mobile' ? 915 : 768);
const mime = file => ({'.html':'text/html; charset=utf-8','.js':'application/javascript','.avif':'image/avif','.webp':'image/webp','.jpg':'image/jpeg','.png':'image/png','.ico':'image/x-icon','.svg':'image/svg+xml'}[path.extname(file)] || 'application/octet-stream');

const server = http.createServer((request, response) => {
  const pathname = new URL(request.url, 'http://127.0.0.1').pathname;
  const file = pathname === '/' ? htmlFile : path.resolve(root, pathname.slice(1));
  if (pathname !== '/' && !file.startsWith(root + path.sep)) { response.writeHead(403); response.end(); return; }
  if (!fs.existsSync(file)) { response.writeHead(404); response.end(); return; }
  const content = fs.readFileSync(file);
  response.setHeader('Content-Type', mime(file));
  response.setHeader('Cache-Control', 'no-store');
  if (file.endsWith('.html')) {
    response.setHeader('Content-Encoding', 'gzip');
    response.end(zlib.gzipSync(content));
  } else response.end(content);
});

server.listen(0, '127.0.0.1', async () => {
  let browser;
  try {
    browser = await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
    const context = await browser.newContext({
      viewport:{width,height},
      deviceScaleFactor:device === 'mobile' ? 2 : 1,
      isMobile:device === 'mobile',
      hasTouch:device === 'mobile'
    });
    const page = await context.newPage();
    await page.addInitScript(() => {
      window.__qaPerf = {paints:[],lcp:[],shifts:[],longTasks:[],skelDone:null};
      addEventListener('DOMContentLoaded', () => {
        const skel = document.getElementById('moon-skel');
        if (!skel) return;
        if (skel.classList.contains('done')) { window.__qaPerf.skelDone = Math.round(performance.now()); return; }
        new MutationObserver(() => {
          if (skel.classList.contains('done') && window.__qaPerf.skelDone === null) window.__qaPerf.skelDone = Math.round(performance.now());
        }).observe(skel,{attributes:true,attributeFilter:['class']});
      },{once:true});
      for (const [type,key] of [['paint','paints'],['largest-contentful-paint','lcp'],['layout-shift','shifts'],['longtask','longTasks']]) {
        try { new PerformanceObserver(list => {
          for (const e of list.getEntries()) window.__qaPerf[key].push({
            start:Math.round(e.startTime),duration:Math.round(e.duration || 0),value:e.value || 0,
            element:e.element?.id || e.element?.className || null,hadRecentInput:e.hadRecentInput || false
          });
        }).observe({type,buffered:true}); } catch {}
      }
    });
    const cdp = await context.newCDPSession(page);
    await cdp.send('Network.enable');
    await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:150,downloadThroughput:1.6*1024*1024/8,uploadThroughput:750*1024/8});
    await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
    await page.goto(`http://127.0.0.1:${server.address().port}/`,{waitUntil:'domcontentloaded'});
    await page.waitForTimeout(6500);
    const result = await page.evaluate(() => ({
      perf:window.__qaPerf,
      nav:performance.getEntriesByType('navigation').map(e=>({responseEnd:Math.round(e.responseEnd),domContentLoaded:Math.round(e.domContentLoadedEventEnd),load:Math.round(e.loadEventEnd),transferSize:e.transferSize})),
      resources:performance.getEntriesByType('resource').filter(e=>/moon|fonts\.google/.test(e.name)).map(e=>({name:e.name.split('/').pop(),start:Math.round(e.startTime),end:Math.round(e.responseEnd),transfer:e.transferSize})),
      moonRect:(()=>{const r=document.getElementById('moon-fallback').getBoundingClientRect();return {x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height)}})(),
      heroRect:(()=>{const r=document.getElementById('inicio').getBoundingClientRect();return {w:Math.round(r.width),h:Math.round(r.height)}})(),
      viewportWidth:innerWidth,scrollWidth:document.documentElement.scrollWidth
    }));
    if (process.argv[6]) await page.screenshot({path:path.resolve(process.argv[6])});
    console.log(JSON.stringify({html:path.basename(htmlFile),device,...result},null,2));
    await context.close();
  } catch (error) { console.error(error); process.exitCode = 1; }
  finally { if (browser) await browser.close(); server.close(); }
});
