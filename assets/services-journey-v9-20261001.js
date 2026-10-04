/* One ship; world-space routing keeps page scrolling independent from the flight. */
(function(scope){
 'use strict';const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 function cubic(s,t){const p=s.map(v=>({...v}));for(let n=p.length-1;n>0;n--)for(let i=0;i<n;i++){p[i].x+=(p[i+1].x-p[i].x)*t;p[i].y+=(p[i+1].y-p[i].y)*t;}return p[0];}
 function derivative(s){const n=s.length-1;return s.slice(1).map((p,i)=>({x:n*(p.x-s[i].x),y:n*(p.y-s[i].y)}));}
 const angleDelta=(from,to)=>((to-from+180)%360+360)%360-180;
 const wrapAngle=a=>((a+180)%360+360)%360-180;
 function route({start,left,right,groups,endY,corridors=[left,right,left],intro=left,mobile=false,width=0,hullRadius=22}){
  const segments=[];let current=start;
  const add=(end,c1,c2)=>{segments.push([current,c1,c2,end]);current=end;};
  const entryEnd={x:intro,y:Math.max(start.y+36,groups[0].top-38)};
  // Linear vertical progress and quintic lateral easing: zero curvature at both joins.
  const entryDy=entryEnd.y-start.y;
  segments.push([start,{x:start.x,y:start.y+entryDy/5},{x:start.x,y:start.y+entryDy*2/5},{x:intro,y:start.y+entryDy*3/5},{x:intro,y:start.y+entryDy*4/5},entryEnd]);current=entryEnd;
  const vertical=(x,y)=>{const dy=y-current.y;add({x,y},{x:current.x,y:current.y+dy/3},{x,y:y-dy/3});};
  const cross=(x,y)=>{const dy=y-current.y,end={x,y};segments.push([current,{x:current.x,y:current.y+dy/5},{x:current.x,y:current.y+dy*2/5},{x,y:current.y+dy*3/5},{x,y:current.y+dy*4/5},end]);current=end;};
  vertical(intro,groups[0].bottom+38);
  cross(corridors[0],groups[1].top-38);
  vertical(corridors[0],groups[1].bottom+38);
  cross(corridors[1],groups[2].top-38);
  vertical(corridors[1],groups[2].bottom+38);
  for(const [previous,next,to] of [[2,3,corridors[2]],[3,4,corridors[3]]]){
   const targetY=groups[next].top-38,dy=targetY-current.y;
   if(dy<40)throw Error('Insufficient empty corridor between detail panels');
   if(mobile)vertical(to,targetY);else cross(to,targetY);
   vertical(to,groups[next].bottom+38);
  }
  // Turn only below the last content rectangles, in the existing empty band.
  const exitSegment=segments.length,exitStart={...current},bend=Math.max(8,Math.min(mobile?42:68,endY-current.y));
  const corner={x:current.x-bend,y:current.y+bend};
  segments.push([current,{x:current.x,y:current.y+bend*.2},{x:current.x,y:current.y+bend*.4},{x:corner.x+bend*.4,y:corner.y},{x:corner.x+bend*.2,y:corner.y},corner]);current=corner;
  const outside={x:-hullRadius-22,y:current.y},exitDx=outside.x-current.x;
  add(outside,{x:current.x+exitDx/3,y:current.y},{x:current.x+exitDx*2/3,y:current.y});
  const points=[];let distance=0,last=null;
  let exitDistance=0;
  for(let i=0;i<segments.length;i++)for(let j=i?1:0;j<=180;j++){
   if(i===exitSegment&&j===1)exitDistance=distance;
   const s=segments[i],t=j/180,p=cubic(s,t),d=cubic(derivative(s),t),dd=cubic(derivative(derivative(s)),t),norm=Math.hypot(d.x,d.y);
   if(last)distance+=Math.hypot(p.x-last.x,p.y-last.y);points.push({...p,distance,tx:d.x/Math.max(.001,norm),ty:d.y/Math.max(.001,norm),curvature:Math.abs(d.x*dd.y-d.y*dd.x)/Math.max(.001,norm**3)*180/Math.PI,segment:i});last=p;
  }
  return {segments,points,length:distance,exit:{start:exitStart,distance:exitDistance,bend}};
 }
 function atDistance(path,distance){const ps=path.points;distance=clamp(distance,0,path.length);let lo=0,hi=ps.length-1;while(lo<hi){const mid=(lo+hi)>>1;if(ps[mid].distance<distance)lo=mid+1;else hi=mid;}const b=ps[lo],a=ps[Math.max(0,lo-1)],t=(distance-a.distance)/Math.max(.001,b.distance-a.distance);return {x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,dx:a.tx+(b.tx-a.tx)*t,dy:a.ty+(b.ty-a.ty)*t,curvature:a.curvature+(b.curvature-a.curvature)*t};}
 function distanceAtY(path,y){const ps=path.points;let lo=0,hi=ps.length-1;while(lo<hi){const mid=(lo+hi)>>1;if(ps[mid].y<y)lo=mid+1;else hi=mid;}const b=ps[lo],a=ps[Math.max(0,lo-1)],t=clamp((y-a.y)/Math.max(.001,b.y-a.y),0,1);return a.distance+(b.distance-a.distance)*t;}
 if(typeof module!=='undefined'&&module.exports){module.exports={route,atDistance,distanceAtY,angleDelta,wrapAngle};return;}
 const services=document.getElementById('servicos'),process=document.getElementById('processo'),launch=document.querySelector('.hero .lunula-launch-art'),reduce=matchMedia('(prefers-reduced-motion:reduce)');
 const ns='http://www.w3.org/2000/svg';const overlay=document.createElementNS(ns,'svg');overlay.id='journey-ship';overlay.setAttribute('aria-hidden','true');const ship=document.createElementNS(ns,'g'),image=document.createElementNS(ns,'image'),thrust=document.createElementNS(ns,'g');thrust.setAttribute('fill','#b3d6d7');thrust.setAttribute('opacity','0');for(const radius of [1.1,.8,.5]){const dot=document.createElementNS(ns,'circle');dot.setAttribute('r',radius);thrust.append(dot);}image.setAttribute('href','assets/nave-lunula-20260926.svg');ship.append(thrust,image);overlay.append(ship);document.body.append(overlay);
 // Verified whole artwork: long lower tip (60,148) is the nose; rear is above.
 // Rotation 0 preserves the original Hero artwork. Rotated forward is (-sin(a),cos(a)).
 let geometry=null,dirty=true,frame=0,arc=0,velocity=0,lastTime=0,angle=0,turnVelocity=0,travelDirection=1,scrollDirection=1,previousScroll=scrollY,hidden=true,lastWorld=null;
 const obstacleSelectors=['.mission-copy','.mission-map','.portfolio-copy','.portfolio-visual','#apps .service-copy','#apps .service-visual','#sites .service-copy','#sites .service-visual','#ti .service-copy','#ti .service-visual'];
 function bounds(element){const r=element.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top+scrollY,bottom:r.bottom+scrollY,width:r.width,height:r.height};}
 function measure(){
  const w=document.documentElement.clientWidth,h=innerHeight,mobile=w<=960,r=bounds(launch),obstacles=obstacleSelectors.map(s=>bounds(document.querySelector(s)));
  const groups=[[0,1],[2,3],[4,5],[6,7],[8,9]].map(indices=>({top:Math.min(...indices.map(i=>obstacles[i].top)),bottom:Math.max(...indices.map(i=>obstacles[i].bottom))}));
  const minLeft=Math.min(...obstacles.map(r=>r.left)),maxRight=Math.max(...obstacles.map(r=>r.right));
  // Actual SVG hull fits within 22px at width 36, including its stroke.
  const compact=w<=1150,hullRadius=compact?15:22;
  const left=mobile?20:Math.max(hullRadius,Math.min(50,minLeft-hullRadius-5)),right=mobile?w-20:Math.min(w-hullRadius,Math.max(w-50,maxRight+hullRadius+5));
  const processTop=bounds(process).top,start={x:(r.left+r.right)/2,y:(r.top+r.bottom)/2};
  const gap=(a,b)=>{const rs=[a,b].sort((a,b)=>a.left-b.left);return rs[1].left-rs[0].right>=hullRadius*2+4?(rs[0].right+rs[1].left)/2:left;};
  const intro=mobile?left:gap(obstacles[0],obstacles[1]),corridors=[[2,3],[4,5],[6,7],[8,9]].map(([a,b])=>mobile?left:gap(obstacles[a],obstacles[b]));
  const path=route({start,left,right,groups,endY:processTop-hullRadius-8,intro,corridors,mobile,width:w,hullRadius});
  if(geometry){const old=geometry.path;if(arc>=old.exit.distance){const progress=clamp((arc-old.exit.distance)/(old.length-old.exit.distance),0,1);arc=path.exit.distance+progress*(path.length-path.exit.distance);}else arc=distanceAtY(path,atDistance(old,arc).y);}
  geometry={w,h,mobile,obstacles,groups,left,right,start,processTop,path,intro,corridors,hullRadius,shipWidth:compact?22:36};lastWorld=null;overlay.setAttribute('viewBox',`0 0 ${w} ${h}`);const hull=compact?22:36;image.setAttribute('x',-hull/2);image.setAttribute('y',-hull*2/3);image.setAttribute('width',hull);image.setAttribute('height',hull*4/3);[...thrust.children].forEach((dot,i)=>dot.setAttribute('cy',-hull*(.72+i*.12)));
  dispatchEvent(new Event('kirmoon-journey-geometry'));
  arc=clamp(arc,0,path.length);dirty=false;
 }
 function tick(time){
  frame=0;if(document.hidden||document.body.classList.contains('menu-open')){lastTime=0;return;}if(dirty||!geometry)measure();const g=geometry,dt=Math.min(.05,Math.max(.001,(time-(lastTime||time))/1000));lastTime=time;
  const normalTarget=Math.min(g.path.exit.distance,distanceAtY(g.path,Math.max(g.start.y,scrollY+g.h*.62)));
  if(Math.abs(scrollY-previousScroll)>.5)scrollDirection=Math.sign(scrollY-previousScroll);previousScroll=scrollY;
  const returning=scrollDirection<0;
  const exitBegin=g.path.exit.start.y-g.h*(returning?.15:.24),exitEnd=returning?g.path.exit.start.y+g.h*.15:g.processTop-g.h*.12;
  const exitProgress=clamp((scrollY+g.h-exitBegin)/Math.max(40,exitEnd-exitBegin),0,1),exitEase=exitProgress**3*(exitProgress*(exitProgress*6-15)+10);
  const target=normalTarget+(g.path.length-normalTarget)*exitEase;
  // A completed long jump to Home can hand off an offscreen ship immediately.
  // Nearby, visible returns still follow the full approach and turn at the dock.
  const recoverPoint=atDistance(g.path,arc),recoverAngle=angle*Math.PI/180;
  const recoverCorners=[[-g.shipWidth/2,-g.shipWidth*.96-1],[g.shipWidth/2,-g.shipWidth*.96-1],[-g.shipWidth/2,g.shipWidth*2/3],[g.shipWidth/2,g.shipWidth*2/3]].map(([u,v])=>({x:recoverPoint.x+Math.cos(recoverAngle)*u-Math.sin(recoverAngle)*v,y:recoverPoint.y-scrollY+Math.sin(recoverAngle)*u+Math.cos(recoverAngle)*v}));
  const fullyOffscreen=Math.min(...recoverCorners.map(p=>p.y))>g.h||Math.max(...recoverCorners.map(p=>p.y))<0||Math.max(...recoverCorners.map(p=>p.x))<0;
  if(target<.01&&scrollY<.5&&fullyOffscreen){arc=0;velocity=0;angle=0;turnVelocity=0;travelDirection=1;lastWorld=null;}
  // Finish the approach facing its real direction, then turn at the dock before hand-off.
  const docking=target<.01&&arc<.02;if(docking){arc=target;velocity=0;}
  const difference=target-arc;
  const before=atDistance(g.path,arc),direction=Math.abs(difference)>.1?Math.sign(difference):travelDirection;
  const beforeScreenY=before.y-scrollY,offscreen=beforeScreenY<105||beforeScreenY>g.h+60;
  const desiredAngle=docking?0:Math.atan2(-before.dx*direction,before.dy*direction)*180/Math.PI;
  const previousAngle=angle;
  // Turns in place are reserved for a deliberate reversal and the Hero dock.
  // During travel, the same analytical tangent drives position and orientation.
  const reversing=direction!==travelDirection&&Math.abs(difference)>.1;
  if(reversing||docking){
   let error=angleDelta(angle,desiredAngle);if(Math.abs(error)>179.5&&Math.abs(turnVelocity)>1)error=Math.sign(turnVelocity)*Math.abs(error);
   const turnCap=offscreen?720:220,turnAcceleration=offscreen?3600:900,wanted=clamp(error/(offscreen?.025:.07),-turnCap,turnCap);
   turnVelocity+=clamp(wanted-turnVelocity,-turnAcceleration*dt,turnAcceleration*dt);
   let turn=turnVelocity*dt;
   if(Math.sign(turn)!==Math.sign(error)){turn=0;turnVelocity=0;}
   if(Math.sign(turn)===Math.sign(error)&&Math.abs(turn)>Math.abs(error)){turn=error;turnVelocity=0;}
   angle+=turn;
   velocity=0;if(!docking&&Math.abs(angleDelta(angle,desiredAngle))<.05){travelDirection=direction;angle+=angleDelta(angle,desiredAngle);turnVelocity=0;}
  }else turnVelocity=0;
  const alignment=Math.max(0,Math.cos(angleDelta(angle,desiredAngle)*Math.PI/180));
  // Anticipate curvature before reaching it; straight corridors keep their normal speed.
  const baseSpeed=offscreen?2600:g.mobile?700:1100,curveRate=190,acceleration=6500;
  let curvature=0,curveSpeed=baseSpeed;for(let offset=0;offset<=98;offset+=14){const k=atDistance(g.path,arc+direction*offset).curvature;curvature=Math.max(curvature,k);if(k>.015)curveSpeed=Math.min(curveSpeed,Math.sqrt((curveRate/k)**2+2*acceleration*offset));}
  const maxSpeed=offscreen?baseSpeed:curveSpeed,departing=direction>0&&exitProgress>=1&&arc>=g.path.exit.distance;
  // Continue through the border at cruising speed; brake only after the full craft is out.
  const desired=departing?maxSpeed:clamp(difference/.12,-maxSpeed,maxSpeed);
  if(!reversing&&!docking){velocity+=clamp(desired-velocity,-acceleration*dt,acceleration*dt);velocity=clamp(velocity,-maxSpeed,maxSpeed);}else velocity=0;
  if(Math.sign(velocity)!==direction)velocity=0;
  let step=velocity*dt;
  if(Math.abs(step)>Math.abs(difference))step=difference;
  if(Math.abs(difference)<.1&&!reversing&&!docking)step=difference;
  let predicted=atDistance(g.path,arc+step),nextAngle=Math.atan2(-predicted.dx*direction,predicted.dy*direction)*180/Math.PI;
  const headingRate=offscreen?720:220;
  for(let i=0;i<10&&Math.abs(step)>.0001&&Math.abs(angleDelta(angle,nextAngle))>headingRate*dt;i++){step*=.5;predicted=atDistance(g.path,arc+step);nextAngle=Math.atan2(-predicted.dx*direction,predicted.dy*direction)*180/Math.PI;}
  if(Math.abs(angleDelta(angle,nextAngle))>headingRate*dt&&!reversing&&!docking){step=0;velocity=0;predicted=before;}
  if(Math.abs(step)>.0001&&!reversing&&!docking)angle+=angleDelta(angle,nextAngle);
  const radians=angle*Math.PI/180;
  if(-Math.sin(radians)*(predicted.x-before.x)+Math.cos(radians)*(predicted.y-before.y)<-.00001){step=0;velocity=0;}
  if(Math.abs(step)>=Math.abs(difference)&&Math.sign(step)===Math.sign(difference)){arc=target;velocity=0;}else arc=clamp(arc+step,0,g.path.length);
  const p=atDistance(g.path,arc),exit=exitProgress;
  const movement=lastWorld?{x:p.x-lastWorld.x,y:p.y-lastWorld.y}:{x:0,y:0};lastWorld={x:p.x,y:p.y};
  const angularVelocity=(angle-previousAngle)/dt;
  const dockingTurn=docking&&Math.abs(angleDelta(angle,0))>.05;
  const launched=arc>.02||Math.abs(difference)>.01||dockingTurn;
  const screenY=p.y-scrollY,x=p.x,r=angle*Math.PI/180,c=Math.cos(r),s=Math.sin(r),corners=[[-g.shipWidth/2,-g.shipWidth*.96-1],[g.shipWidth/2,-g.shipWidth*.96-1],[-g.shipWidth/2,g.shipWidth*2/3],[g.shipWidth/2,g.shipWidth*2/3]].map(([u,v])=>({x:x+c*u-s*v,y:screenY+s*u+c*v}));
  const box={left:Math.min(...corners.map(p=>p.x)),right:Math.max(...corners.map(p=>p.x)),top:Math.min(...corners.map(p=>p.y)),bottom:Math.max(...corners.map(p=>p.y))};
  const shouldHide=reduce.matches||!launched||box.right<-.5||screenY<105||screenY>g.h+60;
  overlay.style.display=shouldHide?'none':'block';overlay.style.opacity='1';document.documentElement.classList.toggle('journey-v3-active',launched&&!reduce.matches);
  thrust.setAttribute('opacity',shouldHide?'0':String(clamp(Math.abs(velocity)/400,0,.32)));ship.setAttribute('transform',`translate(${x.toFixed(2)} ${screenY.toFixed(2)}) rotate(${angle.toFixed(2)})`);
  hidden=shouldHide;window.KirmoonJourneyReview.state={time,dt,arc,target,velocity,world:{x:p.x,y:p.y},screen:{x,y:screenY},box,angle,angularVelocity,desiredAngle,alignment,movement,hidden,exit,curvature,maxSpeed};
  if(Math.abs(difference)>.01||Math.abs(velocity)>1||dockingTurn)queue();else lastTime=0;
 }
 function queue(){const r=services.getBoundingClientRect();document.body.classList.toggle('journey-services',r.top<innerHeight&&r.bottom>100);if(!frame&&!document.hidden){if(!lastTime)lastTime=performance.now();frame=requestAnimationFrame(tick);}}
 function resize(){dirty=true;queue();}
 window.KirmoonJourneyReview={state:null,getGeometry:()=>geometry,sample:(y)=>{if(dirty||!geometry)measure();const g=geometry;return atDistance(g.path,distanceAtY(g.path,Math.max(g.start.y,y+g.h*.62)));}};
 // The original chapter controller owns wheel and scene transitions.
 // Flight only observes scrolling; it never prevents input or writes page scroll.
 addEventListener('scroll',queue,{passive:true});addEventListener('resize',resize,{passive:true});document.fonts?.ready.then(resize);new ResizeObserver(resize).observe(services);reduce.addEventListener('change',queue);document.addEventListener('visibilitychange',()=>{lastTime=0;queue();});queue();
 let menuWasOpen=document.body.classList.contains('menu-open');new MutationObserver(()=>{const open=document.body.classList.contains('menu-open');if(menuWasOpen&&!open)resize();menuWasOpen=open;}).observe(document.body,{attributes:true,attributeFilter:['class']});
})(typeof window==='undefined'?globalThis:window);

