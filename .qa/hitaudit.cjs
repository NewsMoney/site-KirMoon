// Audita alvos de toque: o centro de cada controle visível precisa acertar o próprio controle.
const { chromium } = require('playwright');
const fs=require('fs');const THREE=fs.readFileSync('node_modules/three/build/three.min.js');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{const b=await chromium.launch();for (const w of (process.argv[3]||'360,390,768').split(',').map(Number)){const c=await b.newContext({viewport:{width:w,height:800},hasTouch:true,isMobile:true,reducedMotion:'reduce'});const p=await c.newPage();await p.route('**/three.min.js',r=>r.fulfill({body:THREE,contentType:'text/javascript'}));
await p.goto('file://'+require('path').resolve(process.argv[2]));await sleep(1200);
const n=await p.evaluate(()=>{window.__ctl=[...document.querySelectorAll('main a[href], main button, main [role=tab], main [role=button], footer a, .fab')];return __ctl.length});
const bad=[];
for(let i=0;i<n;i++){const r=await p.evaluate(async i=>{const el=__ctl[i];const cs=getComputedStyle(el);let r=el.getBoundingClientRect();if(!r.width||!r.height||cs.visibility==='hidden'||el.closest('[hidden],[inert],.cmt-slide:not(.is-active)'))return null;
el.scrollIntoView({block:'center',behavior:'instant'});await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));r=el.getBoundingClientRect();
if(r.bottom<0||r.top>innerHeight)return null;const x=Math.min(innerWidth-2,Math.max(1,r.left+r.width/2)),y=r.top+r.height/2;const h=document.elementFromPoint(x,y);
if(!h||h===el||el.contains(h))return null;const d=e=>e?(e.tagName.toLowerCase()+(e.id?'#'+e.id:'')+(typeof e.className==='string'&&e.className?'.'+e.className.trim().split(/\s+/).slice(0,2).join('.'):'')+(e.dataset?.node?'['+e.dataset.node+']':'')):'none';
return d(el)+' '+(el.textContent||'').trim().slice(0,24).replace(/\s+/g,' ')+' ← coberto por '+d(h.closest('a,button,[role=tab]')||h)},i);if(r)bad.push(r)}
console.log(`${w}px: ${n} controles, ${bad.length} cobertos`);bad.forEach(x=>console.log('  '+x));await c.close();}await b.close();})();
