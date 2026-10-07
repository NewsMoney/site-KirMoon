const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

test('every locally referenced visual asset is present in the delivery', () => {
  const references = [...html.matchAll(/(?:src|srcset|data-src|href)="(assets\/[^"\s]+)"/g)]
    .map(match => match[1]);
  assert(references.length >= 9);
  for (const reference of references) {
    assert(fs.existsSync(path.join(root, reference)), `Missing ${reference}`);
  }
});

test('section interactions load from local scripts when their sections approach', () => {
  for (const section of ['apps', 'sites', 'ti']) {
    assert(html.includes(`['${section}', 'assets/service-demos-20260924.js']`));
  }
  assert(html.includes("['compromissos', 'assets/commitments-carousel-20260924.js']"));
  for (const filename of ['service-demos-20260924.js', 'commitments-carousel-20260924.js']) {
    const source = fs.readFileSync(path.join(root, 'assets', filename), 'utf8');
    new vm.Script(source, {filename});
  }
});

test('search metadata and crawl files use the same hostname and a supported favicon', () => {
  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)[1];
  const favicon = html.match(/<link rel="icon" type="image\/png" sizes="96x96" href="([^"]+)"/)[1];
  const website = JSON.parse(html.match(/<script type="application\/ld\+json">([^<]+)<\/script>/)[1]);
  const robots = fs.readFileSync(path.join(root, 'robots.txt'), 'utf8');
  const sitemap = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
  assert.equal(canonical, 'https://kirmoon.com/');
  assert.equal(website.url, canonical);
  assert(robots.includes('Allow: /'));
  assert(robots.includes('https://kirmoon.com/sitemap.xml'));
  assert(sitemap.includes('<loc>https://kirmoon.com/</loc>'));
  const png = fs.readFileSync(path.join(root, favicon.slice(1)));
  assert.equal(png.readUInt32BE(16), 96);
  assert.equal(png.readUInt32BE(20), 96);
});

test('the 3D loader tries the local copy, falls back to the CDN, and can retry', async () => {
  const start = html.indexOf('  const THREE_SRC =');
  const end = html.indexOf('  const motion =', start);
  assert(start > 0 && end > start, '3D loader seam not found');
  const source = html.slice(start, end) + '\nloadThree;';
  const requests = [];
  const window = {};
  const document = {head: {appendChild(script) {
    requests.push(script.src);
    queueMicrotask(() => {
      if (requests.length < 3) script.onerror(new Error('network failure'));
      else { window.THREE = {ready: true}; script.onload(); }
    });
  }}, createElement: () => ({})};
  const loadThree = vm.runInNewContext(source, {window, document, Promise, requestAnimationFrame() {}, setTimeout() {}});

  await assert.rejects(loadThree());
  assert.match(requests[0], /assets\/vendor\/three-r128\.min\.js$/);
  assert.match(requests[1], /cdnjs\.cloudflare\.com/);
  assert.equal((await loadThree()).ready, true);
  assert.equal(requests.length, 3);
});

test('a moon image failure before DOMContentLoaded retries JPEG and ends the skeleton', () => {
  const start = html.indexOf('  const ready = () => {');
  const end = html.indexOf('  if (document.readyState === "loading")', start);
  assert(start > 0 && end > start, 'hero readiness seam not found');
  const listeners = new Map();
  const requested = [];
  const removed = [];
  const calls = [];
  const img = {
    complete: true, naturalWidth: 0, dataset: {},
    addEventListener(type, fn) { listeners.set(type, fn); },
    closest() { return {querySelectorAll() { return [{remove() { removed.push(true); }}]; }}; },
    set src(value) { requested.push(value); }
  };
  const context = {
    img, canvas: {addEventListener() {}},
    decorate() { calls.push('decorate'); },
    setupProgressiveScenes() { calls.push('scenes'); },
    matchMedia() { return {matches: true}; },
    showStaticMoon() { calls.push('static'); },
    drawPhases() { calls.push('phases'); },
    kmLoad(part) { calls.push(part); },
    loadThree() { throw new Error('unexpected 3D load'); }
  };
  const ready = vm.runInNewContext(html.slice(start, end) + '\nready;', context);
  ready();
  assert.deepEqual(requested, ['assets/moon.jpg?fallback=1']);
  assert.equal(removed.length, 1);
  assert(listeners.has('error'));
  listeners.get('error')();
  assert.equal(removed.length, 2);
  assert.deepEqual(calls, ['decorate', 'static', 'scenes', 'img', 'phases']);
});

test('the Process moon still draws when the texture image is unavailable', async () => {
  const start = html.indexOf('  let phasesReady = null;');
  const end = html.indexOf('  /* ---------- lua 3D do processo:', start);
  assert(start > 0 && end > start, 'Process moon drawing seam not found');
  let drawn = false;
  const ctx = {
    save() {}, translate() {}, rotate() {}, beginPath() {}, arc() {}, clip() {},
    createRadialGradient() { return {addColorStop() {}}; },
    fillRect() {}, restore() {},
    getImageData() { return {data: new Uint8ClampedArray(4 * 4 * 4)}; },
    putImageData() {}, stroke() {}
  };
  const canvas = {width: 4, dataset: {phase: '.5'}, getContext() { return ctx; },
    classList: {add(name) { if (name === 'drawn') drawn = true; }}};
  const context = {
    img: {naturalWidth: 0}, processMoons: [canvas], processActiveStep: 0,
    document: {querySelectorAll() { return [canvas]; }},
    setTimeout, Promise, Uint8ClampedArray, Math
  };
  const drawPhases = vm.runInNewContext(html.slice(start, end) + '\ndrawPhases;', context);
  await drawPhases();
  assert(drawn);
});
