#!/usr/bin/env python3
"""KirMoon: logo da primeira tela centralizado no celular e no tablet.
Antes ele era posicionado pela órbita e só "empurrado" para dentro da tela,
então ficava encostado à esquerda (mais espaço sobrando à direita). Agora, até
960px, as letras visíveis (do K ao N, sem o espaçamento depois do N) ficam no
centro da tela, alinhadas com a Lua. O desktop não muda.
Usage: python3 patch_hero_center.py <in.html> <out.html>   (idempotent guard; preserves CRLF)
Requer patch_mobile.py aplicado antes."""
import sys

src, dst = sys.argv[1], sys.argv[2]
raw = open(src, 'rb').read().decode('utf-8')
crlf = '\r\n' in raw
text = raw.replace('\r\n', '\n')
if crlf and text.replace('\n', '\r\n') != raw:
    sys.exit('mixed line endings; refusing to patch')
if 'inkL' in text:
    sys.exit('hero centering already present')

R = []
def rep(old, new, label):
    R.append((old, new, label))

rep('''  let cresOffsetX = 0, cresOffsetY = 0;
''', '''  let cresOffsetX = 0, cresOffsetY = 0;
  let inkL = 0, inkR = 0;   // começo do K e fim do N, sem escala
''', 'ink vars')

# As medidas vêm do próprio logo na tela (dividindo pela escala atual): a cópia
# usada em measureLogo() perde o id e sai com fonte menor (19px em vez de 21px).
rep('''  function measureGeometry(){
    measureLogo();
''', '''  function measureInk(){
    const first = brand.querySelector('.wm-text'), last = brand.querySelector('.wm-n');
    if (!first || !last) { inkL = 0; inkR = baseW; return; }
    const t = getComputedStyle(brand).transform;
    const s = (t && t !== 'none' ? new DOMMatrixReadOnly(t).a : 1) || 1;
    const b = brand.getBoundingClientRect(), fr = first.getBoundingClientRect(), lr = last.getBoundingClientRect();
    const trailing = parseFloat(getComputedStyle(last).letterSpacing) || 0;
    inkL = (fr.left - b.left) / s;
    inkR = (lr.right - b.left) / s - trailing;
  }

  function measureGeometry(){
    measureLogo();
    measureInk();
''', 'ink measure')

rep('''    heroScaleValue = getHeroScale();
    if (baseW) heroScaleValue = Math.min(heroScaleValue, (innerWidth - 40) / baseW);

    const point = getOrbitAnchor();
    startX = point.x - cresOffsetX * heroScaleValue;
    startY = point.y - cresOffsetY * heroScaleValue;
    if (innerWidth <= 960 && baseW) {
      const width = baseW * heroScaleValue;
      startX = Math.max(20 + scrollX, Math.min(startX, scrollX + innerWidth - 20 - width));
    }''', '''    heroScaleValue = getHeroScale();
    const inkW = inkR - inkL;
    const compact = innerWidth <= 960 && inkW > 0;
    if (compact) heroScaleValue = Math.min(heroScaleValue, (innerWidth - 48) / inkW);
    else if (baseW) heroScaleValue = Math.min(heroScaleValue, (innerWidth - 40) / baseW);

    const point = getOrbitAnchor();
    startX = point.x - cresOffsetX * heroScaleValue;
    startY = point.y - cresOffsetY * heroScaleValue;
    if (compact) {
      /* Celular e tablet: o nome fica centralizado na tela, com a Lua. */
      startX = scrollX + (innerWidth - inkW * heroScaleValue) / 2 - inkL * heroScaleValue;
    }''', 'center on mobile')

for old, new, label in R:
    n = text.count(old)
    if n != 1:
        sys.exit(f'anchor "{label}" found {n} times; aborting without writing')
    text = text.replace(old, new)
out = text.replace('\n', '\r\n') if crlf else text
open(dst, 'wb').write(out.encode('utf-8'))
print(f'patched {len(R)} sites; crlf={crlf}; {len(out.encode())} bytes')
