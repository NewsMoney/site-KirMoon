const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const boundary = 2745;

for (const filename of ['kirmoon-scroll-trace.json', 'kirmoon-scroll-trace (1).json']) {
  test(`${filename}: bounded wheel target cannot pass Services before entry`, () => {
    const rows = JSON.parse(fs.readFileSync(path.join(root, filename), 'utf8')).rows;
    const firstLateEntry = rows.find(r => r.kind === 'animation-start' && r.chapter === 1);
    let target = null, takeover = null, entryReady = null;
    for (const row of rows) {
      if (row.kind !== 'wheel-in' || row.chapter !== 1 || row.deltaY <= 0) continue;
      if (target === null && row.serviceBoundaryRemaining <= row.viewport) {
        takeover = row;
        target = row.y;
      }
      if (target === null) continue;
      const desired = target + row.deltaY;
      target = Math.min(boundary, desired);
      assert.ok(target <= boundary);
      if (desired > boundary) { entryReady = row; break; }
    }
    assert.ok(takeover && entryReady);
    assert.ok(takeover.t < firstLateEntry.t);
    assert.ok(entryReady.t <= firstLateEntry.t);
    assert.ok(takeover.y < boundary, 'takeover occurs before any visible boundary crossing');
  });
}

test('candidate owns final-viewport wheel, includes opt-in trace, and keeps Process timing', () => {
  const html = fs.readFileSync(path.join(root, 'kirmoon_site_v10.html'), 'utf8');
  assert.match(html, /distanceToBottomBoundary <= Math\.max\(innerHeight, magnitude \* 2\)/);
  assert.match(html, /serviceBoundaryTarget = Math\.min\(serviceBoundaryTop, desired\)/);
  assert.match(html, /serviceBoundaryEntryReady && scrollY >= boundaryTop - 1/);
  assert.match(html, /enteringProcess \? PROCESS_SCENE_PROFILE : DEFAULT_SCENE_PROFILE/);
  assert.match(html, /addButton\('Iniciar'/);
  assert.match(html, /addButton\('Baixar'/);
});
