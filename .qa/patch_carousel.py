#!/usr/bin/env python3
"""KirMoon: carrossel de serviços em Compromissos (v6: 6 cards, Saturno fixo, satélite em órbita elíptica).
Usage: python3 patch_carousel.py <in.html> <out.html>
Input is the page BEFORE any carousel (".qa/kirmoon_site.before-carousel.html").
Exact-match replacements; aborts if any anchor is missing. Preserves CRLF."""
import sys

src, dst = sys.argv[1], sys.argv[2]
raw = open(src, 'rb').read().decode('utf-8')
crlf = '\r\n' in raw
text = raw.replace('\r\n', '\n')
if crlf and text.replace('\n', '\r\n') != raw:
    sys.exit('mixed line endings; refusing to patch')
if 'data-cmt-carousel' in text:
    sys.exit('carousel already present; run on the pre-carousel backup')

R = []
def rep(old, new, label, count=1):
    R.append((old, new, label, count))

# ---------------------------------------------------------------- HTML
rep('''      <span class="commitment-moon" aria-hidden="true"><canvas class="planet-canvas" data-planet="saturn"></canvas><i></i></span>
      <div class="commitment-main">
        <div class="commitment-heading">
          <h2 class="commitment-title">Nossos compromissos</h2>
        </div>''',
'''      <div class="commitment-main">
        <div class="commitment-heading">
          <h2 class="commitment-title">Nossos compromissos</h2>
          <p class="commitment-about">A Kirmoon desenvolve aplicativos, refatora sites e assume a frente técnica de empresas que precisam de tecnologia confiável. Todo projeto segue a mesma rota: contexto claro, execução responsável e uma entrega que sua empresa consegue operar.</p>
        </div>''', 'commitment heading')

OLD_ASIDE_START = '      <aside class="diagnostic-panel" id="diagnostic-card" aria-labelledby="diagnostico-titulo">'
a = text.find(OLD_ASIDE_START)
b = text.find('      </aside>\n', a)
if a < 0 or b < 0 or text.count(OLD_ASIDE_START) != 1:
    sys.exit('diagnostic aside not found exactly once')

def point(title, desc):
    return f'''            <li>
              <span class="diagnostic-point-mark" aria-hidden="true"></span>
              <strong>{title}</strong>
              <span>{desc}</span>
            </li>'''

# Cada título é uma pergunta que o visitante tende a responder com "sim".
SLIDES = [
    dict(planet='mars', service='Desenvolvimento de aplicativos', title='Sua equipe vive em planilhas?',
         intro='Transformamos o fluxo que sua equipe já usa em um aplicativo ou sistema web, do desenho das telas à publicação nas lojas.',
         label='O que entregamos',
         points=[('App móvel', 'iOS e Android, publicado nas lojas.'),
                 ('Sistema web', 'Painéis internos feitos sobre a operação real.'),
                 ('Integrações', 'Login, pagamentos e APIs do seu negócio.')],
         cta='Quero um aplicativo sob medida', servico='Desenvolvimento de app'),
    dict(planet='saturn', service='Refatoração de sites', title='Seu site está lento?',
         intro='Em uma revisão técnica, começamos pelo que mais afeta uso, descoberta e segurança do site.',
         label='Pontos principais',
         points=[('Performance', 'Velocidade no celular e no computador.'),
                 ('SEO técnico', 'Indexação, estrutura e presença no Google.'),
                 ('Segurança', 'Atualizações e principais pontos de atenção.')],
         cta='Quero um site mais rápido', servico='Refatoração de site'),
    dict(planet='neptune', service='Assessoria técnica', title='Sua TI está sem direção?',
         intro='Assumimos a frente técnica quando sistemas, infraestrutura e fornecedores precisam de uma direção comum.',
         label='Por onde começamos',
         points=[('Mapeamento', 'Hospedagem, domínios, e-mail e acessos.'),
                 ('Riscos', 'Decisões registradas antes de mudar o ambiente.'),
                 ('Continuidade', 'Manutenção, prioridades e documentação.')],
         cta='Quero uma direção técnica', servico='Assessoria técnica'),
    dict(planet='venus', service='Desenvolvimento de aplicativos', title='Seus pedidos chegam por WhatsApp?',
         intro='Organizamos pedidos, agendamentos e atendimento em um sistema próprio, conectado às ferramentas que o negócio já usa.',
         label='O que muda',
         points=[('Fila única', 'Pedidos e chamados em um só lugar.'),
                 ('Em campo', 'Rotas, status e registros pelo celular.'),
                 ('Painel', 'Números da operação em tempo real.')],
         cta='Quero organizar meus pedidos', servico='Desenvolvimento de app'),
    dict(planet='mercury', service='Refatoração de sites', title='Atualizar seu site dá trabalho?',
         intro='Reorganizamos código e conteúdo para que o site possa mudar sem quebrar, preservando o que ainda funciona.',
         label='O que revisamos',
         points=[('Estrutura', 'Código organizado para mudanças seguras.'),
                 ('Responsividade', 'Layout consistente em qualquer tela.'),
                 ('Migração', 'Troca de tecnologia sem perder domínio.')],
         cta='Quero um site fácil de manter', servico='Refatoração de site'),
    dict(planet='uranus', service='Assessoria técnica', title='Só um fornecedor sabe onde tudo está?',
         intro='Levantamos onde cada sistema roda, quanto custa e quem tem acesso, e deixamos tudo registrado para a sua empresa.',
         label='O que você recupera',
         points=[('Acessos', 'Domínios, contas e senhas sob controle.'),
                 ('Documentação', 'Onde e como cada sistema funciona.'),
                 ('Backup', 'Rotina de cópias e monitoramento.')],
         cta='Quero o controle de volta', servico='Assessoria técnica'),
]
slides_html = []
for i, s in enumerate(SLIDES, 1):
    title_id = 'diagnostico-titulo' if s['planet'] == 'saturn' else f'cmt-title-{i}'
    slides_html.append(f'''        <article class="cmt-slide{' is-active' if i == 1 else ''}" id="cmt-slide-{i}" role="group" aria-roledescription="card" aria-labelledby="{title_id}">
          <p class="diagnostic-kicker">{s['service']}</p>
          <h2 id="{title_id}">{s['title']}</h2>
          <p class="diagnostic-intro">{s['intro']}</p>
          <h3 class="diagnostic-list-label">{s['label']}</h3>
          <ul class="diagnostic-points">
{chr(10).join(point(t, d) for t, d in s['points'])}
          </ul>
          <a class="cmt-cta" href="#contato" data-servico="{s['servico']}"><span>{s['cta']}</span><span class="cmt-cta-arrow" aria-hidden="true">→</span></a>
        </article>''')

new_aside = f'''      <aside class="diagnostic-panel cmt-carousel" id="diagnostic-card" data-cmt-carousel aria-roledescription="carrossel" aria-label="Como a Kirmoon pode ajudar">
        <div class="cmt-orbit" aria-hidden="true">
          <span class="cmt-planet cmt-planet--saturn"><canvas class="planet-canvas" data-planet="saturn"></canvas></span>
        </div>
        <div class="cmt-stage">
          <div class="cmt-track">
{chr(10).join(slides_html)}
          </div>
        </div>
        <div class="cmt-controls">
          <span class="cmt-progress" aria-hidden="true">
            <svg class="cmt-orbit-svg" focusable="false">
              <ellipse class="cmt-orbit-path"/>
              <g class="cmt-trail"></g>
              <g class="cmt-sat"><g class="cmt-sat-art">
                <path class="cmt-sat-line" d="M-8.5 0h3.5M5 0h3.5M0 -5v-3.2M0 5v1.6"/>
                <rect x="-21" y="-4.6" width="12.5" height="9.2" rx="1"/>
                <rect x="8.5" y="-4.6" width="12.5" height="9.2" rx="1"/>
                <path class="cmt-sat-line" d="M-16.8 -4.6v9.2M-12.7 -4.6v9.2M12.7 -4.6v9.2M16.8 -4.6v9.2"/>
                <rect x="-5" y="-5" width="10" height="10" rx="2.2"/>
                <path d="M-3.4 6.6a3.4 2.6 0 0 0 6.8 0z"/>
                <circle class="cmt-sat-tip" cx="0" cy="-8.8" r="1"/>
              </g></g>
            </svg>
          </span>
          <div class="cmt-nav">
            <button class="cmt-btn carousel-prev" type="button" aria-label="Card anterior"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M10 3.5 5.5 8l4.5 4.5"/></svg></button>
            <button class="cmt-btn carousel-next" type="button" aria-label="Próximo card"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6 3.5 10.5 8 6 12.5"/></svg></button>
          </div>
        </div>
        <p class="cmt-live" aria-live="polite" aria-atomic="true"></p>
      </aside>
'''
text = text[:a] + new_aside + text[b + len('      </aside>\n'):]

# ---------------------------------------------------------------- CSS
CSS = r'''
<style id="kirmoon-service-carousel">
/* Compromissos + carrossel de serviços. Saturno fica fixo junto à linha
   divisória; a cada troca o texto desliza recortado, sem esmaecer, e um
   satélite percorre a linha de progresso até o próximo card. */
#compromissos .commitment-about{max-width:34em;margin:clamp(22px,3vh,30px) 0 0;color:#a3acb7;font:400 clamp(15px,1.15vw,17px)/1.62 var(--body)}
#compromissos .stats{margin-top:clamp(44px,6vh,64px)}
#compromissos .tech-stack{margin-top:clamp(40px,5.5vh,58px)}
#compromissos .tech-title{margin:0 0 14px;font:500 13px/1.3 var(--body);letter-spacing:0;text-transform:none;color:#b6bec7}
/* Tecnologias: grade 2×2 alinhada — rótulo numa coluna fixa, itens ao lado,
   todos na mesma fonte e na mesma linha de base. */
#compromissos .tech-stack .tech-groups{display:grid!important;grid-template-columns:minmax(0,1.3fr) minmax(0,1fr);gap:12px 32px}
#compromissos .tech-stack .tech-group{display:grid!important;grid-template-columns:76px minmax(0,1fr);align-items:baseline;column-gap:12px;padding:0!important;margin:0;border:0;background:none;flex:none}
#compromissos .tech-stack .tech-label{min-width:0;margin:0;font:500 10.5px/1.5 var(--mono)!important;letter-spacing:.16em!important;text-transform:uppercase;color:#6f7a87!important}
#compromissos .tech-stack .tech-items{display:flex;flex-wrap:wrap;gap:4px 14px;margin:0;font:400 13.5px/1.5 var(--body)!important;letter-spacing:0!important;color:#aab3be!important}
#compromissos .tech-stack .tech-items>span{margin:0;padding:0;border:0;background:none;font:inherit!important;letter-spacing:0!important;color:inherit!important;white-space:nowrap}
@media (max-width:620px){#compromissos .tech-stack .tech-groups{grid-template-columns:1fr;gap:10px}}

/* Conteúdo sobe: colunas alinhadas ao topo, sem o centro vertical antigo. */
@media (min-width:961px){
  #compromissos.section{padding-top:clamp(24px,2.8vw,44px)!important}
  #compromissos .commitment-diagnostic{align-items:start;min-height:0}
  #compromissos .commitment-main{align-self:start}
}

/* Painel: card centralizado entre a linha divisória e a margem. */
#compromissos .cmt-carousel{position:relative;align-self:start;min-width:0;overflow:visible;padding:0 clamp(20px,2.6vw,44px)}
#compromissos .cmt-stage,#compromissos .cmt-controls{width:100%;max-width:380px;margin-inline:auto}
#compromissos .cmt-stage{position:relative;overflow:hidden;box-sizing:border-box;width:calc(100% + 12px);max-width:392px;padding:6px;margin:-6px 0 -6px max(-6px,calc((100% - 392px) / 2))}
#compromissos .cmt-track{position:relative}
#compromissos .cmt-slide{position:relative;display:flex;flex-direction:column;min-width:0}
#compromissos .cmt-slide + .cmt-slide{margin-top:48px}
#compromissos .cmt-carousel.is-ready .cmt-track{display:grid}
#compromissos .cmt-carousel.is-ready .cmt-slide{grid-area:1/1;margin:0;visibility:hidden;pointer-events:none}
#compromissos .cmt-carousel.is-ready .cmt-slide.is-active,#compromissos .cmt-carousel.is-ready .cmt-slide.is-leaving{visibility:visible}
#compromissos .cmt-carousel.is-ready .cmt-slide.is-active{pointer-events:auto}
#compromissos .cmt-slide .diagnostic-kicker{display:block;margin:0 0 16px}
#compromissos .cmt-slide h2{min-height:1.82em}
@media (min-width:561px){#compromissos .cmt-slide .diagnostic-points li{grid-template-columns:7px 106px minmax(0,1fr)}}
#compromissos .cmt-slide .diagnostic-points strong{white-space:nowrap}
#compromissos .cmt-cta{align-self:flex-start;display:inline-flex;align-items:center;gap:12px;min-height:44px;margin-top:22px;padding:0 18px;border:1px solid rgba(236,238,241,.28);border-radius:999px;color:var(--lunar);font:600 13px/1 var(--body);letter-spacing:.02em;text-decoration:none;transition:border-color .2s ease,background-color .2s ease}
#compromissos .cmt-cta:hover{border-color:rgba(236,238,241,.7);background:rgba(236,238,241,.06)}
#compromissos .cmt-cta:focus-visible,#compromissos .cmt-btn:focus-visible{outline:2px solid var(--glow);outline-offset:3px}
#compromissos .cmt-cta-arrow{font-family:var(--mono);transition:transform .25s cubic-bezier(.2,.72,.2,1)}
#compromissos .cmt-cta:hover .cmt-cta-arrow{transform:translateX(4px)}

/* Saturno fixo à esquerda da linha divisória, na altura do título do card:
   gira no próprio eixo e não muda entre os cards. */
#compromissos .cmt-orbit{position:absolute;z-index:3;top:clamp(-6px,-.4vw,0px);left:clamp(-150px,-8.4vw,-96px);width:clamp(120px,9.6vw,172px);aspect-ratio:1;translate:-50% 0;pointer-events:none}
#compromissos .cmt-planet{position:absolute;left:50%;top:50%;aspect-ratio:1;border-radius:50%;translate:-50% -50%;pointer-events:none}
#compromissos .cmt-planet--saturn{width:clamp(118px,9.8vw,160px);rotate:-6deg}
#compromissos .cmt-planet--saturn .planet-canvas{position:absolute;inset:-40%;width:180%;height:180%}
#compromissos .cmt-planet.is-3d .planet-canvas{pointer-events:auto}

/* Controles: só setas, pausa e o tempo do card atual — sem revelar quantos são. */
#compromissos .cmt-controls{display:none;align-items:center;gap:20px;margin-top:18px;padding-top:8px;border-top:1px solid rgba(236,238,241,.1)}
#compromissos .cmt-carousel.is-ready .cmt-controls{display:flex}
/* Satélite em órbita elíptica: cada volta completa é o tempo de um card.
   Visto de cima e levemente inclinado: menor atrás (em cima), maior na
   frente (embaixo), deixando um rastro fino pelo caminho. */
#compromissos .cmt-progress{position:relative;flex:1;height:64px;min-width:0}
#compromissos .cmt-orbit-svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible}
#compromissos .cmt-orbit-path{fill:none;stroke:rgba(215,226,239,.12);stroke-width:1}
#compromissos .cmt-trail path{fill:none;stroke:#dfe6ee;stroke-linecap:round}
#compromissos .cmt-sat-art rect,#compromissos .cmt-sat-art path{fill:#0a0e14;stroke:#d9e1ea;stroke-width:1.1;stroke-linejoin:round}
#compromissos .cmt-sat-art .cmt-sat-line{fill:none;stroke:#b9c4d0;stroke-width:.9;stroke-linecap:round}
#compromissos .cmt-sat-tip{fill:#d9e1ea}
#compromissos .cmt-nav{display:flex;gap:8px}
#compromissos .cmt-btn{display:grid;place-items:center;width:44px;height:44px;padding:0;border:1px solid rgba(236,238,241,.2);border-radius:50%;background:rgba(5,7,11,.4);color:#e1e5ea;cursor:pointer;transition:border-color .2s ease,background-color .2s ease}
#compromissos .cmt-btn:hover{border-color:rgba(236,238,241,.6);background:rgba(236,238,241,.06)}
#compromissos .cmt-btn:active{scale:.96}
#compromissos .cmt-btn svg{width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round}
#compromissos .cmt-live{position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0}

/* O espaço acompanha o giro: as duas camadas de estrelas deslizam em
   velocidades diferentes (paralaxe). */
#compromissos.section::before,#compromissos.section::after{left:-340px;right:-340px;transition:translate .9s cubic-bezier(.65,0,.35,1)}
#compromissos.section::before{translate:var(--space-near,0px) 0}
#compromissos.section::after{translate:var(--space-far,0px) 0}
#compromissos.section.space-snap::before,#compromissos.section.space-snap::after{transition:none}

@media (min-width:961px) and (max-height:760px){
  #compromissos .cmt-cta{margin-top:14px;min-height:40px}
  #compromissos .cmt-controls{margin-top:18px;padding-top:12px}
}
/* Celular e tablet: a órbita fica centralizada acima do card. */
@media (max-width:960px){
  #compromissos .cmt-carousel{padding:clamp(150px,36vw,176px) 0 0}
  #compromissos .cmt-stage{max-width:472px;margin-left:max(-6px,calc((100% - 472px) / 2))}
  #compromissos .cmt-controls{max-width:460px}
  #compromissos .cmt-orbit{left:50%;top:clamp(20px,5vw,34px)}
  #compromissos .cmt-planet.is-3d{opacity:.94}
}
@media (max-width:620px){
  #compromissos .cmt-slide h2{min-height:0}
}
@media (prefers-reduced-motion:reduce){
  #compromissos.section::before,#compromissos.section::after{transition:none!important}
}
</style>
'''
rep('</head>', CSS + '</head>', 'css block')

# ---------------------------------------------------------------- JS (carrossel)
JS = r'''<script>
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

  root.classList.add('is-ready');

  // ---------- órbita ----------
  // Parâmetro da volta: 0 = ponto de partida à esquerda; no sentido horário,
  // passa por cima (atrás), pela direita e volta por baixo (frente).
  // lap = posição na órbita (em voltas); origin = onde começou a volta do card atual.
  let lap = 0, origin = 0, heading = 1, lastTime = 0, frame = 0, boost = null;
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
    if (needed && !frame) frame = requestAnimationFrame(tick);
    if (!needed) lastTime = 0;
  }
  new ResizeObserver(measure).observe(progress);
  measure();

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
      void section.offsetWidth;
      section.classList.remove('space-snap');
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
</script>
'''
rep('</body>', JS + '</body>', 'carousel script')

# ---------------------------------------------------------------- JS (planetas)
# Tamanho do canvas pelo layout (clientWidth), não pela caixa transformada:
# dentro do cubo girado o getBoundingClientRect encolhe e deformava o planeta.
rep('''        const rect = canvas.getBoundingClientRect();
        const w = Math.max(2, rect.width), h = Math.max(2, rect.height);''',
'''        const rect = canvas.getBoundingClientRect();
        const w = Math.max(2, canvas.clientWidth || rect.width), h = Math.max(2, canvas.clientHeight || rect.height);''', 'webgl layout size')
rep('''box=canvas.getBoundingClientRect(),''',
'''box={width:canvas.clientWidth||canvas.getBoundingClientRect().width,height:canvas.clientHeight||canvas.getBoundingClientRect().height},''', 'canvas layout size')

# Pré-carrega só os planetas do card atual e dos vizinhos quando o capítulo
# final se aproxima; o carrossel pede os demais conforme gira.
for old, new, label, count in R:
    n_found = text.count(old)
    if n_found != count:
        sys.exit(f'anchor "{label}" found {n_found} times (expected {count}); aborting without writing')
    text = text.replace(old, new)

out = text.replace('\n', '\r\n') if crlf else text
open(dst, 'wb').write(out.encode('utf-8'))
print(f'patched {len(R) + 1} sites; crlf={crlf}; {len(out.encode())} bytes')
