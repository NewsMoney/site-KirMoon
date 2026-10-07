const fs = require('node:fs');
const assert = require('node:assert/strict');
let html = fs.readFileSync('C:/Users/milto/Downloads/index.html', 'utf8');
function replace(from, to) { assert(html.includes(from), 'Missing edit anchor: '+from.slice(0,100)); html=html.replace(from,to); }

// Download Three in parallel; only the graphics depend on its completion.
replace('<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>', '');
replace('<title>KirMoon</title>', `<title>KirMoon</title>
<script id="kirmoon-graphics-loader">
window.kmThreeReady = new Promise(resolve => {
  const script = document.createElement('script');
  script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
  script.async = true;
  script.onload = () => resolve(window.THREE || null);
  script.onerror = () => resolve(null);
  document.head.appendChild(script);
});
</script>`);

// Keep the exact embedded images, but send the visible HTML before their 1.1 MB.
const textures = [];
html=html.replace(/<img\b[^>]*\bid="(?:texJupiter|texSaturno|texAneis|texTerra|texTerraSup|texTerraNuvens|moonsrc)"[^>]*>/g,tag=>{textures.push(tag);return '';});
assert.equal(textures.length,7);
replace('</footer>', '</footer>\n\n<!-- Texturas originais, após o conteúdo para permitir pintura antecipada. -->\n'+textures.join('\n'));
replace(`      var img = document.getElementById("moonsrc");
      if (img.complete && img.naturalWidth) kmLoad("img"); else img.addEventListener("load", function () { kmLoad("img"); });`,
`      document.addEventListener('DOMContentLoaded', function () {
        var img = document.getElementById('moonsrc');
        if (img.complete && img.naturalWidth) kmLoad('img');
        else img.addEventListener('load', function () { kmLoad('img'); }, {once:true});
      }, {once:true});`);

// All texture consumers await both dependencies, including direct/deep navigation.
replace('  const img = document.getElementById("moonsrc");', `  const img = document.getElementById("moonsrc");
  const imageReady = image => new Promise(resolve => {
    if (!image || image.complete) { resolve(); return; }
    const done = () => { image.removeEventListener('load', done); image.removeEventListener('error', done); resolve(); };
    image.addEventListener('load', done, {once:true});
    image.addEventListener('error', done, {once:true});
  });
  const graphicsReady = Promise.all([window.kmThreeReady, imageReady(img)]);`);

replace('  const drawPhases = () => {\n    document.querySelectorAll("canvas[data-phase]").forEach(c => {', `  let phasesReady = null;
  const drawPhases = () => phasesReady || (phasesReady = (async () => {
    for (const c of document.querySelectorAll('canvas[data-phase]')) {
      // Yield between canvases so navigation/input can run during preparation.
      await new Promise(resolve => setTimeout(resolve, 0));`);
replace('      c.classList.add("drawn");\n    });\n  };', '      c.classList.add("drawn");\n    }\n  })());');
replace('  ensureProcessMoonReady = initProcessMoon3D;', `  ensureProcessMoonReady = () => graphicsReady.then(() => {
    drawPhases();
    initProcessMoon3D();
  });`);
replace('  ensureFinalPlanetReady = type => initFinalPlanets3D(type);', `  ensureFinalPlanetReady = type => {
    const ids = type === 'saturn' ? ['texSaturno', 'texAneis']
      : type === 'jupiter' ? ['texJupiter'] : ['texTerra', 'texTerraSup', 'texTerraNuvens'];
    return Promise.all([window.kmThreeReady, ...ids.map(id => imageReady(document.getElementById(id)))])
      .then(() => initFinalPlanets3D(type));
  };`);
replace(`  const ready = () => {
    decorate();
    drawPhases();
    initMoon();
    setupProgressiveScenes();
  };
  if (img.complete && img.naturalWidth) ready(); else img.addEventListener("load", ready, {once:true});`, `  decorate();
  setupProgressiveScenes();
  graphicsReady.then(() => requestAnimationFrame(() => initMoon()));`);

// Keep textures, geometry, pixel density, lights, drag, inertia and parallax.
// Slow ambient movement needs 30 fps; active interaction gets 60 fps.
replace('    let first = false, lastTime = 0;', `    let first = false, lastTime = 0, lastDraw = 0;
    const canDraw = (time, interacting) => !lastDraw || time - lastDraw >= (1000 / (interacting ? 60 : 30)) - .5;`);
replace('      const dt = lastTime ? Math.min((time - lastTime) / 16.667, 3) : 1;', `      const interacting = drag || Math.abs(vy) > .0001 || Math.abs(rx + (reduce ? 0 : my*.08) - tilt.rotation.x) > .001 || Math.abs((reduce ? 0 : mx*.12) - pivot.rotation.y) > .001;
      if (!reduce && !canDraw(time, interacting)) { schedule(); return; }
      lastDraw = time;
      const dt = lastTime ? Math.min((time - lastTime) / 16.667, 3) : 1;`);
replace(' * (reduce ? 1 : .06);\n      pivot.rotation.y', ' * (reduce ? 1 : 1 - Math.pow(.94, dt));\n      pivot.rotation.y');
replace(' * (reduce ? 1 : .05);\n      stars.rotation.y', ' * (reduce ? 1 : 1 - Math.pow(.95, dt));\n      stars.rotation.y');
replace('      if (!drag) { vy = reduce ? 0 : vy * Math.pow(.94, dt); moon.rotation.y += vy + (reduce ? 0 : .00035 * dt); }', `      if (!drag) {
        const decay = Math.pow(.94, dt);
        moon.rotation.y += reduce ? 0 : vy * .94 * (1 - decay) / .06 + .00035 * dt;
        vy = reduce ? 0 : vy * decay;
      }`);

// Avoid duplicate GPU resize/first-render work. ResizeObserver calls once on attach.
replace(`      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.render(scene,camera);`, `      const size = renderer.getSize(new THREE.Vector2());
      if (size.x === w && size.y === h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.render(scene,camera);`);
replace(`        renderer.setSize(w, h, false);
        camera.aspect = w / h; camera.updateProjectionMatrix();
        renderer.render(scene, camera);`, `        const size = renderer.getSize(new THREE.Vector2());
        if (size.x === w && size.y === h) return;
        renderer.setSize(w, h, false);
        camera.aspect = w / h; camera.updateProjectionMatrix();
        renderer.render(scene, camera);`);
replace(`      finalPlanetRuntime.quadro = 0;
      let ativo = false;`, `      finalPlanetRuntime.quadro = 0;
      if (document.hidden) return;
      let ativo = false;`);
replace(`        if (!p.visivel) return;
        const dt`, `        if (!p.visivel) { p.ultimo = 0; return; }
        const interacting = p.arrastando || Math.abs(p.vy) > .0001 || Math.abs(p.rx + (reduce ? 0 : p.my*.10) - p.tilt.rotation.x) > .001 || Math.abs((reduce ? 0 : p.mx*.14) - p.pivot.rotation.y) > .001;
        if (!reduce && p.ultimo && tempo - p.ultimo < 1000 / (interacting ? 60 : 30) - .5) { ativo = true; return; }
        const dt`);
replace(' * (reduce ? 1 : .06);\n        p.pivot.rotation.y', ' * (reduce ? 1 : 1 - Math.pow(.94, dt));\n        p.pivot.rotation.y');
replace(' * (reduce ? 1 : .05);\n\n        if (p.anelMat)', ' * (reduce ? 1 : 1 - Math.pow(.95, dt));\n\n        if (p.anelMat)');
replace(`          p.vy = reduce ? 0 : p.vy * Math.pow(.94, dt);
          p.esfera.rotation.y += p.vy + (reduce ? 0 : p.giro * dt);`, `          const decay = Math.pow(.94, dt);
          p.esfera.rotation.y += reduce ? 0 : p.vy * .94 * (1 - decay) / .06 + p.giro * dt;
          p.vy = reduce ? 0 : p.vy * decay;`);

// Article is not allowed to take the button role. A div with the existing role,
// focus, pressed state and keyboard handlers keeps the interaction intact.
replace('.process-phase:last-of-type::after', '.process-phase[data-process-step="3"]::after');
replace('.process-sequence > .process-phase:not(:first-of-type)', '.process-sequence > .process-phase:not(:first-child)');
replace('.process-sequence > .process-phase:last-of-type', '.process-sequence > .process-phase[data-process-step="3"]');
let fixedPhases = 0;
html = html.replace(/<article class="process-phase([^>]+)>([\s\S]*?)<\/article>/g, (_match, attributes, content) => {
  fixedPhases++;
  return `<div class="process-phase${attributes}>${content}</div>`;
});
assert.equal(fixedPhases, 4);

fs.writeFileSync('index.otimizado.html', html);
console.log('Built index.otimizado.html ('+Buffer.byteLength(html)+' bytes); embedded textures preserved.');
