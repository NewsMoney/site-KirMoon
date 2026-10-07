(() => {
  const definitions = [
    {section:'apps',name:'Mercúrio',map:'mercury-map-messenger-20260927.webp',yaw:.55},
    {section:'sites',name:'Marte',map:'mars-map-viking-20260927.webp',yaw:-.42},
    {section:'ti',name:'Vênus',map:'venus-map-magellan-20260927.webp',yaw:.38}
  ];
  const mobile = matchMedia('(max-width:960px)');
  const reduce = matchMedia('(prefers-reduced-motion:reduce)');
  const variants=definitions.flatMap((def,i)=>[{...def,selector:`#${def.section} .lunula-world`},{...def,preview:true,selector:`.mission-waypoint[data-mission-index="${i}"] .journey-globe`}]);
  const states = variants.map(def => {
    const host = document.querySelector(def.selector);
    if (!host) return null;
    host.removeAttribute('aria-hidden');
    host.setAttribute('role',def.preview?'img':'button');
    if(!def.preview)host.setAttribute('tabindex','0');
    host.setAttribute('aria-label',`${def.name}: ative o globo 3D e arraste para girar. Use as setas do teclado para explorar.`);
    host.dataset.planetRenderer='photo';
    const canvas=document.createElement('canvas');
    canvas.className='lunula-world-canvas';
    canvas.setAttribute('aria-hidden','true');
    host.appendChild(canvas);
    return {def,host,canvas,visible:false,ready:false,loading:null,failed:false,down:null,raf:0,pendingX:0,pendingY:0,
      renderer:null,scene:null,camera:null,mesh:null,width:0,height:0};
  }).filter(Boolean);
  if(!states.length)return;
  window.KirmoonPlanetReview=()=>states.map(s=>({selector:s.def.selector,ready:s.ready,yaw:s.mesh?.rotation.y,dragging:!!s.down?.dragging,visible:s.visible}));

  let preparation=Promise.resolve();
  function warm(state){if(state.queued||state.ready||state.failed)return;state.queued=true;preparation=preparation.then(()=>new Promise(r=>setTimeout(r,120))).then(()=>activate(state));}
  function spin(state,time=performance.now()){
    if(!state.visible||!state.ready||document.hidden||reduce.matches){state.autoTimer=0;return;}
    const dt=Math.min(100,time-(state.lastSpin||time));state.lastSpin=time;
    if(!state.down)state.mesh.rotation.y+=dt*.000035;
    render(state);state.autoTimer=setTimeout(()=>spin(state),70);
  }
  function render(state,force=false){
    if(!state.ready||document.hidden||(!state.visible&&!force))return;
    const w=Math.max(2,Math.round(state.host.clientWidth));
    const h=Math.max(2,Math.round(state.host.clientHeight));
    if(w!==state.width||h!==state.height){
      state.width=w;state.height=h;
      state.renderer.setSize(w,h,false);
      state.camera.aspect=w/h;
      state.camera.updateProjectionMatrix();
    }
    state.renderer.render(state.scene,state.camera);
  }
  function schedule(state){
    if(state.raf||!state.ready||!state.visible||document.hidden)return;
    state.raf=requestAnimationFrame(()=>{state.raf=0;render(state);});
  }
  async function activate(state){
    if(state.ready||state.failed)return;
    if(state.loading)return state.loading;
    state.host.setAttribute('aria-busy','true');
    state.host.dataset.planetRenderer='loading';
    state.loading=(async()=>{
      const THREE=await window.kmLoadThree();
      const texture=await new Promise((resolve,reject)=>{
        new THREE.TextureLoader().load(`assets/${state.def.map}`,resolve,undefined,reject);
      });
      texture.encoding=THREE.sRGBEncoding;
      const renderer=new THREE.WebGLRenderer({canvas:state.canvas,alpha:true,antialias:true,powerPreference:'low-power'});
      renderer.setClearColor(0x000000,0);
      renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));
      renderer.outputEncoding=THREE.sRGBEncoding;
      const scene=new THREE.Scene();
      const camera=new THREE.PerspectiveCamera(35,1,.1,10);
      camera.position.z=3.55;
      const mesh=new THREE.Mesh(
        new THREE.SphereGeometry(1,52,40),
        new THREE.MeshStandardMaterial({map:texture,roughness:1,metalness:0})
      );
      mesh.rotation.y=state.def.yaw;
      scene.add(mesh);
      const key=new THREE.DirectionalLight(0xfff3e7,1.3);
      key.position.set(-3,2.8,4);
      scene.add(key);
      scene.add(new THREE.AmbientLight(0xb8c5d1,.68));
      const rim=new THREE.DirectionalLight(0x9abbd6,.38);
      rim.position.set(3,-1,-2);
      scene.add(rim);
      state.renderer=renderer;state.scene=scene;state.camera=camera;state.mesh=mesh;state.ready=true;
      mesh.rotation.y+=state.pendingX*.009;
      mesh.rotation.x=Math.max(-.7,Math.min(.7,mesh.rotation.x+state.pendingY*.006));
      state.pendingX=state.pendingY=0;
      render(state,true); // Populate the transparent canvas before revealing it.
      state.host.classList.add('is-3d');if(state.visible&&!state.autoTimer)spin(state);
      state.host.dataset.planetRenderer='webgl';
      state.host.setAttribute('aria-label',state.def.preview?`${state.def.name} em 3D. Arraste para girar.`:`${state.def.name} em 3D. Arraste para girar ou use as setas do teclado.`);
    })().catch(()=>{
      state.mesh?.geometry?.dispose();
      state.mesh?.material?.map?.dispose();
      state.mesh?.material?.dispose();
      state.renderer?.dispose();
      state.ready=false;
      state.failed=true;
      state.host.dataset.planetRenderer='photo';
      state.host.classList.add('is-3d-unavailable');
      state.host.setAttribute('role','img');
      state.host.removeAttribute('tabindex');
      state.host.setAttribute('aria-label',`${state.def.name}, imagem estática.`);
    }).finally(()=>{
      state.host.removeAttribute('aria-busy');
      state.loading=null;
    });
    return state.loading;
  }

  states.forEach(state=>{
    const {host}=state;
    new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting))warm(state);},{rootMargin:'100% 0px'}).observe(host);
    if(state.def.preview){host.style.pointerEvents='auto';}
    host.addEventListener('dragstart',event=>event.preventDefault());
    host.addEventListener('pointerdown',event=>{
      if(event.pointerType==='mouse'&&event.button!==0)return;
      if(state.failed)return;
      if(event.pointerType==='mouse')event.preventDefault();
      state.down={id:event.pointerId,x:event.clientX,y:event.clientY,dragging:false};
      if(!state.ready)activate(state);
    });
    // A completed tap activates mobile 3D; merely starting a page swipe does not.
    host.addEventListener('click',event=>{if(state.didDrag){event.preventDefault();event.stopPropagation();state.didDrag=false;}if(!state.ready)activate(state);});
    host.addEventListener('pointermove',event=>{
      const down=state.down;
      if(!down||down.id!==event.pointerId)return;
      const dx=event.clientX-down.x,dy=event.clientY-down.y;
      if(!down.dragging){
        if(Math.hypot(dx,dy)<4)return;
        if(event.pointerType==='touch'&&Math.abs(dy)>Math.abs(dx)*1.2){state.down=null;return;}
        down.dragging=true;state.didDrag=true;
        host.classList.add('is-dragging');
        host.setPointerCapture(event.pointerId);
      }
      if(event.cancelable)event.preventDefault();
      if(state.ready){
        state.mesh.rotation.y+=dx*.009;
        state.mesh.rotation.x=Math.max(-.7,Math.min(.7,state.mesh.rotation.x+dy*.006));
      }else{
        state.pendingX+=dx;
        state.pendingY+=dy;
      }
      down.x=event.clientX;down.y=event.clientY;
      schedule(state);
    });
    const stop=event=>{
      if(state.down?.id!==event.pointerId)return;
      state.down=null;
      host.classList.remove('is-dragging');
      if(host.hasPointerCapture(event.pointerId))host.releasePointerCapture(event.pointerId);
    };
    host.addEventListener('pointerup',stop);
    host.addEventListener('pointercancel',stop);
    host.addEventListener('keydown',event=>{
      if(event.key==='Enter'||event.key===' '){event.preventDefault();activate(state);return;}
      if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key))return;
      event.preventDefault();
      if(!state.ready){activate(state);return;}
      const step=reduce.matches?.1:.16;
      if(event.key==='ArrowLeft')state.mesh.rotation.y-=step;
      if(event.key==='ArrowRight')state.mesh.rotation.y+=step;
      if(event.key==='ArrowUp')state.mesh.rotation.x=Math.max(-.7,state.mesh.rotation.x-step);
      if(event.key==='ArrowDown')state.mesh.rotation.x=Math.min(.7,state.mesh.rotation.x+step);
      render(state,true);
    });
    new ResizeObserver(()=>{if(state.ready)render(state,state.visible);}).observe(host);
    new IntersectionObserver(entries=>{
      state.visible=!!entries[0]?.isIntersecting;
      if(state.visible){schedule(state);if(state.ready&&!state.autoTimer)spin(state);}else if(state.autoTimer){clearTimeout(state.autoTimer);state.autoTimer=0;state.lastSpin=0;}
      else if(state.raf){cancelAnimationFrame(state.raf);state.raf=0;}
    },{threshold:.01}).observe(host);
  });
  document.addEventListener('visibilitychange',()=>{
    if(!document.hidden)states.forEach(schedule);
  });
})();
