const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

// Fresh regression seam (not the historical .qa screenshots/scripts): execute
// the chapter classifier and process-exit branch extracted from the current HTML.
const html = fs.readFileSync('kirmoon_site_v07.html', 'utf8');
const update = html.slice(html.indexOf('  function updateScroll()'), html.indexOf('  function queueScroll()'));
const classifier = update.match(/if \(!sceneAnimating && !processEntryPending\) \{[\s\S]*?\n    \}/)?.[0];
if (!classifier) throw new Error('Could not extract current chapter classifier');
const chooseChapter = new Function('active','sceneAnimating','processEntryPending','y','line','heroRect','serviceStartRect','serviceEndRect','processRect','finalStartRect','finalEndRect', `let index=active; ${classifier}; return index;`);

test('return from FAQ stays in final chapter until its real top boundary', () => {
  const line = 450;
  const current = chooseChapter(3, false, false, 1300, line,
    {top:-1300,bottom:-400}, {top:-300,bottom:100}, {bottom:100},
    {top:250,bottom:1050}, {top:650,bottom:1700}, {bottom:1900});
  assert.equal(current, 3, 'center-line promotion switched wheel authority to Process before final boundary crossing');
});

const exit = html.match(/if \(dir > 0\) \{\s*clearProcessEntryReleaseLock\(\);[\s\S]*?goToChapter\(3\);\s*\}/)?.[0];
if (!exit) throw new Error('Could not extract current Process-to-final branch');
test('Process-to-final keeps the outgoing gesture quarantined after animation', () => {
  let quarantined = true;
  let destination = null;
  const leave = new Function('dir','clearProcessEntryReleaseLock','goToChapter', exit);
  leave(1, () => { quarantined = false; }, index => { destination = index; });
  assert.equal(destination, 3);
  assert.equal(quarantined, true, 'the Process exit clears the gate before the same wheel tail enters the free-scroll chapter');
});

test('a native position promotion from final to Process is a committed transition, not a classifier side effect', () => {
  assert.match(html, /if \(currentChapter === processEl && chapters\[previousChapter\] !== processEl && !processEntryPending\)/,
    'this interim v07 patch still promotes Process from center-line geometry');
  assert.match(html, /else if \(processRect && processRect\.top <= line && processRect\.bottom > line\) \{\s*index = 2;/,
    'the center-line classifier still owns active chapter changes');
});
