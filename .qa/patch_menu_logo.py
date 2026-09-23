#!/usr/bin/env python3
"""KirMoon: com o menu do celular aberto, o logo grande da primeira tela ficava
por cima dos itens (cobria "Dúvidas"). Agora ele some enquanto o menu está aberto.
Usage: python3 patch_menu_logo.py <in.html> <out.html>   (preserves CRLF)"""
import sys
src, dst = sys.argv[1], sys.argv[2]
raw = open(src, 'rb').read().decode('utf-8')
crlf = '\r\n' in raw
text = raw.replace('\r\n', '\n')
if 'kirmoon-menu-logo' in text:
    sys.exit('menu logo fix already present')
old = 'body.menu-open .fab{opacity:0;pointer-events:none}\n'
if text.count(old) != 1:
    sys.exit('anchor not found once; aborting')
text = text.replace(old, old + '/* kirmoon-menu-logo: o logo não cobre o menu aberto */\nbody.menu-open .floating-brand{opacity:0!important;visibility:hidden!important;pointer-events:none!important}\n')
out = text.replace('\n', '\r\n') if crlf else text
open(dst, 'wb').write(out.encode('utf-8'))
print('ok', len(out.encode()))
