#!/usr/bin/env python3
"""KirMoon: ajustes da versão mobile (sobreposições, cortes e respiros).
Usage: python3 patch_mobile.py <in.html> <out.html>   (idempotent guard; preserves CRLF)"""
import sys

src, dst = sys.argv[1], sys.argv[2]
raw = open(src, 'rb').read().decode('utf-8')
crlf = '\r\n' in raw
text = raw.replace('\r\n', '\n')
if crlf and text.replace('\n', '\r\n') != raw:
    sys.exit('mixed line endings; refusing to patch')
if 'kirmoon-mobile-polish' in text:
    sys.exit('mobile polish already present')

R = []
def rep(old, new, label):
    R.append((old, new, label))

# 1) Logo grande da primeira tela: no celular ele saía cortado à esquerda
#    ("IRMOON"). Agora cabe na largura com 20px de margem e fica dentro da tela.
rep('''    heroScaleValue = getHeroScale();

    const point = getOrbitAnchor();
    startX = point.x - cresOffsetX * heroScaleValue;
    startY = point.y - cresOffsetY * heroScaleValue;''',
'''    heroScaleValue = getHeroScale();
    if (baseW) heroScaleValue = Math.min(heroScaleValue, (innerWidth - 40) / baseW);

    const point = getOrbitAnchor();
    startX = point.x - cresOffsetX * heroScaleValue;
    startY = point.y - cresOffsetY * heroScaleValue;
    if (innerWidth <= 960 && baseW) {
      const width = baseW * heroScaleValue;
      startX = Math.max(20 + scrollX, Math.min(startX, scrollX + innerWidth - 20 - width));
    }''', 'hero logo fit')

CSS = r'''
<style id="kirmoon-mobile-polish">
/* Mobile: nada se sobrepõe ao texto, respiros mais regulares entre as
   páginas e nada escondido pelo botão flutuante do WhatsApp. */
@media (max-width:960px){
  /* Cabeçalho mais sólido: o texto que rola por baixo não aparece através dele. */
  .top.solid{background:rgba(5,7,11,.94)!important}

  /* Respiros entre páginas: menos vazio entre um serviço e o próximo. */
  #apps.service-panel,#sites.service-panel,#ti.service-panel{padding-top:64px!important;padding-bottom:44px!important}
  #servicos .services-intro{padding-bottom:40px!important}
  main > #compromissos.section,main > #faq.section,main > #contato.section{padding-top:64px!important;padding-bottom:48px!important}

  /* Dúvidas: Júpiter sai de trás do título e vai para o canto de cima. */
  #faq .faq-grid{padding-top:128px!important;row-gap:22px!important}
  #faq .faq-list{padding-top:4px!important}
  #faq .faq-celestial,#faq .faq-celestial.is-3d{left:auto!important;right:-6px!important;top:-6px!important;width:136px!important;height:136px!important;opacity:.78!important;transform:none!important}
  #faq .faq-aside{display:block!important;justify-items:start!important;width:100%!important;padding:0!important;text-align:left!important}
  #faq .faq-aside h2{width:100%!important;max-width:100%!important;margin:0!important;text-align:left!important}
  #faq.section .faq-grid .faq-aside > p{margin:18px 0 0!important;max-width:34em!important;text-align:left!important}

  /* Contato: a Terra sai de trás dos canais de contato e vai para o topo. */
  #contato .contact-copy{padding-top:126px!important}
  #contato .contact-moon,#contato .contact-moon.is-3d{left:auto!important;right:0!important;top:-4px!important;width:118px!important;height:118px!important;opacity:.85!important;transform:none!important}

  /* Compromissos no tablet: o card do carrossel alinha à esquerda, com o resto da coluna. */
  #compromissos .cmt-carousel .cmt-stage{margin-left:-6px!important;max-width:572px!important}
  #compromissos .cmt-carousel .cmt-controls{margin-left:0!important;max-width:560px!important}
  #compromissos .cmt-carousel .cmt-orbit{left:calc(min(100%,560px) / 2)!important}

  /* O botão flutuante do WhatsApp não cobre o fim do rodapé. */
  footer{padding-bottom:calc(92px + env(safe-area-inset-bottom,0px))!important}
}

/* Mapa de missão no celular: vira uma rota vertical — os três destinos em
   coluna, a linha da rota à esquerda e a nave parada ao lado do destino ativo. */
@media (max-width:560px){
  #servicos .mission-map{min-height:0!important;display:flex;flex-direction:column;gap:14px;padding:54px 16px 20px 72px;border-radius:22px}
  #servicos .mission-route{display:none}
  #servicos .mission-map::after{content:"";position:absolute;left:43px;top:78px;bottom:52px;width:1px;background:repeating-linear-gradient(180deg,rgba(211,224,240,.35) 0 2px,transparent 2px 8px);pointer-events:none}
  #servicos .mission-waypoint{position:relative!important;left:auto!important;right:auto!important;top:auto!important;bottom:auto!important;width:100%!important;height:88px;min-height:88px!important;padding:14px!important;transform:none!important}
  #servicos .mission-waypoint:hover,#servicos .mission-waypoint.is-active{transform:none!important}
  #servicos .mission-ship{left:20px!important;width:46px!important;height:46px!important;transition:top .45s cubic-bezier(.2,.75,.2,1)}
  #servicos .mission-ship svg{width:30px;height:16px}
  #servicos .mission-map[data-active="0"] .mission-ship{top:75px!important}
  #servicos .mission-map[data-active="1"] .mission-ship{top:177px!important}
  #servicos .mission-map[data-active="2"] .mission-ship{top:279px!important}
}
</style>
'''
rep('</head>', CSS + '</head>', 'css')

for old, new, label in R:
    n = text.count(old)
    if n != 1:
        sys.exit(f'anchor "{label}" found {n} times; aborting without writing')
    text = text.replace(old, new)
out = text.replace('\n', '\r\n') if crlf else text
open(dst, 'wb').write(out.encode('utf-8'))
print(f'patched {len(R)} sites; crlf={crlf}; {len(out.encode())} bytes')
