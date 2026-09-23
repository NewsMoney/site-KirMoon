# KirMoon: correção da rolagem Serviços → Processo (23/09/2026)

Executa o `HANDOFF_KIRMOON_SCROLL_2026-09-23.md`. Só a lógica JS do wheel e do resize mudou. HTML e CSS continuam iguais, e a geometria de todas as seções foi comparada em 1440×900, 800×900 e 1920×1080: nenhuma diferença.

- Backup: `.qa/kirmoon_site.before-scroll-fix.html` (SHA-256 `a39c47d7…882a`, igual ao validado no handoff: `fef4d532…eec1` com LF)
- Patch reaplicável: `.qa/patch_scroll.py <entrada> <saída>`. Usa substituições exatas, aborta se alguma âncora faltar e preserva o CRLF.
- Resultado: `kirmoon_site.html` com SHA-256 `07b6ca41…e3cd`

## O que foi corrigido

1. **Entrada em Processo com movimentos pequenos ou espaçados (achado 2).** Quando o deslizamento limitado já está parado na borda de Serviços, qualquer novo wheel para baixo arma a entrada. A soma de 60 com prazo de 190 ms continua valendo para gestos rápidos, que chegam à borda no meio do movimento. O caso "chegou exatamente na borda sem sobra" também passa a entrar no evento seguinte.
2. **Resize com entrada armada (achado 5.1).** Com a entrada armada, o alvo passa a acompanhar a borda nova em vez de ficar preso no valor antigo. O resize também reinicia os animadores de borda. A mesma correção vale para as bordas simétricas: Serviços → Início e Final → Processo.
3. **Resize durante a animação (achado 5.2).** `animateSceneTo` aceita um `resolveTarget`. Depois de um resize, ou de mudança de layout em `main` vista pelo ResizeObserver, o destino é recalculado. `goToChapter` e a volta Processo → Serviços passam esse resolvedor.
4. **Resize já dentro de Processo.** Antes, a tela ficava 648 px deslocada. Agora o capítulo é recentralizado.
5. **Cruzar 960/961 (achado 4).** Os estados de borda e a intenção são limpos. Ao voltar para desktop, o capítulo é recalculado pela posição.

## Não alterado, de propósito

- **Quarentena renovável (achado 1).** Ela bloqueia só enquanto o wheel continua sem pausa de 240 ms. Isso é o "um capítulo por gesto" que o teste antigo exige. Não foi a causa do travamento: esse era o item 1 acima.
- **Captura a uma altura de viewport da borda (achado 3).** Foi mantida para cancelar a cauda não cancelável do Chrome.
- **Uma fase por gesto em Processo (achado 6).** Não foi alterada.

## Testes em navegador real (Chromium via Playwright, eventos wheel reais)

`scroll-harness.cjs`: **antes 12/35, depois 35/35.** Cobre 1024×600, 1280×720, 1440×900, 1920×1080, 1920×1200 e 961×700 com:

- passos de 40 a cada 250 ms, na borda e a 200 px dela
- passos de 54 a cada 300 ms (linha do Firefox)
- entalhes de 100
- passos de 40 rápidos

Também cobre resize após armar, resize durante a transição, resize dentro de Processo, ida e volta, e breakpoint 961→960→961.

`scroll-regress.cjs`: **12/12.** Sem entrada antecipada no meio de Serviços, reversão na borda sem entrada, fases 0→1→2→3 uma por gesto, Final e volta, PageDown, movimento reduzido e rolagem nativa em 800 px.

Rodar: `npm i playwright` e depois `node .qa/scroll-harness.cjs kirmoon_site.html` (usa o Chrome local; `CHROME_PATH` permite outro).

## Ainda não verificado

- Mouse físico do usuário: os deltas reais não foram medidos.
- Trackpad do macOS com inércia longa.
- Firefox e Safari reais.
- O painel lateral do app.
- A oscilação visual relatada em telas grandes ("sobe/desce", "reposiciona") não foi reproduzida em headless. Se continuar, gravar com o painel "Diagnóstico do scroll" do próprio site e enviar o trace.
