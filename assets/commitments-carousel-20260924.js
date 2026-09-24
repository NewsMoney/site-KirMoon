/* Carrossel de serviços em Compromissos: texto recortado + satélite em órbita. */
(() => {
  const root = document.querySelector('[data-cmt-carousel]');
  if (!root) return;
  const slides = [...root.querySelectorAll('.cmt-slide')];
  if (slides.length < 2) return;
  const section = root.closest('section');
  const track = root.querySelector('.cmt-track');
  const prevBtn = root.querySelector('.carousel-prev');
  const nextBtn = root.querySelector('.carousel-next');
  const live = root.querySelector('.cmt-live');
  const progress = root.querySelector('.cmt-progress');
  const svg = root.querySelector('.cmt-orbit-svg');
  const orbitPath = root.querySelector('.cmt-orbit-path');
  const trailGroup = root.querySelector('.cmt-trail');
  const sat = root.querySelector('.cmt-sat');
  const reduceQ = matchMedia('(prefers-reduced-motion: reduce)');
  const LAP_MS = 7000, TEXT_MS = 560, BOOST_MS = 820, EASE_TEXT = 'cubic-bezier(.65,0,.35,1)';
  const TRAIL_SEGMENTS = 26, TRAIL_SPAN = Math.PI * .62;
  const NS = 'http://www.w3.org/2000/svg';
  let index = Math.max(0, slides.findIndex(s => s.classList.contains('is-active')));
  // A volta segue mesmo com o mouse sobre o card. Ela só para com o foco do
  // teclado dentro do carrossel (navegação por Tab), fora da tela ou em aba
  // oculta; com "reduzir movimento" o satélite fica parado e a troca é manual.
  let autoplay = !reduceQ.matches, keyboardFocus = false, offscreen = true;
  let running = [];

  // ---------- órbita ----------
  // Parâmetro da volta: 0 = ponto de partida à esquerda; no sentido horário,
  // passa por cima (atrás), pela direita e volta por baixo (frente).
  // lap = posição na órbita (em voltas); origin = onde começou a volta do card atual.
  let lap = 0, origin = 0, heading = 1, lastTime = 0, lastDrawTime = 0, frame = 0, frameTimer = 0, boost = null;
  let geo = { cx: 0, cy: 0, rx: 60, ry: 16 };
  const trail = Array.from({ length: TRAIL_SEGMENTS }, () => trailGroup.appendChild(document.createElementNS(NS, 'path')));
  function measure() {
    const w = progress.clientWidth, h = progress.clientHeight;
    if (!w || !h) return;
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    geo = { cx: w / 2, cy: h / 2, rx: Math.max(30, w / 2 - 24), ry: Math.min(h / 2 - 12, Math.max(12, w * .09)) };
    orbitPath.setAttribute('cx', geo.cx); orbitPath.setAttribute('cy', geo.cy);
    orbitPath.setAttribute('rx', geo.rx); orbitPath.setAttribute('ry', geo.ry);
    draw();
  }
  const angleAt = p => Math.PI + p * Math.PI * 2;
  const point = t => [geo.cx + geo.rx * Math.cos(t), geo.cy + geo.ry * Math.sin(t)];
  function draw() {
    const t = angleAt(lap), [x, y] = point(t);
    // Profundidade: embaixo (frente) maior, em cima (atrás) menor.
    const depth = (1 + Math.sin(t)) / 2;
    const scale = .82 + .22 * depth;
    // Inclinação fixa, como na referência: o satélite não gira em nenhum
    // ponto da volta — nem nas pontas da elipse, nem na largada.
    const bank = -10;
    sat.setAttribute('transform', `translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${bank.toFixed(2)}) scale(${scale.toFixed(3)})`);
    // Rastro: segmentos atrás do satélite, cada vez mais finos e apagados.
    const showTrail = autoplay && !reduceQ.matches;
    trail.forEach((seg, i) => {
      if (!showTrail) { seg.setAttribute('d', ''); return; }
      // O rastro fica sempre atrás do satélite, no sentido em que ele anda.
      const a1 = t - heading * ((i / TRAIL_SEGMENTS) * TRAIL_SPAN + .16), a0 = a1 - heading * (TRAIL_SPAN / TRAIL_SEGMENTS + .01);
      const [x0, y0] = point(a0), [x1, y1] = point(a1), k = 1 - i / TRAIL_SEGMENTS;
      seg.setAttribute('d', `M${x0.toFixed(2)} ${y0.toFixed(2)}L${x1.toFixed(2)} ${y1.toFixed(2)}`);
      seg.setAttribute('stroke-opacity', (k * k * .6).toFixed(3));
      seg.setAttribute('stroke-width', (.4 + k * 1.1).toFixed(2));
    });
  }
  const easeInOut = k => k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
  const paused = () => keyboardFocus || offscreen || document.hidden;
  function tick(now) {
    frame = 0;
    lastDrawTime = now;
    const dt = lastTime ? Math.min(250, now - lastTime) : 0;
    lastTime = now;
    if (boost) {
      // Seta: o satélite gira depressa até o ponto de partida (à esquerda) —
      // para a frente na seta de avançar, para trás na de voltar — e o novo
      // card ganha uma volta completa a partir dali.
      const k = Math.min(1, (now - boost.start) / boost.ms);
      lap = boost.from + (boost.to - boost.from) * easeInOut(k);
      heading = boost.to >= boost.from ? 1 : -1;
      if (k >= 1) { lap = boost.to; origin = lap; heading = 1; boost = null; }
    } else if (autoplay && !paused()) {
      lap += dt / LAP_MS;
      if (lap - origin >= 1) { origin += 1; go(index + 1, 1, false, false); }   // uma volta = um card
    }
    draw();
    schedule();
  }
  function schedule() {
    const needed = boost || (autoplay && !paused());
    if (!needed) {
      lastTime = 0;
      if (frameTimer) clearTimeout(frameTimer);
      frameTimer = 0;
      return;
    }
    if (frame || frameTimer) return;
    const interval = boost ? 1000 / 60 : 1000 / 30;
    const elapsed = lastDrawTime ? performance.now() - lastDrawTime : interval;
    const wait = Math.max(0, interval - elapsed);
    if (wait > 4) {
      frameTimer = setTimeout(() => { frameTimer = 0; frame = requestAnimationFrame(tick); }, wait);
    } else {
      frame = requestAnimationFrame(tick);
    }
  }
  new ResizeObserver(measure).observe(progress);
  measure();
  root.classList.add('is-ready');

  // ---------- espaço ----------
  let near = 0, far = 0, snapTimer = 0;
  const wrap = (v, tile) => ((((v + tile / 2) % tile) + tile) % tile) - tile / 2;
  function moveSpace(dir) {
    if (!section || reduceQ.matches) return;
    near -= dir * 70; far -= dir * 34;
    section.style.setProperty('--space-near', near + 'px');
    section.style.setProperty('--space-far', far + 'px');
    clearTimeout(snapTimer);
    snapTimer = setTimeout(() => {
      near = wrap(near, 260); far = wrap(far, 320);
      section.classList.add('space-snap');
      section.style.setProperty('--space-near', near + 'px');
      section.style.setProperty('--space-far', far + 'px');
      // Mantém a classe por um ciclo de pintura, sem leitura síncrona de layout.
      requestAnimationFrame(() => {
        requestAnimationFrame(() => section.classList.remove('space-snap'));
      });
    }, 1100);
  }

  // ---------- cards ----------
  function settle() {
    running.forEach(a => a.cancel());
    running = [];
    slides.forEach(s => s.classList.remove('is-leaving'));
  }
  function show(prev, dir, announce) {
    settle();
    slides.forEach((s, i) => {
      const active = i === index;
      s.classList.toggle('is-active', active);
      s.toggleAttribute('inert', !active);
      s.setAttribute('aria-hidden', active ? 'false' : 'true');
    });
    if (prev !== index && !reduceQ.matches) {
      const outSlide = slides[prev], inSlide = slides[index];
      outSlide.classList.add('is-leaving');
      // Faixa recortada: os dois cards andam juntos, sem esmaecer.
      running.push(
        outSlide.animate([{ transform: 'translateX(0)' }, { transform: `translateX(${-dir * 106}%)` }], { duration: TEXT_MS, easing: EASE_TEXT }),
        inSlide.animate([{ transform: `translateX(${dir * 106}%)` }, { transform: 'translateX(0)' }], { duration: TEXT_MS, easing: EASE_TEXT })
      );
      const done = running.slice();
      Promise.all(done.map(a => a.finished)).then(() => { if (done.every(a => running.includes(a))) settle(); }, () => {});
    }
    if (announce && live) {
      const s = slides[index];
      live.textContent = `${s.querySelector('.diagnostic-kicker')?.textContent.trim() || ''}: ${s.querySelector('h2')?.textContent.trim() || ''}`;
    }
  }
  function go(target, dir, announce, fromUser = true) {
    const count = slides.length;
    const nextIndex = ((target % count) + count) % count;
    if (nextIndex === index) return;
    const prev = index;
    index = nextIndex;
    show(prev, dir, announce);
    moveSpace(dir);
    if (fromUser && autoplay && !reduceQ.matches) {
      // Ponto de partida seguinte (ou anterior). Se ele estiver quase lá, o
      // giro vai até o ponto de partida da volta seguinte, para ser sempre visível.
      let to = dir < 0 ? Math.floor(lap) : Math.ceil(lap);
      if (Math.abs(to - lap) < .15) to += dir < 0 ? -1 : 1;
      const dist = Math.abs(to - lap);
      boost = { from: lap, to, ms: Math.round(360 + BOOST_MS * dist), start: performance.now() };
      schedule();
    }
  }

  function updatePaused() {
    root.classList.toggle('is-autoplay', autoplay);
    root.classList.toggle('is-paused', paused());
    if (live) live.setAttribute('aria-live', autoplay && !keyboardFocus ? 'off' : 'polite');
    schedule();
  }

  prevBtn?.addEventListener('click', () => go(index - 1, -1, true));
  nextBtn?.addEventListener('click', () => go(index + 1, 1, true));

  root.addEventListener('keydown', e => {
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.target.closest('input,textarea,select')) return;
    if (e.key === 'ArrowLeft') { e.preventDefault(); go(index - 1, -1, true); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); go(index + 1, 1, true); }
  });

  // Clique com o mouse não pausa; só o foco visível do teclado (Tab).
  const checkFocus = () => { keyboardFocus = !!root.querySelector(':focus-visible'); updatePaused(); };
  root.addEventListener('focusin', checkFocus);
  root.addEventListener('focusout', () => setTimeout(checkFocus, 0));
  document.addEventListener('visibilitychange', updatePaused);
  new IntersectionObserver(entries => {
    offscreen = !entries[0]?.isIntersecting;
    updatePaused();
  }, { threshold: .35 }).observe(root);
  reduceQ.addEventListener?.('change', e => { autoplay = !e.matches; if (!autoplay) { lap = 0; origin = 0; heading = 1; boost = null; } updatePaused(); draw(); });

  // Deslizar no celular troca o card; a rolagem vertical continua nativa.
  let touchX = 0, touchY = 0, touching = false;
  track?.addEventListener('touchstart', e => {
    const t = e.touches[0]; if (!t) return; touching = true; touchX = t.clientX; touchY = t.clientY;
  }, { passive: true });
  track?.addEventListener('touchend', e => {
    if (!touching) return; touching = false;
    const t = e.changedTouches[0]; if (!t) return;
    const dx = t.clientX - touchX, dy = t.clientY - touchY;
    if (Math.abs(dx) > 46 && Math.abs(dx) > Math.abs(dy) * 1.3) go(index + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1, true);
  }, { passive: true });

  // O botão de cada card já escolhe o serviço no formulário de contato.
  root.querySelectorAll('.cmt-cta[data-servico]').forEach(link => link.addEventListener('click', () => {
    const select = document.getElementById('f-servico');
    if (!select) return;
    const option = [...select.options].find(o => o.textContent.trim() === link.dataset.servico);
    if (option) { select.value = option.value; select.dispatchEvent(new Event('change', { bubbles: true })); }
  }));

  // Estado para os testes e para depuração: volta atual e card ativo.
  root.cmtState = () => ({ index, pos: lap, lap: lap - origin, autoplay, paused: paused(), boosting: !!boost });

  slides.forEach((s, i) => { const a = i === index; s.classList.toggle('is-active', a); s.toggleAttribute('inert', !a); s.setAttribute('aria-hidden', a ? 'false' : 'true'); });
  updatePaused();
})();
