/* One regular circular arc. Place planet centres on it; flight review is separate. */
(()=>{
 const root=document.querySelector('.mission-map'),svg=root?.querySelector('.mission-orbital'),globes=[...document.querySelectorAll('.mission-waypoint .journey-globe')];
 if(!svg||globes.length!==3)return;
 const offsets=new WeakMap();let frame=0;
 const draw=()=>{
  frame=0;const r=root.getBoundingClientRect();
  const original=globes.map(e=>{const b=e.getBoundingClientRect(),text=e.closest('.mission-waypoint').querySelector('b').getBoundingClientRect();return {x:(b.left+b.right)/2-r.left-(offsets.get(e)||0),y:(b.top+b.bottom)/2-r.top,radius:b.width/2,textLeft:text.left-r.left};});
  const cy=(original[0].y+original[2].y)/2,span=(original[2].y-original[0].y)/2,requestedBow=innerWidth>1150?20:12;
  const baseX=Math.max(Math.min(...original.map(p=>p.x))-requestedBow,original[1].radius+2);
  const outerLimit=Math.min(...[original[0],original[2]].map(p=>p.textLeft-p.radius-8));
  const bow=Math.max(2,Math.min(requestedBow,outerLimit-baseX));
  const radius=(span*span+bow*bow)/(2*bow),cx=baseX+radius;
  const xAt=y=>cx-Math.sqrt(Math.max(0,radius*radius-(y-cy)*(y-cy)));
  const centers=original.map((p,i)=>{const x=xAt(p.y),offset=x-p.x;offsets.set(globes[i],offset);globes[i].style.translate=`${offset}px 0`;return {x,y:p.y};});
  const startY=-Math.max(128,r.height*.5),endY=r.height+Math.max(128,r.height*.5);
  svg.style.cssText='position:absolute;left:0;top:0;width:100%;height:100%;overflow:hidden;pointer-events:none;z-index:0';
  svg.setAttribute('viewBox',`0 0 ${r.width} ${r.height}`);
  const ns='http://www.w3.org/2000/svg';let defs=svg.querySelector('defs');
  if(!defs){defs=document.createElementNS(ns,'defs');defs.innerHTML='<linearGradient id="mission-orbit-edge-gradient" x1="0" y1="0" x2="0" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="white" stop-opacity="0"/><stop offset=".08" stop-color="white"/><stop offset=".92" stop-color="white"/><stop offset="1" stop-color="white" stop-opacity="0"/></linearGradient><mask id="mission-orbit-edge-mask" maskUnits="userSpaceOnUse" x="0" y="0"><rect x="0" y="0" fill="url(#mission-orbit-edge-gradient)"/></mask>';svg.prepend(defs);}
  const fade=Math.min(.12,48/r.height);defs.querySelector('linearGradient').setAttribute('y2',r.height);const stops=defs.querySelectorAll('stop');stops[1].setAttribute('offset',fade);stops[2].setAttribute('offset',1-fade);
  const mask=defs.querySelector('mask'),maskRect=defs.querySelector('rect');for(const e of [mask,maskRect]){e.setAttribute('width',r.width);e.setAttribute('height',r.height);}
  svg.querySelector('path').setAttribute('d',`M${xAt(startY)} ${startY} A${radius} ${radius} 0 0 0 ${xAt(endY)} ${endY}`);svg.querySelector('path').setAttribute('mask','url(#mission-orbit-edge-mask)');
  svg.querySelectorAll('circle').forEach((dot,i)=>{const y=i===2?original[0].y-100:(original[i].y+original[i+1].y)/2;dot.setAttribute('cx',xAt(y));dot.setAttribute('cy',y);});
  window.KirmoonOrbitReview={centers,circle:{x:cx,y:cy,radius},bow,startY,endY,clipped:true};
 };
 const queue=()=>{if(!frame)frame=requestAnimationFrame(draw)};
 const ro=new ResizeObserver(queue);ro.observe(root);globes.forEach(e=>ro.observe(e));document.fonts?.ready.then(queue);addEventListener('resize',queue,{passive:true});queue();
})();
