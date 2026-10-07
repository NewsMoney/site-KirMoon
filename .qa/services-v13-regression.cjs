const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'kirmoon_site_v13.html'), 'utf8');
const readTrace = n => JSON.parse(fs.readFileSync(path.join(root, `kirmoon-scroll-trace (${n}).json`), 'utf8')).rows;

test('Services upward replay takes control before Chrome makes the wheel tail non-cancelable', () => {
  const rows = readTrace(3);
  const start = rows.find(row => row.kind === 'start');
  const firstUp = rows.find(row => row.kind === 'wheel-in' && row.deltaY < 0);
  const viewport = start.viewport;
  const servicePageTop = start.y + start.service.top;
  const headerHeight = 80;
  const entryTop = Math.max(0, servicePageTop - headerHeight);
  const distance = firstUp.y - entryTop;

  assert.equal(start.hash, '#servicos');
  assert.equal(firstUp.cancelable, true);
  assert.equal(firstUp.deltaY, -100);
  assert.equal(distance, 314);
  assert.ok(distance <= Math.max(viewport, Math.abs(firstUp.deltaY) * 2));
  const oldTransitionRequest = rows.find(row => row.kind === 'chapter-request' && row.requested === 0);
  const lateWheel = rows.find(row => row.kind === 'wheel-in' && row.n === oldTransitionRequest.n - 1);
  const firstReversal = rows.find((row, index) => row.kind === 'scroll' && index > 0 && row.y > rows.slice(0, index).filter(item => item.kind === 'scroll').at(-1)?.y);
  assert.equal(lateWheel.cancelable, false, 'the old transition request ran on the non-cancelable tail');
  assert.ok(firstReversal, 'the trace contains the recorded reverse scroll sample');
  assert.match(html, /\},\s*\{passive:false\}\);\s*addEventListener\('wheel', e => scrollTrace\.afterWheel/);
  assert.doesNotMatch(html, /distanceToTopBoundary\s*<=\s*magnitude\s*\+\s*2/);
  assert.match(html, /serviceReturnBoundaryMode\s*\|\|\s*distanceToTopBoundary\s*<=\s*Math\.max\(innerHeight,\s*magnitude\s*\*\s*2\)/);

  let target = firstUp.y;
  let ready = false;
  let hitIndex = -1;
  const upward = rows.filter(row => row.kind === 'wheel-in' && row.deltaY < 0);
  for (const [index, wheel] of upward.entries()) {
    target = Math.max(entryTop, target + wheel.deltaY);
    if (target === entryTop) { ready = true; hitIndex = index; break; }
  }
  assert.ok(ready, 'the recorded gesture reaches the bounded Services entry edge');
  assert.equal(target, entryTop);
  assert.ok(hitIndex >= 0 && hitIndex < 3, 'the recorded target reaches the edge before its old late transition request');
});

test('Services descent keeps its bounded hand-off and approved Process profile', () => {
  assert.match(html, /distanceToBottomBoundary\s*<=\s*Math\.max\(innerHeight,\s*magnitude\s*\*\s*2\)/);
  assert.match(html, /serviceBoundaryEntryReady\s*&&\s*boundaryTop\s*-\s*scrollY\s*<=\s*2/);
  assert.match(html, /enteringProcess\s*\?\s*PROCESS_SCENE_PROFILE\s*:\s*DEFAULT_SCENE_PROFILE/);
});

test('V13 opt-in trace records card 2 hover, geometry, scroll, and build identity', () => {
  assert.match(html, /buildId\s*:\s*'kirmoon_site_v13'/);
  assert.match(html, /addEventListener\('pointerenter'/);
  assert.match(html, /addEventListener\('pointerleave'/);
  assert.match(html, /service-card-2-hover/);
  assert.match(html, /getBoundingClientRect\(\)/);
  assert.match(html, /layout\s*:\s*\{/);
});

test('V13 inline JavaScript parses without executing browser code', () => {
  const inlineScripts = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)]
    .map(match => match[1])
    .filter(source => source.trim());
  assert.ok(inlineScripts.length > 0);
  for (const source of inlineScripts) assert.doesNotThrow(() => new Function(source));
});

test('trace 4 remains classified as a separate Final return issue', () => {
  const rows = readTrace(4);
  const start = rows.find(row => row.kind === 'start');
  const firstUp = rows.find(row => row.kind === 'wheel-in' && row.deltaY < 0);
  assert.equal(start.hash, '#faq');
  assert.equal(start.chapter, 3);
  assert.equal(firstUp.target, 'final');
  assert.equal(rows.some(row => row.kind === 'bounded-start'), false);
});
