#!/usr/bin/env python3
"""KirMoon: dois acertos de toque no celular.
1) Assessoria técnica ("toque em um ponto"): qualquer toque selecionava sempre
   Monitoramento. No celular os pontos viram lista (position:static), e a área
   de toque ampliada de cada um (::before, inset:-7px) passava a cobrir a lista
   inteira; a do último ficava por cima de todas. Agora cada área de toque fica
   presa ao próprio botão.
2) Carrossel de Compromissos: depois de um toque, o :hover "gruda" no celular e
   desenhava um contorno fino em volta do card, com o texto encostado na linha
   da esquerda. Sem contorno em telas de toque/celular.
Usage: python3 patch_touch_fixes.py <in.html> <out.html>   (idempotent guard; preserves CRLF)"""
import sys

src, dst = sys.argv[1], sys.argv[2]
raw = open(src, 'rb').read().decode('utf-8')
crlf = '\r\n' in raw
text = raw.replace('\r\n', '\n')
if crlf and text.replace('\n', '\r\n') != raw:
    sys.exit('mixed line endings; refusing to patch')
if 'kirmoon-touch-fixes' in text:
    sys.exit('touch fixes already present')

CSS = r'''
<style id="kirmoon-touch-fixes">
/* Assessoria técnica no celular: a área de toque de cada ponto fica no próprio
   ponto (4px de folga, metade do espaço entre eles, sem sobreposição). */
@media (max-width:640px){
  #ti .infra-node{position:relative;left:auto;top:auto}
  #ti .infra-node::before{inset:-4px}
}
/* Carrossel: sem o contorno de hover que gruda depois de um toque. */
@media (max-width:960px),(hover:none){
  #compromissos .diagnostic-panel.cmt-carousel,
  #compromissos .diagnostic-panel.cmt-carousel:hover{box-shadow:none!important;border-color:transparent!important}
}
</style>
'''
old = '</head>'
if text.count(old) != 1:
    sys.exit('anchor </head> not found once; aborting')
text = text.replace(old, CSS + old)
out = text.replace('\n', '\r\n') if crlf else text
open(dst, 'wb').write(out.encode('utf-8'))
print(f'patched; crlf={crlf}; {len(out.encode())} bytes')
