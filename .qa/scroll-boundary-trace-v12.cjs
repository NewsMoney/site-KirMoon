const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'kirmoon_site_v12.html'), 'utf8');
const read = name => JSON.parse(fs.readFileSync(path.join(root, name), 'utf8')).rows;

test('trace 4: own every Final upward wheel, cap the target, and transition at its edge', () => {
  const rows = read('kirmoon-scroll-trace (4).json');
  const firstUp = rows.find(r => r.kind === 'wheel-in' && r.deltaY < 0);
  const oldTransition = rows.find(r => r.kind === 'chapter-request' && r.requested === 2);
  const finalBoundary = rows.find(r => r.kind === 'animation-end' && r.chapter === 2).y;
  let target = firstUp.y;
  let crossing = null;
  for (const r of rows) {
    if (r.kind !== 'wheel-in' || r.deltaY >= 0 || r.n < firstUp.n) continue;
    const desired = target + r.deltaY;
    target = Math.max(finalBoundary, desired);
    assert.ok(target >= finalBoundary, 'bounded reverse target never enters Process early');
    if (target - finalBoundary <= Math.abs(r.deltaY) + 2) { crossing = r; break; }
  }
  assert.ok(firstUp.n < oldTransition.n);
  assert.ok(crossing && crossing.n <= oldTransition.n);
  assert.match(html, /if \(delta >= 0\) \{[\s\S]*?return;\s*\}\s*e\.preventDefault\(\);[\s\S]*?finalBoundaryTarget = Math\.max\(finalEntryTop, desired\)/);
});

test('approved Services descent stays bounded and uses the existing smooth Process profile', () => {
  const rows = read('kirmoon-scroll-trace (1).json');
  const nativeCrossing = rows.find(r => r.kind === 'wheel-in' && r.n === 20);
  const transition = rows.find(r => r.kind === 'animation-start' && r.chapter === 1);
  const boundary = nativeCrossing.y + nativeCrossing.service.bottom - nativeCrossing.viewport;
  assert.ok(nativeCrossing.serviceBoundaryRemaining < nativeCrossing.viewport);
  assert.ok(transition.y > boundary, 'V10 trace proves why the V12 bounded descent path is needed');
  assert.match(html, /distanceToBottomBoundary <= Math\.max\(innerHeight, magnitude \* 2\)/);
  assert.match(html, /enteringProcess \? PROCESS_SCENE_PROFILE : DEFAULT_SCENE_PROFILE/);
  assert.match(html, /serviceBoundaryEntryReady && boundaryTop - scrollY <= 2/);
});

test('diagnostic panel is opt-in, and wheel-out is observed after the handler', () => {
  assert.match(html, /addButton\('Iniciar'/);
  assert.match(html, /addButton\('Baixar'/);
  const controller = html.indexOf('addEventListener("wheel", e => {');
  const after = html.indexOf("addEventListener('wheel', e => scrollTrace.afterWheel(e)");
  assert.ok(controller >= 0 && after > controller);
});
