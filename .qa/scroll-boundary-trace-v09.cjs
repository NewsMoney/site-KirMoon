const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const trace = JSON.parse(fs.readFileSync(path.join(root, 'kirmoon-scroll-trace.json'), 'utf8'));

test('real fast-wheel trace reaches the Services boundary between wheel events', () => {
  const rows = trace.rows;
  const lastNativeWheel = rows.find(row => row.n === 162);
  const crossing = rows.find(row => row.n === 166);
  const nextWheel = rows.find(row => row.n === 168);
  const firstTransition = rows.find(row => row.kind === 'animation-start' && row.chapter === 1);
  assert.equal(lastNativeWheel.kind, 'wheel-in');
  assert.equal(lastNativeWheel.deltaY, 100);
  assert.equal(crossing.kind, 'scroll');
  const boundary = crossing.y + crossing.service.bottom - crossing.viewport;
  assert.equal(boundary, 2745);
  assert.ok(crossing.y > boundary, 'native momentum passed the chapter boundary');
  assert.ok(crossing.t < nextWheel.t, 'crossing happened before another wheel event');
  assert.equal(firstTransition.y, nextWheel.y, 'v08 started from the overshot position');
  assert.ok(crossing.t - lastNativeWheel.t < 750, 'the recent down-wheel guard covers the crossing');
});

test('shorter trace independently shows native scroll overshooting before transition', () => {
  const rows = JSON.parse(fs.readFileSync(path.join(root, 'kirmoon-scroll-trace (1).json'), 'utf8')).rows;
  const lastNativeWheel = rows.find(row => row.n === 20);
  const crossing = rows.find(row => row.n === 25);
  const firstTransition = rows.find(row => row.kind === 'animation-start');
  const boundary = crossing.y + crossing.service.bottom - crossing.viewport;
  assert.equal(boundary, 2745);
  assert.equal(lastNativeWheel.kind, 'wheel-in');
  assert.equal(lastNativeWheel.y, 2468);
  assert.equal(crossing.y, 2781);
  assert.ok(crossing.y > boundary);
  assert.equal(firstTransition.y, crossing.y);
  assert.ok(crossing.t - lastNativeWheel.t < 750);
});

test('v09 handles the boundary from scroll and retains the original Process profile', () => {
  const html = fs.readFileSync(path.join(root, 'kirmoon_site_v09.html'), 'utf8');
  assert.match(html, /addEventListener\('scroll', \(\) => \{[\s\S]*?performance\.now\(\) > serviceDownWheelUntil[\s\S]*?scrollTo\(\{top:boundaryTop, behavior:'instant'\}\);[\s\S]*?goToChapter\(2\)/);
  assert.match(html, /enteringProcess \? PROCESS_SCENE_PROFILE : DEFAULT_SCENE_PROFILE/);
});
