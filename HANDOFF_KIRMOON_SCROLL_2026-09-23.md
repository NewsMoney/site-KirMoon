# KirMoon — handoff para corrigir rolagem e redimensionamento

## Estado da entrega

**Os bugs de rolagem NÃO foram corrigidos nesta conversa.** Apenas a formatação do CSS foi compactada. A próxima sessão deve diagnosticar e corrigir o bloqueio entre Serviços e Processo, preservando o visual e verificando diferentes tamanhos de janela.

Projeto: `C:\Users\milto\OneDrive\Desktop\KirMoon`
Arquivo principal: `C:\Users\milto\OneDrive\Desktop\KirMoon\kirmoon_site.html`
O usuário identificou a versão pelo horário de gravação: 23/09/2026 às 14h05. Antes da compactação, tinha 9.605 linhas e 1.544.164 bytes. O próprio código identifica o build de diagnóstico como v13; não pressupor que exista um arquivo separado v13.

## Validação consolidada — 23/09/2026

**10 verificações de caracterização confirmaram o comportamento atual. Isso NÃO significa que os bugs foram corrigidos.** Foram executados a máquina de estado, o handler de wheel e os animadores extraídos do HTML principal, com relógio, geometria, rolagem e requestAnimationFrame simulados. O handler real pediu a troca de capítulo nos cenários de controle; a chamada final de navegação foi substituída por um registrador, portanto não é teste de ponta a ponta.

| Achado | Resultado | Evidência |
|---|---|---|
| Movimentos pequenos e separados na borda | Reproduzido no handler real | 12 eventos de 40 unidades, separados por 250 ms: nenhuma solicitação para Processo, mesmo após espera adicional |
| Cenários de controle | Confirmados | Dois eventos de 40 separados por 100 ms e um evento isolado de 100 solicitaram Processo |
| Movimento cujo destino coincide com a borda | Reproduzido | Alvo chegou à borda, posição terminou a menos de 0,7 pixel; sem overflow, a entrada não foi armada |
| Captura depende da altura | Confirmado | A 800 pixels da borda, evento ficou nativo com altura 600, mas foi capturado com alturas 900 e 1200 |
| Resize depois de armar a entrada | Reproduzido com geometria simulada | Altura 800 → 600: borda mudou de 1200 para 1400, mas alvo ficou em 1200; entrada armada, nenhuma solicitação e nenhum frame pendente |
| Resize durante animação | Reproduzido com geometria simulada | Destino recalculado seria 2300; animação concluiu em 2000, o destino antigo |
| Quarentena renovável | Confirmada | 40 eventos contínuos foram consumidos; pausa de 250 ms liberou o seguinte |
| Uma fase por gesto contínuo | Confirmada | Cinco segundos de eventos produziram uma mudança; novo gesto após pausa foi aceito |
| Caminho não desktop | Confirmado isoladamente | Handler não captura evento quando a condição desktop é falsa; expressão do breakpoint foi conferida estaticamente |
| Sintaxe dos scripts | Válida | Cinco scripts inline compilados sem executar o site completo |

**Limites:** não houve renderização, medição do mouse físico, avaliação real de media queries nem reprodução visual da oscilação. Os casos de resize comprovam falhas dos componentes sob a geometria simulada; a ocorrência exata na janela do usuário e o efeito de toda a integração permanecem por verificar. Passar esses testes significa reproduzir os comportamentos descritos, não aprová-los como desejáveis.

Artefatos reproduzíveis:
- Script: `C:\Users\milto\AppData\Local\Temp\validate-kirmoon-scroll.cjs`
- Relatório: `C:\Users\milto\AppData\Local\Temp\kirmoon-scroll-validation.json`
- Executar: `node C:\Users\milto\AppData\Local\Temp\validate-kirmoon-scroll.cjs`
- SHA-256 do HTML validado: `fef4d532f7346b55dd53ea6d1d2116189954a03bc68dbc0de1b2286cead7eec1`

O HTML não foi modificado nesta validação. Converter os casos de defeito em testes que exijam o comportamento corrigido antes de implementar a solução; as asserções atuais caracterizam os defeitos existentes.

## Intenção e restrições do usuário

- Usa a **rodinha do mouse**, não trackpad.
- Não consegue avançar de Serviços para Processo em algumas situações, inclusive depois de parar de rolar e esperar. Clicar fora e dentro da janela não resolveu.
- Percebe diferenças entre o navegador no painel lateral do aplicativo e uma janela maior.
- Em telas maiores, relatou pequenos movimentos de subir/descer, tentativas de reposicionar a página e ultrapassagem do espaço previsto para a transição.
- Quer comportamento consistente entre dimensões de tela, inclusive ao redimensionar, sem perder elementos visuais. Não interpretar isso como pedido de dimensões fixas ou de remover a responsividade.
- Pediu inicialmente trabalho sem delegação. Demonstrou preocupação com consumo de uso; manter o trabalho objetivo.
- O pedido atual é gerar este handoff, não aplicar uma correção agora.

## O que foi realmente alterado

Somente espaços e quebras de linha dos 12 blocos CSS foram normalizados, mantendo strings, comentários, escapes, tokens, limites de espaços e ordem das regras. HTML fora desses blocos, scripts e imagens incorporadas permaneceram idênticos.

Resultado registrado: 5.824 linhas e 1.528.853 bytes, redução de aproximadamente 39% nas linhas e 1% nos bytes. Cerca de 72% do tamanho original vinha de imagens incorporadas. Isso NÃO é simplificação estrutural nem correção de desempenho.

Artefatos existentes:
- Backup anterior à compactação: `C:\Users\milto\OneDrive\Desktop\KirMoon\.qa\kirmoon_site.before-compaction-1405.html`
- Script usado: `C:\Users\milto\OneDrive\Desktop\KirMoon\.qa\compact-styles.cjs`

O script verificou equivalência do conteúdo fora dos estilos e assinatura dos tokens/espaços CSS. Os cinco scripts inline passaram por verificação de sintaxe com `vm.Script`. **Não houve comparação visual em navegador.** Não executar novamente o compactador sem entender sua proteção contra sobrescrever o backup.

## Achados confirmados no código e testes isolados

As linhas abaixo são referências após a compactação; localizar por nome se o arquivo mudar.

### 1. Quarentena da rolagem renovada indefinidamente

`createSceneFlowMachine`, aproximadamente linha 3205, controla a navegação. `observeWheel` consome eventos durante animação. Após uma transição, `releaseUntil` recebe o instante final mais `quietMs=240`. Cada evento na mesma direção, recebido antes desse prazo, renova o prazo por outros 240 ms.

Teste em memória executou a função real extraída do HTML com Node/vm: completou a transição no instante 1000 e enviou 40 eventos a intervalos de 100 ms, entre 1100 e 5000. Todos foram consumidos. Um evento após 250 ms de silêncio foi liberado.

Isso comprova que rolagem contínua pode prolongar o bloqueio. Não comprova que seja a única causa do travamento da janela do usuário.

### 2. Limiar de entrada em Processo pode nunca ser atingido

Trechos: `addServiceBoundaryIntent` / `resetServiceBoundaryIntent`, aproximadamente linhas 3710–3720; ramo de Serviços do handler de wheel, aproximadamente linhas 3960–4010.

A entrada exige acumular 60 unidades de movimento que exceda a borda (`overflow`). Cada contribuição é limitada a 72 e a soma expira após 190 ms. Chegar à borda por si só não ativa `serviceBoundaryEntryReady`.

Teste em memória executou as funções reais de acumulação com temporizadores simulados e 12 contribuições, representando o mouse já na borda:

| Contribuição | Intervalo | Maior soma | Atingiu 60? |
|---|---|---|---|
| 40 | 250 ms | 40 | Não |
| 40 | 100 ms | 480 | Sim |
| 100 | 250 ms | 72 | Sim |

Logo, movimentos pequenos e separados podem ficar presos indefinidamente. Esperar não resolve esse cenário: a espera apaga o progresso. **Os deltas reais do mouse do usuário ainda não foram medidos.** A validação posterior salvou um script de caracterização reproduzível e ampliou a cobertura ao handler real; consultar a seção de validação consolidada.

### 3. Área de controle depende da altura da janela

O handler assume controle da descida de Serviços quando:
`distanceToBottomBoundary <= Math.max(innerHeight, magnitude * 2)`.

Para movimentos pequenos, começa a uma altura inteira de viewport da borda. Alturas de 600, 900 e 1200 produzem distâncias de captura de 600, 900 e 1200 pixels. Isso explica uma diferença verificável no ponto em que o controle deixa de ser nativo; não comprova por si só o bug visual relatado.

**Não remover essa antecipação indiscriminadamente:** comentários e testes antigos indicam que ela foi introduzida para capturar o gesto antes de a cauda do wheel se tornar não cancelável no Chrome. Avaliar esse risco com testes reais.

### 4. Modo de navegação muda com largura e tipo de ponteiro

`desktop = matchMedia("(min-width: 961px) and (pointer: fine)")`, aproximadamente linha 3191. Abaixo do limiar, há outro caminho de navegação e detecção de capítulo pela posição. Testar ambos os lados de 960/961, além de diferentes alturas.

### 5. Redimensionamento — falhas reproduzidas em simulação

`animateSceneTo`, aproximadamente linha 3830, captura início, destino e distância uma vez para a animação. O listener principal de resize apenas chama `queueScroll()` e `updateProcessShade()`.

Dois casos foram posteriormente reproduzidos com o código real extraído:

1. Armar a entrada em Processo na borda e diminuir a altura antes do próximo frame faz a borda avançar, mas `serviceBoundaryTarget = Math.min(serviceBoundaryTarget, boundaryTop)` conserva o alvo antigo. O animador para de pedir frames ao alcançar esse alvo, embora a entrada continue armada longe da borda nova.
2. Alterar a geometria de Processo durante a animação não altera seu destino já capturado. No teste, a animação concluiu 300 pixels antes do destino correto para a geometria nova.

A integração completa ainda precisa ser testada: o caminho não desktop de `updateScroll` também atualiza o capítulo por posição. A oscilação visual relatada pelo usuário e o cruzamento de breakpoint não foram reproduzidos em navegador. Não confundir falha isolada confirmada com diagnóstico fechado de todos os sintomas.

### 6. Etapas internas de Processo

`consumePhaseWheel` permite uma etapa por gesto e exige intervalo de pelo menos 220 ms para reconhecer outro gesto. Em teste isolado, cinco segundos de eventos contínuos avançaram apenas uma vez; uma pausa permitiu novo avanço.

Esse comportamento foi identificado, mas o usuário localizou o problema prioritário na entrada Serviços → Processo. Não ampliar a alteração das etapas sem validar a intenção e os efeitos.

## Próxima execução sugerida

1. Conferir o arquivo atual e preservar a compactação. Guardar backup antes de alterar a lógica.
2. Usar o script de caracterização salvo para criar regressão que exija a correção no caminho de entrada Serviços → Processo. Cobrir movimentos pequenos e espaçados, movimentos rápidos, reversão e chegada exata à borda sem overflow.
3. Considerar liberar a transição quando o movimento alcançar a borda, sem depender de uma soma de overflow com prazo curto. É uma proposta ainda não aplicada, que precisa respeitar a animação e impedir saltos de capítulo.
4. Avaliar a quarentena pós-transição separadamente: impedir bloqueio indefinido sem transformar inércia em múltiplas trocas de etapas.
5. Expandir os casos de resize já reproduzidos em simulação para a integração completa: durante aproximação da borda, durante animação, já dentro de Processo e atravessando 960/961. O estado lógico, posição final e destino devem permanecer coerentes.
6. Validar com navegador permitido em tamanhos como 960/961, 1024, 1440 e 1920 de largura e alturas variadas, incluindo janela baixa. Medir dimensões reais; não presumir o tamanho do painel lateral.
7. Confirmar ida e volta, wheel, teclado, cliques de navegação, modo de movimento reduzido e navegação em telas estreitas. Comparar visual antes/depois para garantir que espaçamentos, animações e componentes sejam preservados.
8. Relatar separadamente o que foi corrigido, o que passou nos testes e o que ainda não foi verificado. Não garantir ausência de bugs em todas as telas com base apenas em testes de lógica.

## Evidência disponível e limitações

A captura durante a sessão de voz informou somente um navegador no painel lateral; não mostrou dimensões nem a reprodução visual. A sessão de voz terminou. Não usar ferramentas exclusivas de voz agora.

O contexto ambiente posterior mostrou o HTML principal aberto em `#processo`; isso não demonstra que o travamento foi corrigido nem identifica como o usuário chegou lá.

Referência histórica consultada: `C:\Users\milto\OneDrive\Desktop\KirMoon\HANDOFF_KIRMOON_OTIMIZACAO_v08.md`. Registra o propósito da quarentena, a autoridade única do controlador e a interpolação aprovada. É documentação de uma versão anterior: não substituir o HTML principal por v08.

Há testes e traces históricos em `.qa`, incluindo:
- `.qa\scroll-flow-controller-v08.cjs` (lê a versão v08, não o arquivo principal)
- `.qa\scroll-boundary-trace-v12.cjs` (lê v12 e traces antigos)
- `.qa\services-v13-regression.cjs` (referencia um arquivo v13 que não apareceu no inventário desta sessão)
- `.qa\process-boundary-regression.cjs`
- `kirmoon-scroll-trace.json` e variantes numeradas de (1) a (4)

Inspecionar antes de reutilizar: versões antigas e testes por regex não comprovam comportamento atual. O teste antigo da máquina explicitamente espera renovação da quarentena; mudar esse comportamento exige atualizar a especificação consciente desse propósito.

Node disponível em `C:\Program Files\nodejs\node.exe`. Scripts históricos usam Playwright e Chrome local, mas não foram executados nesta conversa. Respeitar as ferramentas e restrições de navegador da próxima sessão; não contornar bloqueios anteriores.

## Suggested skills / skills sugeridas

- `diagnose`: reproduzir, minimizar, testar hipóteses e verificar a correção com regressão no caminho real. Sua skill já foi lida nesta conversa.
- `computer-use:computer-use`: se disponível e permitido na próxima sessão, para observar e reproduzir a interação visual. Não inferir permissão ou disponibilidade apenas de testes históricos.
- `review`: opcional após a correção, para revisar escopo, preservação do visual e consistência do estado.

Não foi criada configuração de issue tracker, AGENTS.md ou documentação de domínio nesta conversa. Evitar transformar a correção local em uma configuração administrativa desnecessária.