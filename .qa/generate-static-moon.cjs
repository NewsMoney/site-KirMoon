const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const {chromium} = require('C:/Users/milto/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');

const root = path.resolve(__dirname, '..');
const source = path.join(__dirname, 'index-before-desktop-deferral.html');
const output = path.join(root, 'assets', 'moon-hero-static-20260924.webp');
const server = http.createServer((request, response) => {
  const pathname = new URL(request.url, 'http://127.0.0.1').pathname;
  const file = pathname === '/' ? source : path.resolve(root, pathname.slice(1));
  if (pathname !== '/' && !file.startsWith(root + path.sep)) { response.writeHead(403); response.end(); return; }
  if (!fs.existsSync(file)) { response.writeHead(404); response.end(); return; }
  const ext = path.extname(file);
  response.setHeader('Content-Type', ({'.html':'text/html; charset=utf-8','.js':'application/javascript',
    '.avif':'image/avif','.webp':'image/webp','.jpg':'image/jpeg','.png':'image/png'}[ext] || 'application/octet-stream'));
  let body = fs.readFileSync(file);
  if (pathname === '/') {
    const html = body.toString().replace(
      'new THREE.WebGLRenderer({canvas, antialias:true, alpha:true, powerPreference:"high-performance"})',
      'new THREE.WebGLRenderer({canvas, antialias:true, alpha:true, preserveDrawingBuffer:true, powerPreference:"high-performance"})');
    if (html === body.toString()) throw new Error('Could not enable preserveDrawingBuffer');
    body = Buffer.from(html);
  }
  response.end(body);
});

server.listen(0, '127.0.0.1', async () => {
  let browser;
  try {
    browser = await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
    const page = await browser.newPage({viewport:{width:1920,height:1080},deviceScaleFactor:1});
    await page.goto(`http://127.0.0.1:${server.address().port}/`, {waitUntil:'domcontentloaded'});
    await page.locator('#moon-canvas.on').waitFor({state:'visible',timeout:15000});
    const dataUrl = await page.evaluate(() => {
      const src = document.getElementById('moon-canvas');
      const w = src.clientWidth, h = src.clientHeight;
      const radius = Math.min(h * .31, w * .20, 320);
      const cx = w * .75, cy = h * .48;
      const pixelRatio = src.width / w;
      const crop = Math.round(radius * 2.12 * pixelRatio);
      const out = document.createElement('canvas');
      out.width = out.height = crop;
      const context = out.getContext('2d');
      context.drawImage(src,
        Math.round(cx * pixelRatio - crop / 2), Math.round(cy * pixelRatio - crop / 2),crop,crop,
        0,0,crop,crop);
      return out.toDataURL('image/webp',.88);
    });
    fs.writeFileSync(output, Buffer.from(dataUrl.split(',')[1], 'base64'));
    console.log(JSON.stringify({output,bytes:fs.statSync(output).size}));
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  } finally {
    if (browser) await browser.close();
    server.close();
  }
});
