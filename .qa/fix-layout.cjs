const fs = require('fs');
let h = fs.readFileSync('kirmoon_site.html', 'utf8').replace(/\r\n/g, '\n');
function cut(start, end, replacement) {
  const a=h.indexOf(start), b=h.indexOf(end,a);
  if(a<0 || b<0) throw Error('Missing boundary '+start);
  h=h.slice(0,a)+replacement+h.slice(b);
}
// Keep natural section heights and always-readable copy during native scroll.
cut('  /* ---------- scroll cinematográfico por capítulos ---------- */', '  /* ---------- contato: FAB expansível ---------- */', `  /* O conteúdo acompanha o scroll nativo, sem ocultar texto entre capítulos. */
  @media (min-width:961px){
    .hero,.service-panel{min-height:92svh}
  }

`);
cut('  /* Stagger apenas quando o sistema de capítulos está ativo.', '  @media (min-width:961px) and (max-height:760px){\n    .service-panel{', '');

const css=`
  /* Ajustes de leitura: a arte ocupa uma coluna própria, nunca a área do texto. */
  .service-panel{
    display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);
    gap:clamp(32px,4vw,72px);align-items:center;
    padding:clamp(64px,7vw,96px) max(var(--gutter),calc((100vw - var(--maxw))/2));
  }
  .service-panel .service-copy,.service-panel.flip .service-copy{
    grid-column:1;grid-row:1;max-width:none;width:100%;margin:0;min-width:0;
  }
  .service-panel.flip .service-copy{grid-column:2}
  .service-panel .service-copy>*,.service-panel.flip .service-copy>*{margin-left:0;max-width:100%}
  .service-panel .service-copy h2{font-size:clamp(36px,4.35vw,68px);line-height:.99;overflow-wrap:anywhere;hyphens:none}
  .service-panel .service-lede{font-size:clamp(16px,1.15vw,18px);line-height:1.6}
  .service-panel .service-cta{align-self:flex-start;max-width:100%;padding:12px 22px;line-height:1.35}
  .service-meta{flex-wrap:wrap;gap:8px 16px;line-height:1.5;color:#a5aeb9}
  .service-meta span:last-child{max-width:none;text-align:left}
  .service-journey{display:flex;flex-wrap:wrap;gap:8px;line-height:1.5;color:#a5aeb9}
  .service-journey i{flex:1 0 14px;max-width:56px;margin:0;min-width:14px}
  .service-capabilities li{font-size:12.5px;line-height:1.5;min-height:44px}
  .service-num{color:#909caa}
  .service-panel .service-visual,.service-panel.flip .service-visual{
    position:relative;inset:auto;grid-column:2;grid-row:1;width:100%;min-width:0;
    height:clamp(300px,32vw,460px);margin:0;opacity:1;z-index:1;
  }
  .service-panel.flip .service-visual{grid-column:1}
  .service-visual-apps .app-phone{width:28%;height:auto;aspect-ratio:15/29}
  .service-visual-apps .app-phone-front{top:14%}
  .service-visual-apps .app-dashboard{top:27%;height:48%}
  .service-visual .sv-label{color:#b9c3cf;background:#0c1119;backdrop-filter:none}
  .service-visual .app-phone,.service-visual .app-dashboard,
  .service-visual .site-browser,.service-visual .site-mobile,.service-visual .site-chart,
  .service-visual .ti-node{background:linear-gradient(150deg,#19212c,#0d121a);border-color:rgba(236,238,241,.2);backdrop-filter:none}
  .service-visual-ti .ti-node{min-width:0;max-width:38%;padding:12px}
  .service-visual-ti .ti-node-core{left:50%;top:40%;transform:translateX(-50%);min-width:0;padding:16px}
  .service-visual-ti .ti-node-monitor{left:50%;transform:translateX(-50%)}
  .service-panel .surface{filter:grayscale(1);opacity:.06;transform:none;will-change:auto;animation:none}
  body.scroll-scenes-ready .service-panel.is-centered .surface{transform:none;opacity:.06}
  .service-panel::after{pointer-events:none}

  /* O acordeão cresce com a resposta: sem altura fixa ou rolagem interna. */
  #faq .faq-grid{height:auto!important;min-height:480px!important;max-height:none!important}
  #faq .faq,#faq .faq-list{height:auto;min-height:0;overflow:visible}
  #faq .faq-list{display:block}
  #faq .faq-item{min-height:0;display:block;overflow:visible}
  #faq .faq-question{min-height:56px;line-height:1.25}
  #faq .faq-answer{display:none;max-height:none;transform:none;transition:none}
  #faq .faq-item.is-open .faq-answer{display:block;max-height:none;opacity:1;visibility:visible}
  #faq .faq-answer p{font-size:15px;line-height:1.6}
  .foot-brand{justify-self:start}
  .process-story::before,.process-story::after,#faq.section::before,#faq.section::after,
  #compromissos::before,#compromissos::after,#contato::before,#contato::after{animation-play-state:paused;will-change:auto}
  .process-story.effects-visible::before,.process-story.effects-visible::after,
  #faq.section.effects-visible::before,#faq.section.effects-visible::after,
  #compromissos.effects-visible::before,#compromissos.effects-visible::after,
  #contato.effects-visible::before,#contato.effects-visible::after{animation-play-state:running}
  @media(max-width:960px){
    .service-panel,.service-panel.flip{grid-template-columns:minmax(0,1fr);gap:30px;min-height:0;padding:48px var(--gutter) 56px;align-items:start}
    .service-panel .service-copy,.service-panel.flip .service-copy{grid-column:1;grid-row:1}
    .service-panel .service-visual,.service-panel.flip .service-visual{grid-column:1;grid-row:2;width:min(100%,520px);justify-self:center;height:clamp(240px,60vw,360px)}
    .service-panel .service-copy h2{font-size:clamp(32px,7.8vw,56px)}
    .service-panel .service-copy .service-meta{font-size:10px}
    .service-panel .service-copy .service-result{font-size:19px}
    .service-capabilities li{font-size:13px}
    .service-progress{margin-top:20px}
    .service-visual-ti .ti-node{padding:10px}
    .service-visual-ti .ti-node strong{font-size:12px;line-height:1.2}
    .process-head{max-width:none}
    #faq .faq-grid{min-height:0!important;grid-template-rows:auto auto;gap:30px}
    #faq .faq-question{grid-template-columns:22px minmax(0,1fr) 20px;gap:8px;padding-block:16px;font-size:19px}
    #faq .faq-answer p{margin:0 16px 18px 30px}
    .nav{transform:translateY(-12px)}
    .process-story::before,.process-story::after,#faq.section::before,#faq.section::after,
    #compromissos::before,#compromissos::after,#contato::before,#contato::after{animation:none}
  }
  @media(max-width:360px){
    .service-panel .service-copy h2{font-size:30px}
    .service-panel .service-cta{padding-inline:16px;font-size:13px}
  }
`;
h=h.replace('</style>', css+'\n</style>');
// Native wheel/touch: no event cancellation, intentional navigation only.
cut('  let sceneAnimating = false;', '  document.querySelectorAll(\'a[href^="#"]\')', `  function goToChapter(index) {
    const target=chapters[index];
    if(!target) return;
    setMenu(false);
    target.focus({preventScroll:true});
    target.scrollIntoView({behavior:reduce ? "instant" : "smooth",block:"start"});
    if(location.hash !== "#"+target.id) history.pushState(null,"","#"+target.id);
    selectChapter(index);
  }
`);
cut('    // O capítulo ativo é sempre', '    if (y < 8)', `    const line = innerHeight * .3, deadZone = desktop.matches ? 48 : 16;
    let index = active;
    while(index < chapters.length-1 && chapters[index+1].getBoundingClientRect().top < line-deadZone) index++;
    while(index > 0 && chapters[index].getBoundingClientRect().top > line+deadZone) index--;
`);
// Up/down keep their chapter meaning; phase cards remain explicit controls.
cut('    if (chapters[active] === processEl) {', '    goToChapter(active + dir);\n  });', '');
cut('  // Processo usa um gesto por fase', '  function beginProcessPhaseTransition()', `  let processPhaseTransitioning=false, processPhaseTransitionTimer=0;
  const PROCESS_PHASE_TRANSITION_MS=760;
`);
cut('  function consumeProcessGesture(delta)', '  chapters.forEach(section', '');
h=h.replace('    // Não reaproveita a inércia do gesto que iniciou a animação.\n    resetProcessGesture();\n','');
h=h.replace('    const previousChapter = active;\n','');
h=h.replace('    if (chapters[index] === processEl && chapters[previousChapter] !== processEl) guardProcessGesture();\n','');
h=h.replace("step.addEventListener('click', () => { resetProcessGesture(); setProcessStep(i, {fromUser:true}); guardProcessGesture(90); });","step.addEventListener('click', () => setProcessStep(i, {fromUser:true}));");
// All scene decorations observe visibility; no continuous offscreen animation.
h=h.replace('  document.body.classList.add("scroll-scenes-ready");', `  document.body.classList.add("scroll-scenes-ready");
  const effectsObserver=new IntersectionObserver(entries=>{
    entries.forEach(entry=>entry.target.classList.toggle("effects-visible",entry.isIntersecting));
  });
  document.querySelectorAll('#processo,#compromissos,#faq,#contato').forEach(el=>effectsObserver.observe(el));`);
// The remaining panel background is static; pointer work would have no visual benefit.
const extra=h.indexOf('<script>\n(() => {\n  const finePointer');
if(extra>=0){const end=h.indexOf('</script>',extra);h=h.slice(0,extra)+h.slice(end+9);}
fs.writeFileSync('kirmoon_site.html', h);
console.log('Visual layout, FAQ and native scroll updated.');
