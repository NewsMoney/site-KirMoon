const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const {chromium} = require('C:/Users/milto/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');

const root = path.resolve(__dirname, '..');
const mode = process.argv[2] || 'candidate';
const device = process.argv[3] === 'mobile' ? 'mobile' : 'desktop';
const interact = process.argv.includes('interact');
if (!['baseline', 'candidate'].includes(mode)) throw new Error('Use baseline or candidate');
const html = mode === 'baseline'
  ? path.join(__dirname, 'index-before-desktop-deferral.html')
  : path.join(root, 'index.html');
const mime = file => ({'.html':'text/html; charset=utf-8','.js':'application/javascript',
  '.avif':'image/avif','.webp':'image/webp','.jpg':'image/jpeg','.png':'image/png',
  '.ico':'image/x-icon','.svg':'image/svg+xml'}[path.extname(file)] || 'application/octet-stream');
const server = http.createServer((request, response) => {
  const pathname = new URL(request.url, 'http://127.0.0.1').pathname;
  const file = pathname === '/' ? html : path.resolve(root, pathname.slice(1));
  if (pathname !== '/' && !file.startsWith(root + path.sep)) { response.writeHead(403); response.end(); return; }
  if (!fs.existsSync(file)) { response.writeHead(404); response.end(); return; }
  response.setHeader('Content-Type', mime(file));
  response.end(fs.readFileSync(file));
});

server.listen(0, '127.0.0.1', async () => {
  let browser;
  try {
    browser = await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
    const page = await browser.newPage({viewport:device === 'mobile' ? {width:390,height:844} : {width:1365,height:768},deviceScaleFactor:1});
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(() => {
      window.__qaLongTasks = [];
      new PerformanceObserver(list => {
        for (const task of list.getEntries()) window.__qaLongTasks.push({start:task.startTime,duration:task.duration});
      }).observe({type:'longtask',buffered:true});
    });
    const session = await page.context().newCDPSession(page);
    await session.send('Profiler.enable');
    await session.send('Profiler.start');
    await page.goto(`http://127.0.0.1:${server.address().port}/`, {waitUntil:'domcontentloaded'});
    if (interact) {
      await page.locator('#moon-canvas').click({position:device === 'mobile' ? {x:195,y:210} : {x:1024,y:369}});
      await page.waitForFunction(() => document.getElementById('moon-canvas')?.classList.contains('on'), undefined, {timeout:15000});
    }
    await page.waitForTimeout(10000);
    const metrics = await page.evaluate(() => ({
      longTasks: window.__qaLongTasks,
      htmlWidth: document.documentElement.scrollWidth,
      viewportWidth: innerWidth,
      moonImageWidth: document.getElementById('moonsrc')?.naturalWidth,
      moonImageDisplay: getComputedStyle(document.getElementById('moonsrc')).display,
      canvas3D: document.getElementById('moon-canvas')?.classList.contains('on'),
      threeLoaded: !!window.THREE,
      resources: performance.getEntriesByType('resource').filter(x => /three-r128|moon\.(avif|webp|jpg)/.test(x.name)).map(x => ({name:x.name.split('/').pop(),bytes:x.transferSize,duration:Math.round(x.duration)}))
    }));
    await page.screenshot({path:path.join(__dirname, `${device}-${mode}.png`)});
    const {profile} = await session.send('Profiler.stop');
    const samples = new Map();
    for (const id of profile.samples || []) samples.set(id, (samples.get(id) || 0) + 1);
    const topCpu = profile.nodes.map(node => ({function:node.callFrame.functionName,
      file:node.callFrame.url.split('/').pop(),hits:samples.get(node.id) || 0}))
      .filter(x => x.hits > 0).sort((a,b) => b.hits-a.hits).slice(0,15);
    const blockingMs = metrics.longTasks.reduce((sum,x) => sum+Math.max(0,x.duration-50),0);
    console.log(JSON.stringify({mode,device,interact,blockingMs,longTaskCount:metrics.longTasks.length,
      longest:metrics.longTasks.sort((a,b)=>b.duration-a.duration).slice(0,8),
      topCpu,htmlWidth:metrics.htmlWidth,viewportWidth:metrics.viewportWidth,
      moonImageWidth:metrics.moonImageWidth,moonImageDisplay:metrics.moonImageDisplay,
      canvas3D:metrics.canvas3D,threeLoaded:metrics.threeLoaded,
      resources:metrics.resources,errors},null,2));
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  } finally {
    if (browser) await browser.close();
    server.close();
  }
});
