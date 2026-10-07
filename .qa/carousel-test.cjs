// Comportamento do carrossel de Compromissos (v9). Usage: node carousel-test.cjs <file.html>
const { chromium } = require('playwright'); const fs=require('fs'),path=require('path');
const file=path.resolve(process.argv[2]);
const threePath=path.join(__dirname,'node_modules/three/build/three.min.js');
const THREE=fs.existsSync(threePath)?fs.readFileSync(threePath):null;
const sleep=ms=>new Promise(r=>setTimeout(r,ms)); const out=[];
const t=(name,pass,info)=>{out.push(pass);console.log((pass?'PASS ':'FAIL ')+name,JSON.stringify(info??''))};
(async()=>{const b=await chromium.launch(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}:{channel:'chrome'});
async function open(opts={}){const ctx=await b.newContext({viewport:{width:1440,height:900},reducedMotion:opts.reduce?'reduce':'no-preference'});const p=await ctx.newPage();const errs=[];
p.on('pageerror',e=>errs.push(e.message));if(THREE)await p.route('**/three.min.js',r=>r.fulfill({body:THREE,contentType:'text/javascript'}));
await p.goto('file://'+file);await sleep(500);
await p.evaluate(()=>{const s=document.getElementById('compromissos');scrollTo({top:scrollY+s.getBoundingClientRect().top-80,behavior:'instant'})});
await p.mouse.move(10,450);await sleep(600);return {ctx,p,errs};}
const st=p=>p.evaluate(()=>{const r=document.querySelector('[data-cmt-carousel]');const sl=[...r.querySelectorAll('.cmt-slide')];const c=r.cmtState();
 const m=r.querySelector('.cmt-sat').getAttribute('transform')||'';const xy=(m.match(/translate\(([-\d.]+) ([-\d.]+)\)/)||[]).slice(1).map(Number);
 return {active:sl.findIndex(s=>s.classList.contains('is-active')),n:sl.length,lap:+c.lap.toFixed(3),pos:+c.pos.toFixed(3),paused:c.paused,auto:c.autoplay,boosting:c.boosting,xy,
 planets:[...r.querySelectorAll('.planet-canvas')].map(c=>c.dataset.planet).join(','),saturn3d:!!r.querySelector('.cmt-planet--saturn.is-3d'),
 pauseBtn:!!r.querySelector('.cmt-toggle'),trail:[...r.querySelectorAll('.cmt-trail path')].filter(p=>p.getAttribute('d')).length,
 sel:document.getElementById('f-servico').value,hash:(document.documentElement.dataset.kmHash||location.hash),countShown:!!r.querySelector('.cmt-count,.cmt-dot')||/\b0?\d\s*\/\s*0?\d\b/.test(r.innerText)}});
let {ctx,p,errs}=await open();
let s0=await st(p); t('6 cards, autoplay on, no count, no pause button, only Saturn',s0.n===6&&s0.active===0&&s0.auto&&!s0.countShown&&!s0.pauseBtn&&s0.planets==='saturn'&&s0.saturn3d,s0);
await sleep(1500); let a=await st(p); await sleep(1600); let c=await st(p);
t('satellite orbits: lap advances and position moves on an ellipse',c.lap>a.lap&&a.lap>0&&(a.xy[0]!==c.xy[0]||a.xy[1]!==c.xy[1])&&c.trail>0,{a:[a.lap,a.xy],c:[c.lap,c.xy],trail:c.trail});
const g=await p.evaluate(()=>{const e=document.querySelector('.cmt-orbit-path');return ['cx','cy','rx','ry'].map(k=>+e.getAttribute(k))});
const on=(xy)=>Math.abs(((xy[0]-g[0])/g[2])**2+((xy[1]-g[1])/g[3])**2-1)<.02; t('satellite stays on the ellipse',on(a.xy)&&on(c.xy),{g,a:a.xy,c:c.xy});
const wrapRun=await p.evaluate(()=>new Promise(res=>{const root=document.querySelector('[data-cmt-carousel]');const sat=root.querySelector('.cmt-sat');const out=[];
 const f=()=>{const c=root.cmtState();const m=(sat.getAttribute('transform')||'').match(/translate\(([-\d.]+) ([-\d.]+)\) rotate\(([-\d.]+)\)/);out.push([c.index,c.lap,+m[1],+m[2],+m[3]]);
  if(c.index===1&&c.lap>.05)res(out);else requestAnimationFrame(f)};requestAnimationFrame(f);}));
const k=wrapRun.findIndex((x,i)=>i&&x[0]!==wrapRun[i-1][0]);const win=wrapRun.slice(Math.max(1,k-8),k+8);
const dRot=Math.max(...win.map((x,i)=>i?Math.abs(x[4]-win[i-1][4]):0)),dPos=Math.max(...win.map((x,i)=>i?Math.hypot(x[2]-win[i-1][2],x[3]-win[i-1][3]):0));
t('lap restart is smooth: satellite never rotates, no position jump',k>0&&dRot===0&&dPos<12,{dRot:+dRot.toFixed(2),dPos:+dPos.toFixed(2),frames:win.map(x=>x[4])});
let w=await st(p);
t('one full lap -> next card, lap restarts',w.active===1&&w.lap<.1,w);
const box=await p.evaluate(()=>{const r=document.querySelector('[data-cmt-carousel]').getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+300}});
await p.mouse.move(box.x,box.y); await sleep(300); let h1=await st(p); await sleep(1500); let h2=await st(p);
t('hover does NOT pause the orbit',!h1.paused&&h2.pos>h1.pos,{a:h1.pos,b:h2.pos});
// Seta com o mouse sobre o card: uma volta inteira e rápida; o card troca na hora.
let b0=await st(p); await p.click('.carousel-next'); let b1=await st(p);
await p.waitForFunction(()=>!document.querySelector('[data-cmt-carousel]').cmtState().boosting,null,{timeout:4000}).catch(()=>{}); let b2=await st(p);
const atStart=x=>Math.abs(x-Math.round(x))<.005;
t('next arrow: card changes at once and the satellite spins forward to the start point',b1.active===b0.active+1&&b1.boosting&&!b2.boosting&&b2.pos>b0.pos&&atStart(b2.pos)&&b2.pos-b0.pos<=1.02&&b2.lap<.08,{from:b0.pos,to:b2.pos,cycle:b2.lap});
t('mouse click does not pause autoplay',!b2.paused,{paused:b2.paused});
let c0=await st(p); await p.click('.carousel-prev'); await p.waitForFunction(()=>!document.querySelector('[data-cmt-carousel]').cmtState().boosting,null,{timeout:4000}).catch(()=>{}); let c2=await st(p);
t('prev arrow: spins backwards to the start point',c2.active===c0.active-1&&c2.pos<c0.pos&&atStart(c2.pos)&&(c0.pos-c2.pos)<=1.02,{from:c0.pos,to:c2.pos});
let aNow=(await st(p)).active; await sleep(3000); let still=await st(p);
t('new card gets a full lap after the arrow (no early change)',still.active===aNow,{active:still.active,cycle:still.lap});
await p.keyboard.press('Tab'); await sleep(200); let kf=await st(p);
t('keyboard focus (Tab) pauses',kf.paused||!(await p.evaluate(()=>document.querySelector('[data-cmt-carousel]').contains(document.activeElement))),kf.paused);
await p.mouse.click(5,5); await p.mouse.move(10,450); await sleep(300);
let pb=(await st(p)).active; await p.click('.carousel-prev'); await sleep(700); t('prev button',(await st(p)).active===((pb+5)%6));
while((await st(p)).active!==0){await p.click('.carousel-prev');await sleep(400);} await p.click('.carousel-prev'); await sleep(700); t('prev wraps to last (6)',(await st(p)).active===5);
await p.keyboard.press('ArrowRight'); await sleep(700); t('ArrowRight wraps to first',(await st(p)).active===0);
const live=await p.evaluate(()=>document.querySelector('.cmt-live').textContent); t('live region names the card',/Desenvolvimento de aplicativos: Sua equipe vive em planilhas\?/.test(live),live);
const mid=await p.evaluate(()=>new Promise(res=>{const sl=[...document.querySelectorAll('.cmt-slide')];document.querySelector('.carousel-next').click();
 setTimeout(()=>{const x=el=>Math.round(new DOMMatrix(getComputedStyle(el).transform).m41);res({s0:x(sl[0]),s1:x(sl[1]),o0:getComputedStyle(sl[0]).opacity,o1:getComputedStyle(sl[1]).opacity})},600)}));
t('text slides without fading',mid.s0<0&&mid.s1>0&&mid.o0==='1'&&mid.o1==='1',mid);
await sleep(800);
await p.click('#cmt-slide-2 .cmt-cta'); await sleep(1500); let s8=await st(p); t('CTA preselects service and goes to contact',s8.sel==='Refatoração de site'&&s8.hash==='#contato',s8);
t('no page errors',errs.length===0,errs); await ctx.close();
({ctx,p,errs}=await open({reduce:true})); let r0=await st(p); await sleep(1500); let r1=await st(p);
t('reduced motion: no autoplay, satellite still at the start, no trail',!r0.auto&&r0.lap===0&&r1.lap===0&&r1.trail===0,r1); await ctx.close();
await b.close(); console.log(`\n${out.filter(Boolean).length}/${out.length} passed`);})();
