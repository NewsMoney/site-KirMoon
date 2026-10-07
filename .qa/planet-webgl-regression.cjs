const assert = require('node:assert/strict');
const {chromium} = require('C:/Users/milto/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{
  const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
  try {
    const page=await browser.newPage({viewport:{width:1844,height:900},reducedMotion:'reduce'});
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.route('**/three.min.js',r=>r.fulfill({path:'assets/vendor/three-r128.min.js',contentType:'application/javascript'}));
    await page.addInitScript(()=>{
      const getContext=HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext=function(type,options){return getContext.call(this,type,/webgl/.test(type)?{...options,preserveDrawingBuffer:true}:options)};
    });
    await page.goto('file:///C:/Users/milto/OneDrive/Desktop/KirMoon/kirmoon_site.html');
    await page.waitForFunction(()=>document.querySelectorAll('.is-3d').length===3);
    for(const width of [1844,1100,768,390]){
      await page.setViewportSize({width,height:900});
      for(const id of ['compromissos','faq','contato']){
        await page.evaluate(id=>{const s=document.getElementById(id);window.scrollTo(0,s.offsetTop)},id);
        await page.waitForTimeout(700);
        await page.screenshot({path:`.qa/planet-${id}-${width}.png`});
        const metrics=await page.locator(`#${id} .planet-canvas`).evaluate(canvas=>{
          const gl=canvas.getContext('webgl2')||canvas.getContext('webgl');
          if(!gl)return {webgl:false};
          const w=gl.drawingBufferWidth,h=gl.drawingBufferHeight,data=new Uint8Array(w*h*4);gl.readPixels(0,0,w,h,gl.RGBA,gl.UNSIGNED_BYTE,data);
          let edge=0,painted=0;
          for(let y=0;y<h;y++)for(let x=0;x<w;x++){if(data[(y*w+x)*4+3]>25){painted++;if(x<2||y<2||x>=w-2||y>=h-2)edge++}}
          const r=canvas.getBoundingClientRect();
          const heading=canvas.closest('section').querySelector(canvas.dataset.planet==='saturn'?'#diagnostico-titulo':'h2').getBoundingClientRect();
          const overlap=Math.max(0,Math.min(r.right,heading.right)-Math.max(r.left,heading.left))*Math.max(0,Math.min(r.bottom,heading.bottom)-Math.max(r.top,heading.top));
          return {webgl:true,edge,painted,overlap,overflow:document.documentElement.scrollWidth-innerWidth};
        });
        console.log(width,id,metrics);
        assert(metrics.webgl&&metrics.painted>100,'Must exercise actual WebGL with visible geometry');
        assert.equal(metrics.edge,0,'Planet geometry is clipped at the canvas edge');
        assert.equal(metrics.overlap,0,'Planet canvas overlaps heading');
        assert(metrics.overflow<=1,'Horizontal overflow');
      }
    }
    assert.deepEqual(errors,[]);console.log('PASS: actual WebGL, no clipped geometry or overlapping headings at four widths.');
  }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
