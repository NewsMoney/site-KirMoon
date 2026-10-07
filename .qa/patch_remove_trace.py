#!/usr/bin/env python3
"""KirMoon: remove o painel de teste "Diagnóstico do scroll" (SCROLL-TRACE).
scrollTrace vira um objeto vazio, então as chamadas de log não fazem nada.
Usage: python3 patch_remove_trace.py <in.html> <out.html>   (preserves CRLF)"""
import sys
src, dst = sys.argv[1], sys.argv[2]
text = open(src, 'rb').read().decode('utf-8')
nl = '\r\n' if '\r\n' in text else '\n'
start = '  // [SCROLL-TRACE] Opt-in trace stays in this test version until visual validation.'
end = '      if (recording) log(\'wheel-out\',{eventId:wheelIds.get(e),defaultPrevented:e.defaultPrevented,target:targetKind(e.target)});' + nl + '    }};' + nl + '  })();' + nl
if text.count(start) != 1 or text.count(end) != 1:
    sys.exit('trace block anchors not found exactly once; aborting')
a = text.index(start); b = text.index(end) + len(end)
if not (a < b and b - a < 12000):
    sys.exit('unexpected trace block span; aborting')
text = text[:a] + '  const scrollTrace = { log() {} };' + nl + text[b:]
wl = "  addEventListener('wheel', e => scrollTrace.afterWheel(e), {passive:true});" + nl
if text.count(wl) != 1:
    sys.exit('afterWheel listener not found once; aborting')
text = text.replace(wl, '')
if 'Diagnóstico do scroll' in text or 'afterWheel' in text:
    sys.exit('leftover trace code; aborting')
open(dst, 'wb').write(text.encode('utf-8'))
print('ok', len(text.encode()))
