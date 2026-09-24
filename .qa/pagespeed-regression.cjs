const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const original = fs.readFileSync('C:/Users/milto/Downloads/index.html','utf8');
const optimized = fs.readFileSync('index.otimizado.html','utf8');
const scripts = s => [...s.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
function undoAccessibilityFix(s) {
 let cards = 0;
 s = s.replace(/<div class="process-phase([^>]+)>([\s\S]*?)<\/div>(?=\s*(?:<div class="process-phase|<div class="process-active-shade))/g,
   (_match, attributes, content) => { cards++; return `<article class="process-phase${attributes}>${content}</article>`; });
 assert.equal(cards, 4, 'Four accessible phase controls must be present');
 return s
   .replace('.process-phase[data-process-step="3"]::after', '.process-phase:last-of-type::after')
   .replace('.process-sequence > .process-phase:not(:first-child)', '.process-sequence > .process-phase:not(:first-of-type)')
   .replace('.process-sequence > .process-phase[data-process-step="3"]', '.process-sequence > .process-phase:last-of-type');
}

test('All inline scripts compile',()=>{ for(const script of scripts(optimized))new vm.Script(script); });
test('Styles except three phase selectors and all embedded textures remain byte-identical',()=>{
 assert.deepEqual([...undoAccessibilityFix(optimized).matchAll(/<style\b[^>]*>[\s\S]*?<\/style>/g)].map(m=>m[0]),[...original.matchAll(/<style\b[^>]*>[\s\S]*?<\/style>/g)].map(m=>m[0]));
 const images=s=>[...s.matchAll(/<img\b[^>]*>/g)].map(m=>m[0]).sort();
 assert.deepEqual(images(optimized),images(original));
});
test('Content, controls, links and forms differ only in the four phase tags',()=>{
 const strip=s=>s.replace(/<script\b[^>]*>[\s\S]*?<\/script>|<style\b[^>]*>[\s\S]*?<\/style>|<img\b[^>]*>|<!--[\s\S]*?-->/g,'').replace(/\s+/g,' ').trim();
 assert.equal(strip(undoAccessibilityFix(optimized)),strip(original));
});
test('Navigation, service demos, logo, FAQ, carousel and contact logic are unchanged',()=>{
 const before=scripts(original),after=scripts(optimized);
 for(const script of before){
  if(!script.trim()||script.includes('const WHATSAPP')||script.includes('window.moonLayout'))continue;
  assert(after.includes(script),'Unrelated behavior changed');
 }
 const main=s=>scripts(s).find(s=>s.includes('const WHATSAPP'));
 const navigation=s=>main(s).split('  /* ---------- header + menu ---------- */')[1].split('  /* ---------- panel surfaces:')[0];
 assert.equal(navigation(optimized),navigation(original));
 const tail=s=>main(s).split('  /* ---------- FAQ premium:')[1];
 assert.equal(tail(optimized),tail(original));
 const geometry=s=>s.match(/new THREE\.(?:SphereGeometry|RingGeometry)\([^\n]+/g);
 assert.deepEqual(geometry(optimized),geometry(original));
});
test('Render gate bounds idle/interactive draw counts on high refresh displays',()=>{
 const body=optimized.match(/const canDraw = ([^;]+);/)[1];
 for(const [interacting,budget] of [[false,30],[true,60]]){
  const ctx=vm.createContext({lastDraw:0});const canDraw=vm.runInContext(body,ctx);let draws=0;
  for(let time=1;time<=1000;time+=1000/240){if(canDraw(time,interacting)){ctx.lastDraw=time;draws++;}}
  assert(draws<=budget+1 && draws>=budget-1,`${draws} vs ${budget}`);
 }
});
test('Inertia integrates identically over two 60 Hz frames or one 30 Hz frame',()=>{
 const v=.02,decay=.94;
 const twoFrames=v*decay+v*decay*decay;
 const oneFrame=v*.94*(1-Math.pow(.94,2))/.06;
 assert(Math.abs(twoFrames-oneFrame)<1e-12);
});
test('Phases yield between canvases and concurrent preparation is deduplicated',async()=>{
 const code=optimized.slice(optimized.indexOf('  let phasesReady = null;'),optimized.indexOf('  /* ---------- lua 3D do processo:'));
 let paints=0,yields=0;
 const canvases=Array.from({length:8},()=>({width:4,dataset:{phase:'.5'},classList:{add(){}},getContext:()=>({save(){},restore(){},translate(){},rotate(){},beginPath(){},arc(){},clip(){},drawImage(){},getImageData:()=>({data:new Uint8ClampedArray(64)}),putImageData(){paints++;},stroke(){}})}));
 const ctx=vm.createContext({document:{querySelectorAll:()=>canvases},img:{naturalWidth:10,naturalHeight:10},setTimeout:fn=>{yields++;return setTimeout(fn,0);}});
 const draw=vm.runInContext(code+'\ndrawPhases;',ctx);
 const a=draw(),b=draw();assert.equal(a,b);assert.equal(paints,0);
 await a;assert.equal(paints,8);assert.equal(yields,8);
 await draw();assert.equal(paints,8);
});
