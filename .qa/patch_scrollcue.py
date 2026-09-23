#!/usr/bin/env python3
"""KirMoon: indicador de rolagem em forma de foguete na primeira tela (hero).
Usage: python3 patch_scrollcue.py <in.html> <out.html>   (idempotent guard; preserves CRLF)"""
import sys

src, dst = sys.argv[1], sys.argv[2]
raw = open(src, 'rb').read().decode('utf-8')
crlf = '\r\n' in raw
text = raw.replace('\r\n', '\n')
if crlf and text.replace('\n', '\r\n') != raw:
    sys.exit('mixed line endings; refusing to patch')
if 'class="scroll-rocket"' in text:
    sys.exit('scroll rocket already present')

R = []
def rep(old, new, label):
    R.append((old, new, label))

# Nave espacial minimalista, de nariz para baixo (rumo ao conteúdo), sem chama: fuselagem fina,
# asas em delta e cabine; a seta logo abaixo indica a rolagem.
HTML = '''    <a class="scroll-rocket" href="#servicos" aria-label="Rolar para Serviços">
      <svg viewBox="0 2 32 52" aria-hidden="true" focusable="false">
        <g class="scroll-rocket-ship"><g transform="rotate(180 16 18.7)">
          <path d="M16 5c1.9 2.8 3.2 6.6 3.6 11.2l.4 10.8-4 3-4-3 .4-10.8C12.8 11.6 14.1 7.8 16 5z"/>
          <path d="M12.5 17.5 5 28.5l7.2-1.8M19.5 17.5 27 28.5l-7.2-1.8"/>
          <path d="M16 11.2c.8 1.1 1.2 2.3 1.2 3.6h-2.4c0-1.3.4-2.5 1.2-3.6z"/>
          <path d="M14.2 30.6v1.8M17.8 30.6v1.8"/>
        </g></g>
        <path class="scroll-rocket-chevron" d="M11.5 44 16 48.5l4.5-4.5"/>
      </svg>
    </a>
'''
# O foguete substitui o texto "Role para conhecer a Kirmoon".
rep('''    <p class="hint">Role para conhecer a Kirmoon</p>
  </section>''',
HTML + '''  </section>''', 'hero markup')

CSS = r'''
<style id="kirmoon-scroll-rocket">
/* Indicador de rolagem: nave minimalista que sobe e desce devagar; a
   seta abaixo pulsa um pouco atrasada, como no ícone de mouse. */
.hero .scroll-rocket{position:absolute;z-index:3;left:50%;bottom:58px;translate:-50% 0;display:grid;place-items:center;width:48px;height:72px;color:var(--lunar);opacity:.78;text-decoration:none;border-radius:24px;transition:opacity .25s ease}
.hero .scroll-rocket:hover{opacity:1}
.hero .scroll-rocket:focus-visible{outline:2px solid var(--glow);outline-offset:2px;opacity:1}
.hero .scroll-rocket svg{width:28px;height:46px;overflow:visible}
.hero .scroll-rocket path,.hero .scroll-rocket circle{fill:none;stroke:currentColor;stroke-width:1.4;stroke-linecap:round;stroke-linejoin:round;vector-effect:non-scaling-stroke}
.hero .scroll-rocket-ship{animation:kmRocketBob 1.9s cubic-bezier(.45,0,.55,1) infinite}
.hero .scroll-rocket-chevron{animation:kmRocketChevron 1.9s cubic-bezier(.45,0,.55,1) infinite;opacity:.7}
@keyframes kmRocketBob{0%,100%{transform:translateY(-3px)}50%{transform:translateY(5px)}}
@keyframes kmRocketChevron{0%,100%{transform:translateY(-1px);opacity:.35}55%{transform:translateY(4px);opacity:.85}}
@media (max-width:960px){.hero .scroll-rocket{bottom:18px}}
@media (min-width:961px) and (max-height:700px){.hero .scroll-rocket{bottom:36px;height:60px}.hero .scroll-rocket svg{height:40px}}
@media (prefers-reduced-motion:reduce){.hero .scroll-rocket-ship,.hero .scroll-rocket-chevron{animation:none}}
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
