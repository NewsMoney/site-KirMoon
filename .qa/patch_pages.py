#!/usr/bin/env python3
"""KirMoon: cada página ocupa a tela inteira (desktop) e as setas do teclado
passam de página em página como slides; a roda do mouse continua livre.
Usage: python3 patch_pages.py <in.html> <out.html>   (idempotent guard; preserves CRLF)"""
import sys

src, dst = sys.argv[1], sys.argv[2]
raw = open(src, 'rb').read().decode('utf-8')
crlf = '\r\n' in raw
text = raw.replace('\r\n', '\n')
if crlf and text.replace('\n', '\r\n') != raw:
    sys.exit('mixed line endings; refusing to patch')
if 'kirmoon-full-pages' in text:
    sys.exit('full pages already present')

R = []
def rep(old, new, label):
    R.append((old, new, label))

CSS = r'''
<style id="kirmoon-full-pages">
/* Páginas inteiras no desktop: cada página ocupa a altura visível abaixo do
   cabeçalho (--km-hdr), com o conteúdo centralizado, para que a próxima
   página não apareça pela metade. */
:root{--km-hdr:80px}
@media (min-width:961px){
  #servicos .services-intro,
  #apps.service-panel,#sites.service-panel,#ti.service-panel{min-height:calc(100svh - var(--km-hdr))!important;align-content:center!important;padding-top:clamp(28px,4vh,56px)!important;padding-bottom:clamp(28px,4vh,56px)!important;box-sizing:border-box}
  main > #compromissos.section,main > #faq.section,main > #contato.section{display:grid!important;min-height:calc(100svh - var(--km-hdr))!important;box-sizing:border-box}
  main > #faq.section,main > #contato.section{align-content:center}
  /* Compromissos fica alinhado ao topo (texto mais acima), mas ocupa a tela toda. */
  main > #compromissos.section{align-content:start}
  main > #compromissos.section > .wrap,main > #faq.section > .wrap,main > #contato.section > .wrap{width:100%;min-width:0}
}
</style>
'''
rep('</head>', CSS + '</head>', 'css')

# Setas do teclado: dentro de Serviços e do capítulo final, cada toque vai
# para o início da próxima (ou anterior) página com uma transição de slide.
rep('''    if (active < 0 || chapters[active] === finalStart) return;
    if (chapters[active] === serviceStart) {
      if (!down) return;
      const serviceRect = serviceEnd?.getBoundingClientRect();
      if (!serviceRect) return;
      const boundaryTop = Math.max(0, scrollY + serviceRect.bottom - innerHeight);
      const remaining = Math.max(0, boundaryTop - scrollY);
      const projectedStep = e.key === 'PageDown' ? innerHeight * .9 : 56;
      if (remaining > projectedStep) return;
      e.preventDefault();
      if (e.repeat || sceneAnimating) return;
      ensureProcessMoonReady();
      goToChapter(2,{direction:1,keyboardKey:e.key});
      return;
    }''',
'''    if (active < 0) return;
    if (chapters[active] === serviceStart || chapters[active] === finalStart) {
      const inServices = chapters[active] === serviceStart;
      const pages = (inServices
        ? [document.querySelector('#servicos .services-intro'), document.getElementById('apps'), document.getElementById('sites'), document.getElementById('ti')]
        : [finalStart, faqEl, contactEl]).filter(Boolean);
      const hdr = top.offsetHeight;
      const tops = pages.map(p => Math.round(Math.max(0, scrollY + p.getBoundingClientRect().top - hdr)));
      const target = down ? tops.find(t => t > scrollY + 4) : [...tops].reverse().find(t => t < scrollY - 4);
      if (target === undefined && down && !inServices) return;   // fim do capítulo final: rolagem nativa até o rodapé
      e.preventDefault();
      if (e.repeat || sceneAnimating) return;
      if (target !== undefined) { slideToPage(target, e.key); return; }
      if (inServices && down) { ensureProcessMoonReady(); goToChapter(2,{direction:1,keyboardKey:e.key}); return; }
      if (inServices) { goToChapter(0,{direction:-1,keyboardKey:e.key}); return; }
      ensureProcessMoonReady();
      goToChapter(2,{direction:-1,keyboardKey:e.key});
      return;
    }''', 'keyboard pages')

rep('''  addEventListener('keyup',e=>{if(heldNavigationKey===e.key)heldNavigationKey=null;});''',
'''  addEventListener('keyup',e=>{if(heldNavigationKey===e.key)heldNavigationKey=null;});
  // Passagem de página dentro de um capítulo: mesma interpolação das cenas,
  // mais curta, sem trocar de capítulo.
  const PAGE_SCENE_PROFILE = Object.freeze({ minDuration: 620, maxDuration: 900, baseDuration: 560, distanceFactor: .14 });
  function slideToPage(targetTop, key) {
    if (serviceBoundaryMode) stopServiceBoundaryMode();
    if (serviceReturnBoundaryMode) stopServiceReturnBoundaryMode();
    if (finalBoundaryMode) stopFinalBoundaryMode();
    heldNavigationKey = key;
    if (reduce) { scrollTo({top:targetTop, behavior:'instant'}); queueScroll(); return; }
    animateSceneTo(targetTop, () => queueScroll(), PAGE_SCENE_PROFILE);
  }''', 'slideToPage')

JS = '''<script>
/* Altura do cabeçalho fixo para as páginas de tela inteira. */
(() => {
  const header = document.getElementById('top');
  if (!header) return;
  const sync = () => document.documentElement.style.setProperty('--km-hdr', header.offsetHeight + 'px');
  sync();
  new ResizeObserver(sync).observe(header);
})();
</script>
'''
rep('</body>', JS + '</body>', 'header height')

for old, new, label in R:
    n = text.count(old)
    if n != 1:
        sys.exit(f'anchor "{label}" found {n} times; aborting without writing')
    text = text.replace(old, new)
out = text.replace('\n', '\r\n') if crlf else text
open(dst, 'wb').write(out.encode('utf-8'))
print(f'patched {len(R)} sites; crlf={crlf}; {len(out.encode())} bytes')
