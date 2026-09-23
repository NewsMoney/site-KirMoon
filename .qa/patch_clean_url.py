#!/usr/bin/env python3
"""KirMoon: endereço limpo. A barra do navegador mostra só "kirmoon.com",
sem #servicos, #processo, #contato etc. A navegação entre seções não muda.
Usage: python3 patch_clean_url.py <in.html> <out.html>   (idempotent guard; preserves CRLF)"""
import sys

src, dst = sys.argv[1], sys.argv[2]
raw = open(src, 'rb').read().decode('utf-8')
crlf = '\r\n' in raw
text = raw.replace('\r\n', '\n')
if crlf and text.replace('\n', '\r\n') != raw:
    sys.exit('mixed line endings; refusing to patch')
if 'kirmoon-clean-url' in text:
    sys.exit('clean url already present')

JS = r'''<script id="kirmoon-clean-url">
/* Endereço limpo: nenhuma seção aparece na URL (#servicos, #processo...).
   - pushState/replaceState da página passam a gravar só o caminho, sem o #;
     se o endereço não mudar, nada é gravado (sem entradas repetidas no
     histórico e sem o limite de chamadas do Safari).
   - Links internos que a página não trata (#apps, #faq no celular...) rolam
     até a seção sem mexer na URL.
   - Quem chega por um link antigo (kirmoon.com/#contato) ainda cai na seção
     certa; depois do carregamento o # some do endereço.
   A seção atual fica em <html data-km-hash> (usado pelos testes). */
(() => {
  const root = document.documentElement;
  const push = history.pushState.bind(history);
  const replace = history.replaceState.bind(history);
  const here = () => location.pathname + location.search;
  const write = (method, state, title, url) => {
    if (url == null || url === '') return method(state, title, url);
    const u = new URL(String(url), location.href);
    if (u.origin !== location.origin) return method(state, title, url);
    if (u.hash) root.dataset.kmHash = u.hash;
    const next = u.pathname + u.search;
    if (next === here() && !location.hash) return;
    return method(state, title, next);
  };
  history.pushState = (state, title, url) => write(push, state, title, url);
  history.replaceState = (state, title, url) => write(replace, state, title, url);

  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  document.addEventListener('click', e => {
    if (e.defaultPrevented || e.button || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
    const a = e.target instanceof Element ? e.target.closest('a[href^="#"]') : null;
    if (!a) return;
    const href = a.getAttribute('href');
    if (href === '#') { e.preventDefault(); return; }   // links ainda sem destino
    let target = null;
    try { target = document.getElementById(decodeURIComponent(href.slice(1))); } catch {}
    if (!target) return;
    e.preventDefault();
    root.dataset.kmHash = href;
    target.scrollIntoView({behavior: reduce.matches ? 'instant' : 'smooth', block: 'start'});
  });

  const arrivedWith = location.hash;   // a própria página pode limpar o # antes do load
  if (arrivedWith) root.dataset.kmHash = arrivedWith;
  addEventListener('load', () => setTimeout(() => {
    if (location.hash) replace(history.state, '', here());
    if (!arrivedWith) return;
    let id = '';
    try { id = decodeURIComponent(arrivedWith.slice(1)); } catch {}
    // Início, Serviços e Processo já são posicionados pelo controle de capítulos.
    if (['inicio', 'servicos', 'processo'].includes(id)) return;
    const el = id && document.getElementById(id);
    if (!el) return;
    const header = document.getElementById('top');
    scrollTo({top: Math.max(0, scrollY + el.getBoundingClientRect().top - (header ? header.offsetHeight : 0)), behavior: 'instant'});
  }, 0), {once: true});
})();
</script>
'''

old = '</head>'
if text.count(old) != 1:
    sys.exit('anchor </head> not found once; aborting')
text = text.replace(old, JS + old)
out = text.replace('\n', '\r\n') if crlf else text
open(dst, 'wb').write(out.encode('utf-8'))
print(f'patched; crlf={crlf}; {len(out.encode())} bytes')
