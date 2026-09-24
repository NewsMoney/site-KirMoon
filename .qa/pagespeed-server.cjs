const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const original = 'C:/Users/milto/Downloads/index.html';
const root = path.resolve(__dirname, '..');
const probe = (mode) => `<script>
(() => {
 const stats = {longTasks:0, blockingMs:0, longestMs:0, contexts:[], frames:0, renderMs:0};
 new PerformanceObserver(list => list.getEntries().forEach(e => { stats.longTasks++; stats.blockingMs += Math.max(0,e.duration-50); stats.longestMs=Math.max(stats.longestMs,e.duration); })).observe({type:'longtask', buffered:true});
 const get = HTMLCanvasElement.prototype.getContext;
 HTMLCanvasElement.prototype.getContext = function(type, opts) { const ctx=get.call(this,type,opts); if(ctx && /webgl/.test(type) && !stats.contexts.some(c=>c.id===this.id))stats.contexts.push({id:this.id,type}); return ctx; };
 window.__qaWrapThree = () => {
  const Original = THREE.WebGLRenderer;
  THREE.WebGLRenderer = function(opts) { const renderer = new Original(opts); const render=renderer.render.bind(renderer); renderer.render=(...args)=> { const start=performance.now(); if(${JSON.stringify(mode)}!=='no-render')render(...args);stats.frames++;stats.renderMs+=performance.now()-start; }; return renderer; };
 };
 const report=()=>{ let out=document.getElementById('qa-perf');if(!out){out=document.createElement('pre');out.id='qa-perf';out.hidden=true;document.body.append(out);}out.textContent=JSON.stringify({...stats,elapsedMs:performance.now(),paint:performance.getEntriesByType('paint').map(p=>({name:p.name,ms:p.startTime})),canvases:[...document.querySelectorAll('canvas')].map(c=>({id:c.id,w:c.width,h:c.height})),moonReady:document.querySelector('#moon-canvas')?.classList.contains('on')}); };
 addEventListener('load',()=>{setTimeout(report,5000);setTimeout(report,10000);setTimeout(report,15000);});
})();
</script>`;
http.createServer((req,res)=>{
 const url=new URL(req.url,'http://127.0.0.1');
 if(url.pathname==='/favicon.ico'){res.writeHead(204);res.end();return;}
 if(url.pathname.startsWith('/assets/')){
  const file=path.resolve(root,'.'+url.pathname);if(!file.startsWith(root+path.sep)||!fs.existsSync(file)){res.writeHead(404);res.end();return;}res.setHeader('Content-Type','application/javascript');res.end(fs.readFileSync(file));return;
 }
 const file=url.pathname==='/before.html'?original:path.join(root,'index.html');
 if(!fs.existsSync(file)){res.writeHead(404);res.end('Not built');return;}
 let html=fs.readFileSync(file,'utf8');
 if(url.searchParams.has('qa')){
  html=html.replace('<head>','<head>'+probe(url.searchParams.get('qa')));
  html=html.replace('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js','/assets/vendor/three-r128.min.js');
  html=html.replace('script.onload = () => resolve(window.THREE || null);','script.onload = () => { __qaWrapThree(); resolve(window.THREE || null); };');
  html=html.replace('<script src="/assets/vendor/three-r128.min.js"></script>','<script src="/assets/vendor/three-r128.min.js" onload="__qaWrapThree()"></script>');
 }
 res.setHeader('Content-Type','text/html; charset=utf-8');res.setHeader('Cache-Control','no-store');res.end(html);
}).listen(8765,'127.0.0.1',()=>console.log('KirMoon comparison: http://127.0.0.1:8765/before.html?qa=baseline'));
