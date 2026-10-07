const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const html = fs.readFileSync('kirmoon_site_v08.html', 'utf8');
const start = html.indexOf('  function createSceneFlowMachine(');
const end = html.indexOf('\n  const initialChapterFromHash', start);
if (start < 0 || end < 0) throw new Error('Could not extract scene flow controller');
const factoryText = html.slice(start, end).replace(/^  /gm, '');
const create = vm.runInNewContext(`(${factoryText.replace('function createSceneFlowMachine', 'function')})`);

test('a chapter transition commits chapter, phase, URL and viewport as one completion', () => {
  const flow = create({initialChapter:1,initialPhase:2,initialPosition:500});
  assert.equal(flow.beginTransition(2,{direction:1,targetTop:900,hash:'#processo',navHash:'#processo'}), true);
  assert.equal(flow.chapter,1);
  assert.equal(flow.completeTransition(1000).chapter,2);
  assert.deepEqual({...flow.snapshot()}, {...flow.snapshot(), transition:null});
  assert.equal(flow.snapshot().position,900);
  assert.equal(flow.snapshot().phase,0);
  assert.equal(flow.snapshot().hash,'#processo');
  assert.equal(flow.snapshot().navHash,'#processo');
});

test('entry and exit tails stay quarantined in both directions until quiet', () => {
  for (const [from,to,direction] of [[1,2,1],[2,3,1],[3,2,-1],[2,1,-1]]) {
    const flow=create({initialChapter:from});
    flow.beginTransition(to,{direction});
    assert.equal(flow.observeWheel(direction*40,50,true).consume,true,'animation consumes wheel');
    flow.completeTransition(100);
    assert.equal(flow.observeWheel(direction*30,200).reason,'gesture-tail');
    assert.equal(flow.observeWheel(direction*30,420).reason,'gesture-tail','tail renews quarantine');
    assert.equal(flow.observeWheel(direction*30,661).consume,false,'new gesture proceeds after silence');
  }
});

test('opposite direction breaks a completed transition quarantine as a new intent', () => {
  const flow=create({initialChapter:2});
  flow.beginTransition(3,{direction:1}); flow.completeTransition(10);
  assert.equal(flow.observeWheel(-20,30).reversed,true);
  assert.equal(flow.observeWheel(-20,31).consume,false);
});

test('one wheel gesture changes at most one Process phase; a quiet gesture can progress again', () => {
  const flow=create({initialChapter:2,phaseThreshold:120,wheelCap:70});
  assert.equal(flow.consumePhaseWheel(70,10),0);
  assert.equal(flow.consumePhaseWheel(70,30),1);
  assert.equal(flow.consumePhaseWheel(70,40),0);
  assert.equal(flow.consumePhaseWheel(70,300),0);
  assert.equal(flow.consumePhaseWheel(70,320),1);
});

test('final hash synchronization preserves final chapter authority', () => {
  const flow=create({initialChapter:3});
  assert.equal(flow.syncFinalHash('#contato',1800),true);
  assert.equal(flow.chapter,3);
  assert.equal(flow.snapshot().hash,'#contato');
  assert.equal(flow.snapshot().navHash,'#contato');
});

test('desktop geometry does not promote chapter authority and wheel uses shared release gate', () => {
  const update=html.slice(html.indexOf('  function updateScroll()'),html.indexOf('  function queueScroll()'));
  assert.doesNotMatch(update,/selectChapter\(index\)/);
  assert.match(html,/flow\.observeWheel\(delta,performance\.now\(\),sceneAnimating\)/);
  assert.match(html,/flow\.beginTransition\(index,/);
  assert.match(html,/flow\.completeTransition\(performance\.now\(\)\)/);
});
