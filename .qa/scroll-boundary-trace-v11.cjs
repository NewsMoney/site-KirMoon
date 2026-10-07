const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'kirmoon_site_v11.html'), 'utf8');
const trace = n => JSON.parse(fs.readFileSync(path.join(root, `kirmoon-scroll-trace (${n}).json`), 'utf8')).rows;

test('trace 2: wheel over the comparison range bypassed an active Services controller', () => {
  const rows = trace(2);
  const bounded = rows.find(r => r.kind === 'bounded-start');
  const nextWheel = rows.find(r => r.kind === 'wheel-in' && r.t > bounded.t);
  assert.equal(nextWheel.target, 'field');
  assert.equal(nextWheel.deltaY, 100);
  assert.equal(rows.filter(r => r.kind === 'bounded-wheel').length, 1);
  assert.match(html, /active === 1 && interactiveTarget\.matches\('input\[type="range"\]'\)/);
});

test('trace 3: ready-to-enter state one pixel from boundary must terminate', () => {
  const first = trace(3).find(r => r.kind === 'bounded-wheel');
  assert.equal(first.entryReady, true);
  assert.equal(first.target, 2745);
  assert.equal(first.y, 2744);
  assert.equal(first.boundaryTop - first.y, 1);
  assert.match(html, /serviceBoundaryEntryReady && boundaryTop - scrollY <= 2/);
});

test('trace 4: Final upward wheel enters bounded control before native overshoot', () => {
  const rows = trace(4);
  const firstUp = rows.find(r => r.kind === 'wheel-in' && r.deltaY < 0);
  const finalBoundary = rows.find(r => r.kind === 'animation-end' && r.chapter === 2).y;
  const lastFinalCommit = rows.find(r => r.kind === 'chapter-commit' && r.chapter === 3);
  const firstWrongSide = rows.find(r => r.kind === 'scroll' && r.t > lastFinalCommit.t && r.chapter === 3 && !r.flow.transition && r.y < finalBoundary);
  assert.equal(finalBoundary, 4487);
  assert.ok(firstUp.y - finalBoundary < firstUp.viewport);
  assert.ok(firstWrongSide.t > firstUp.t);
  assert.match(html, /finalBoundaryMode \|\| distanceToBoundary <= Math\.max\(innerHeight, Math\.abs\(delta\) \* 2\)/);
  assert.match(html, /finalBoundaryTarget = Math\.max\(finalEntryTop, desired\)/);
});

test('trace wheel-out observation is registered after the actual wheel controller', () => {
  const controller = html.indexOf('addEventListener("wheel", e => {');
  const after = html.indexOf("addEventListener('wheel', e => scrollTrace.afterWheel(e)");
  assert.ok(controller >= 0 && after > controller);
});
