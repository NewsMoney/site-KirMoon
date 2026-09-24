// Mede o logo da primeira tela: margem esquerda × direita do desenho visível.
const { chromium } = require('playwright');
const fs=require('fs'),path=require('path');const THREE=fs.readFileSync('node_modules/three/build/three.min.js');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{const b=await chromium.launch();const f=process.argv[2];const shots=process.argv[3];
for (const [w,h] of [[360,780],[361,800],[390,844],[412,915],[768,1024]]){const c=await b.newContext({viewport:{width:w,height:h},hasTouch:true,isMobile:true,deviceScaleFactor:2});const p=await c.newPage();
await p.route('**/three.min.js',r=>r.fulfill({body:THREE,contentType:'text/javascript'}));
await p.route('https://fonts.googleapis.com/**',r=>r.fulfill({body:fs.readFileSync('fonts.css'),contentType:'text/css'}));
await p.route('https://fonts.gstatic.com/local/**',r=>{const u=new URL(r.request().url());const [,,slug,ff]=u.pathname.split('/');const fp=path.join('node_modules/@fontsource',slug,'files',ff);fs.existsSync(fp)?r.fulfill({body:fs.readFileSync(fp),contentType:'font/woff2'}):r.fulfill({status:404,body:''});});
await p.goto('file://'+path.resolve(f));await sleep(2200);
const m=await p.evaluate(()=>{const br=document.getElementById('floating-brand');const k=br.querySelector('.wm-text').getBoundingClientRect(),nEl=br.querySelector('.wm-n'),n=nEl.getBoundingClientRect();const sc=new DOMMatrix(getComputedStyle(br).transform).a;const ls=(parseFloat(getComputedStyle(nEl).letterSpacing)||0)*sc;const L=k.left,R=n.right-ls;
 return {vw:innerWidth,ink:[Math.round(L),Math.round(R)],left:Math.round(L),right:Math.round(innerWidth-R),off:Math.round((L+R)/2-innerWidth/2),scale:+sc.toFixed(2)}});
console.log(w,JSON.stringify(m));if(shots)await p.screenshot({path:`${shots}-${w}.png`});await c.close();}await b.close();})();
