/* Lúnula: scroll-driven ship; service planets stay in their own sections. */
(function (scope) {
  'use strict';
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const ease = t => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
  // A short, smooth acceleration at either end and a constant-speed cruise.
  // The old seventh-degree curve doubled the ship's speed at mid-crossing.
  function cruise(t) {
    const ramp=.14,gain=1/(1-2*ramp+4*ramp/Math.PI);
    if(t<ramp){
      const theta=Math.PI*t/(2*ramp);
      return {position:gain*2*ramp/Math.PI*(1-Math.cos(theta)),velocity:gain*Math.sin(theta),acceleration:gain*Math.PI/(2*ramp)*Math.cos(theta)};
    }
    if(t>1-ramp){
      const theta=Math.PI*(1-t)/(2*ramp);
      return {position:1-gain*2*ramp/Math.PI*(1-Math.cos(theta)),velocity:gain*Math.sin(theta),acceleration:-gain*Math.PI/(2*ramp)*Math.cos(theta)};
    }
    return {position:gain*(2*ramp/Math.PI+t-ramp),velocity:gain,acceleration:0};
  }
  function trackPosition(points, scroll) {
    const i = Math.max(1, points.findIndex(p=>p.scroll>=scroll));
    const a=points[i-1],b=points[i],t=clamp((scroll-a.scroll)/(b.scroll-a.scroll),0,1);
    const distance=b.scroll-a.scroll;
    const horizontal=cruise(t);
    const xDelta=b.x-a.x,screenStart=a.y-a.scroll,screenDelta=(b.y-b.scroll)-screenStart;
    const dx=xDelta*horizontal.velocity/distance;
    const dy=1+screenDelta*horizontal.velocity/distance;
    const angle=-Math.atan2(dx,dy);
    return {x:a.x+xDelta*horizontal.position,y:screenStart+screenDelta*horizontal.position,angle:angle*180/Math.PI};
  }
  function makeDesktopTrack({height:h,rail,planets,bounds,offset=0,exitEnd,entryWorldY=h*1.12}) {
    const track=[{scroll:h*.64,x:rail,y:entryWorldY},{scroll:planets[0].y-h*.64,x:rail,y:planets[0].y}];
    // Cross only the empty horizontal bands between the content blocks.
    // Let the band travel through the viewport during the crossing, rather
    // than cutting through a paragraph to hold a fixed screen height.
    for(let i=0;i<2;i++){
      const fromY=Math.max(...bounds[i].map(b=>b.bottom))+offset+34;
      const toY=Math.min(...bounds[i+1].map(b=>b.top))+offset-34;
      const screenStart=h*(i===0?.80:.72),screenEnd=h*(i===0?.40:.43);
      track.push({scroll:fromY-screenStart,x:planets[i].x,y:fromY});
      track.push({scroll:toY-screenEnd,x:planets[i+1].x,y:toY});
    }
    const exitStart=exitEnd-Math.max(90,h*.12);
    track.push({scroll:exitStart,x:planets[2].x,y:exitStart+h*.57});
    return {track,exitStart};
  }
  function flight(layout, scroll) {
    const {height:h, start, rail, planets, exitStart, exitEnd, mobile} = layout;
    if (scroll >= exitEnd) return {hidden:true};
    const enterDistance = Math.max(1,h*.64);
    const enter = ease(scroll / enterDistance);
    const entryWorldY=layout.entryWorldY??h*1.12;
    let y = start.y + (entryWorldY-start.y)*enter-scroll;
    if(scroll>enterDistance){
      const settled=ease((scroll-enterDistance)/Math.max(1,planets[0].y-h*.64-enterDistance));
      y=entryWorldY-enterDistance+(h*.64-(entryWorldY-enterDistance))*settled;
    }
    const worldY = scroll + y;
    // One shallow, continuous curve between stops, crossing each planet centre.
    const next = Math.max(1, planets.findIndex(p=>p.y>=worldY));
    const segment = worldY>planets[planets.length-1].y ? planets.length-1 : next;
    const phase = (worldY-planets[segment-1].y)/(planets[segment].y-planets[segment-1].y);
    const wave = !mobile&&layout.track ? 0 : Math.sin(phase*Math.PI*2) * (mobile ? 3 : 6);
    const lateralDistance=enterDistance,lateral=cruise(clamp(scroll/lateralDistance,0,1)).position;
    let x = start.x + (rail + wave - start.x)*lateral;
    let angle = 34*Math.sin(Math.PI*clamp(scroll/lateralDistance,0,1));
    if(!mobile&&layout.track&&scroll>=enterDistance){
      const p=trackPosition(layout.track,Math.min(scroll,exitStart));x=p.x;y=p.y;angle=p.angle;
    }
    const exit = ease((scroll-exitStart)/Math.max(1,exitEnd-exitStart));
    if(exit>0){
      // Leave downwards in a continuous outward arc, starting with zero turn.
      const origin=mobile?{x:rail+Math.sin(((exitStart+h*.64-planets[1].y)/(planets[2].y-planets[1].y))*Math.PI*2)*3,y:h*.64}:layout.track?trackPosition(layout.track,exitStart):{x:rail,y:h*.64};
      const direction=mobile?-1:1,target=mobile?-70:layout.width+70;
      const distance=Math.abs(target-origin.x),drop=mobile?h*.12:h*.1;
      x=origin.x+direction*distance*exit*exit;
      y=origin.y+drop*(exit-.3*exit*exit);
      if(mobile)angle=-direction*Math.atan2(2*distance*exit,drop*(1-.6*exit))*180/Math.PI;
      else {
        const turn=-Math.PI/4*exit;
        x+=20.4*Math.sin(turn);y+=20.4*(1-Math.cos(turn));angle=turn*180/Math.PI;
      }
    }
    return {hidden:false,x,y,angle,opacity:1};
  }
  if(typeof module!=='undefined'&&module.exports){module.exports={flight,makeDesktopTrack};return;}
  const hero=document.getElementById('inicio'), services=document.getElementById('servicos'), process=document.getElementById('processo');
  const launch=hero?.querySelector('.scroll-rocket');
  const sections=['apps','sites','ti'].map(id=>document.getElementById(id));
  if(!hero||!services||!process||!launch||sections.some(s=>!s))return;
  const motion=matchMedia('(prefers-reduced-motion: reduce)');
  const svgNS='http://www.w3.org/2000/svg';
  const overlay=document.createElementNS(svgNS,'svg');overlay.id='lunula-journey';overlay.setAttribute('aria-hidden','true');overlay.setAttribute('focusable','false');
  overlay.innerHTML='<g class="lunula-flight"><g class="lunula-trail"><circle cx="0" cy="-28" r="1.4"/><circle cx="0" cy="-35" r="1"/><circle cx="0" cy="-42" r=".6"/></g><image href="assets/nave-lunula-20260926.svg"/></g>';
  const ship=overlay.querySelector('.lunula-flight'),image=ship.querySelector('image'),trail=ship.querySelector('.lunula-trail');
  const planetArt=sections.map(section=>({world:section.querySelector('.lunula-world'),photo:section.querySelector('.lunula-world img')}));
  services.appendChild(overlay);
  let layout=null,frame=0,dirty=true,lastScroll=scrollY,trailTimer=0,activeFrames=0;
  function measure(){
    const h=innerHeight,w=document.documentElement.clientWidth,mobile=w<=960;
    const scroll=scrollY,b=launch.getBoundingClientRect();
    const missionHeading=services.querySelector('.mission-copy h2');
    const entryWorldY=Math.min(h*1.12,missionHeading?missionHeading.getBoundingClientRect().top+scroll-40:h*1.12);
    const left=Math.min(...sections.map(s=>Math.min(s.querySelector('.service-copy').getBoundingClientRect().left,s.querySelector('.service-visual').getBoundingClientRect().left)));
    const rail=mobile?22:clamp(left/2,28,60),radius=mobile?17:Math.min(24,rail-3);
    const planets=sections.map(s=>({y:s.getBoundingClientRect().top+scroll+(mobile?54:78),x:rail,r:radius}));
    const processTop=process.getBoundingClientRect().top+scroll;
    const exitEnd=processTop-h-(mobile?12:4);
    let exitStart=Math.min(exitEnd-100,Math.max(exitEnd-260,planets[2].y-h*.64+60)),track=null;
    if(!mobile){
      const bounds=sections.map(s=>['.service-copy','.service-visual'].map(q=>s.querySelector(q).getBoundingClientRect()));
      const middle=bounds[1].slice().sort((a,b)=>a.left-b.left);
      const gap=middle[1].left-middle[0].right;
      // A slight right bias leaves room for the hull while its bow turns right.
      planets[1].x=(middle[0].right+middle[1].left)/2+Math.min(10,Math.max(0,gap)*.12);planets[2].x=w-rail;
      planets[1].y=sections[1].querySelector('h2').getBoundingClientRect().top+scroll+20;
      ({track,exitStart}=makeDesktopTrack({height:h,rail,planets,bounds,offset:scroll,exitEnd,entryWorldY}));
    }
    const visualPlanets=planets.map((p,i)=>{
      if(mobile){
        const specs=w<=360
          ?[{x:43,r:42,y:54},{x:53,r:52,y:98},{x:w-65,r:64,y:119}]
          :[{x:49,r:48,y:54},{x:60,r:59,y:98},{x:w-80,r:78,y:119}];
        return {x:specs[i].x,y:sections[i].getBoundingClientRect().top+scroll+specs[i].y,r:specs[i].r};
      }
      if(i===0){
        const heading=sections[i].querySelector('h2').getBoundingClientRect();
        return {x:76,y:heading.top+scroll-94,r:60};
      }
      if(i===1){
        const heading=sections[i].querySelector('h2').getBoundingClientRect();
        return {x:w-90,y:heading.top+scroll-115,r:86};
      }
      if(i===2){
        const copy=sections[i].querySelector('.service-copy').getBoundingClientRect();
        const visual=sections[i].querySelector('.service-visual').getBoundingClientRect();
        const gap=Math.max(0,visual.left-copy.right);
        return {x:(copy.right+visual.left)/2,y:copy.top+scroll+94,r:Math.max(18,Math.min(70,gap/2-10))};
      }
    });
    layout={width:w,height:h,start:{x:b.left+b.width/2,y:b.top+scroll+b.height/2},entryWorldY,rail,planets,visualPlanets,track,exitStart,exitEnd,servicesEnd:processTop,mobile};

    overlay.setAttribute('viewBox',`0 0 ${w} ${h}`);
    const width=mobile?27:36;image.setAttribute('x',-width/2);image.setAttribute('y',-width*2/3);image.setAttribute('width',width);image.setAttribute('height',width*4/3);
    [...trail.children].forEach((dot,i)=>dot.setAttribute('cy',mobile?[-20,-25,-30][i]:[-28,-35,-42][i]));
    visualPlanets.forEach((p,i)=>{
      const sectionBox=sections[i].getBoundingClientRect(),art=planetArt[i].world;
      if(mobile&&i===2)return;
      art.style.left=`${(p.x-p.r-sectionBox.left).toFixed(2)}px`;
      art.style.top=`${(p.y-p.r-scroll-sectionBox.top).toFixed(2)}px`;
      art.style.width=`${(p.r*2).toFixed(2)}px`;
    });
    dirty=false;
  }
  function paint(){
    frame=0;
    if(document.hidden){trail.classList.remove('is-active');clearTimeout(trailTimer);return;}
    if(dirty||!layout)measure();
    const y=scrollY;
    if(motion.matches){overlay.style.display='none';trail.classList.remove('is-active');clearTimeout(trailTimer);document.documentElement.classList.remove('lunula-active');return;}
    const state=flight(layout,y);

    if(y!==lastScroll)activeFrames=12;
    if(y>lastScroll+.5&&!state.hidden){
      trail.classList.add('is-active');clearTimeout(trailTimer);
      trailTimer=setTimeout(()=>trail.classList.remove('is-active'),140);
    }else if(y<lastScroll-.5){trail.classList.remove('is-active');clearTimeout(trailTimer);}
    lastScroll=y;
    // Only the ship follows the viewport. The worlds scroll with their sections.
    overlay.style.display=y>=layout.servicesEnd?'none':'block';
    ship.style.display=state.hidden?'none':'block';
    if(!state.hidden){
      ship.setAttribute('transform',`translate(${state.x.toFixed(2)} ${state.y.toFixed(2)}) rotate(${state.angle.toFixed(2)})`);
      ship.setAttribute('opacity','1');
    }
    document.documentElement.classList.add('lunula-active');
    if(activeFrames>0){activeFrames--;queue();}
  }
  function queue(){if(!frame&&!document.hidden)frame=requestAnimationFrame(paint);}
  function wake(){activeFrames=12;queue();}
  function resize(){dirty=true;queue();}
  addEventListener('scroll',wake,{passive:true});addEventListener('resize',resize,{passive:true});
  ['wheel','touchmove','keydown'].forEach(event=>addEventListener(event,wake,{passive:true}));
  document.addEventListener('visibilitychange',()=>{
    lastScroll=scrollY;
    if(document.hidden){trail.classList.remove('is-active');clearTimeout(trailTimer);if(frame){cancelAnimationFrame(frame);frame=0;}}
    else queue();
  });
  motion.addEventListener('change',resize);
  new ResizeObserver(resize).observe(services);new ResizeObserver(resize).observe(hero);
  document.fonts?.ready.then(resize);queue();
})(typeof window!=='undefined'?window:this);
