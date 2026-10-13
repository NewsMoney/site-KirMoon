# Idioma por país e rodapé — preparado em 11/10/2026

Estado: idioma, rodapé, rota e página de privacidade publicados após autorização explícita. A redação recebeu aprovação explícita e o ajuste final de vocabulário foi incorporado. A página foi copiada sem alterações da versão atual do Admin para `km-stats/privacy.html`; seu SHA-256 consta no manifesto. A fonte do HTML inicial é a página pública atual, cujo SHA-256 também está no manifesto. O HTML GitHub anterior não foi usado como base de publicação, pois ainda não continha a integração de estatísticas. Scripts e estilos inline e seus hashes CSP permaneceram iguais.

## Regra e migração

1. Um valor válido já salvo em `kirmoon-language` (`pt-BR`, `es`, `en`) continua prevalecendo.
2. Sem esse valor, o navegador recebe imediatamente o fallback de seu idioma principal: prefixo `pt` → `pt-BR`, prefixo `es` → `es`, demais → `en`.
3. O site consulta `GET /km-stats/locale.php` no próprio domínio. Se a indicação do servidor chegar em até 1,8 segundo, ela substitui o fallback, exceto se o visitante já tiver feito uma escolha manual.
4. Uma troca pelo seletor grava `kirmoon-language` e o marcador `kirmoon-language-choice=manual-v1`. Detecção automática nova não grava uma preferência manual.

A versão antiga gravava o idioma automático e a escolha manual na mesma chave. Não é possível reconstruir a origem do valor antigo. Para não apagar uma possível escolha manual, qualquer valor antigo válido é conservado. Isso significa que visitantes antigos com português automático salvo continuarão em português até fazerem outra escolha ou apagarem os dados do site. Não há migração silenciosa que apague esses valores.

A consulta pode causar uma breve troca do idioma do navegador para o do país. Se o país não for determinado, houver falha, bloqueio ou demora, o fallback já exibido continua funcional. Não há `navigator.geolocation`, GPS, pedido de localização, bloqueio de acesso ou chamada a serviço externo com IP.

O mapa explícito do produto está em `km-stats/locale.php`. Português: BR, PT, AO, CV, GW, MZ, ST, TL. Espanhol: ES, MX, AR, BO, CL, CO, CR, CU, DO, EC, SV, GQ, GT, HN, NI, PA, PY, PE, PR, UY, VE. Demais códigos de país determinados: inglês. `ZZ` representa país não determinado e devolve `locale:null`. Essa lista é uma regra do produto, não uma inferência sobre o idioma pessoal do visitante; GQ está no grupo espanhol.

## Adaptador de servidor

`locale.php` usa as funções `kmTrafficClientIp` e `kmTrafficCountry` do `traffic.php` preparado no projeto Admin KirMoon. Usa a mesma configuração privada: `dirname(__DIR__, 2) . '/kirmoon-analytics-config.php'` (normalmente HOME quando instalado em HOME/public_html/km-stats).

O contrato é JSON contendo apenas `locale`: `pt-BR`, `es`, `en` ou `null`. Não retorna país/IP, cria cookies, inicia sessão, persiste IP ou transmite IP a terceiros. Envia `Cache-Control: private, no-store, max-age=0` para impedir que um intermediário reutilize a indicação para outro visitante. A requisição do navegador omite cookies. Apenas GET é permitido.

O helper rejeita headers de encaminhamento quando a origem não pertence a um proxy configurado como confiável. Não aceite um país enviado pela query string ou por headers públicos livres.

A base offline DB-IP SQLite foi instalada fora das pastas públicas, com PHP PDO SQLite, pelo fluxo incremental de estatísticas do Admin. A base não está no ZIP do site: pertence ao pacote incremental de estatísticas. Sem helper, configuração, driver ou base, o adaptador devolve `locale:null`. Nenhum proxy confiável foi inventado: a configuração ficou vazia na ausência de evidência. A geolocalização continua sendo uma estimativa.

Na hospedagem, `mod_expires` acrescentava `max-age=86400` ao JSON. Foi aplicado o bloco `docs/locale-cache.htaccess` somente a `locale.php`, desligando expiração e fixando `Cache-Control: private, no-store, max-age=0`. A resposta final foi conferida por HTTPS. O cache dos demais recursos foi preservado.

## Rodapé e destino

A faixa longa `.km-usage-notice` foi removida. Foi adicionado somente o link “Termos de uso e privacidade” após Contato na navegação existente, com tradução do rótulo para inglês e espanhol pelo mesmo motor do site. Nenhum estilo inline foi alterado.

O destino público passa a ser `/privacy`. O bloco `KIRMOON PRIVACY ROUTE` em `.htaccess` reescreve internamente para `km-stats/privacy.html`. O endereço antigo e `/privacy/` redirecionam para `/privacy` com status 308. O redirecionamento antigo depende de `THE_REQUEST`, que representa o pedido original do navegador, e a reescrita usa `[END]`; assim a reescrita interna não dispara de novo o redirecionamento. As regras se aplicam somente ao domínio principal e www. A CSP da página inicial fica igual; a página de privacidade recebe sua própria CSP sem scripts.

`km-stats/privacy.html` e `km-stats/notice.css` vieram da versão aprovada preparada no Admin. O CSS tem caminho absoluto `/km-stats/notice.css`, necessário ao servir a URL curta. A página permanece em português, apresenta seis parágrafos breves sobre finalidade, dados registrados, exclusões, hospedagem e uso interno, retenção e acesso restrito. Aponta para os termos existentes de `/device-lab/terms.html`; não cria um contrato genérico. Não contém referências públicas a salas, autenticação, perfis ou rotas privadas, nem detalhes de VPNs/proxies ou classificação de automação. O rastreador publicado e seus controles de acesso foram preservados.

A frase final aprovada é: “Não são comercializados nem disponibilizados a terceiros, e não são enviados a plataformas externas de análise.” Ela se refere aos dados estatísticos. Dados necessários ao funcionamento e à segurança dos serviços continuam tratados separadamente. As versões de trabalho em `drafts/` são históricas e não integram o pacote final. A publicação recebeu autorização explícita posterior.

## Instalação

O pacote `public_html` contém cinco arquivos: o index atual com as mudanças, o novo JS de idioma, o adaptador PHP, a página aprovada e seu CSS. O pacote não contém um `.htaccess` completo, configuração privada, banco de países, painel Admin nem ferramentas. Inclui os blocos restritos de rota e de cache para mesclar nas configurações atuais. A base de país foi instalada na publicação conjunta com o incremento do Admin.

1. Baixe/guarde o `index.html` atual da hospedagem. Confira se seu SHA-256 corresponde ao `baseline_sha256` do manifesto. Se o site tiver mudado, não sobrescreva com o index deste pacote; rebaseie o patch.
2. Alternativamente, rode `node scripts/patch-index.cjs INDEX_ATUAL.html INDEX_PREPARADO.html`. O comando só aplica as duas mudanças sobre a base exata validada e recusa outra versão.
3. Envie os arquivos auxiliares para seus caminhos relativos, preservando o conteúdo existente de `km-stats/` e o controle de acesso próprio do Admin. Mescle somente o bloco `KIRMOON PRIVACY ROUTE` na configuração atual do Apache, após o redirecionamento HTTPS e antes de regras gerais; não substitua o `.htaccess` inteiro por uma cópia antiga. `scripts/merge-privacy-route.cjs HTACCESS_ATUAL HTACCESS_PREPARADO` preserva todas as outras regras e usa o marcador de proteção conhecido. Se o marcador não existir, o script recusa a mescla automática. Acrescente `docs/locale-cache.htaccess` ao `.htaccess` já existente do coletor, preservando seus bloqueios. Instale o index por último. Preserve a CSP existente. O JS tem nome novo com hash para evitar cache antigo.
4. Pelo fluxo Admin, instale `traffic.php`, base privada DB-IP, configuração e proxies efetivamente confiáveis. Sem isso, o fallback de navegador funciona, mas país real não será determinado.
5. Verifique primeiro `/km-stats/locale.php` (somente idioma ou null, sem IP), depois o rodapé e a troca manual em uma sessão nova. Não é necessário dar acesso a localização no navegador.

Para reverter, restaure o index guardado e retire somente o bloco de rota adicionado. O JS antigo foi mantido no repositório. Preserve a configuração e os arquivos do Admin.

## Evidências

Os testes locais usam Chrome em contextos temporários e a CSP original. O rastreador foi bloqueado nos testes. As respostas BR/MX/US são fixtures declaradas, não acessos de IPs desses países.

Verificados: país com navegador inglês, país EUA com navegador português, navegador pt-BR/pt-PT/es-ES/es-MX/en-US/fr-FR quando o país é desconhecido, falha/valor inválido/timeout, preferências manuais e antigas, valor antigo inválido, storage bloqueado, escolha manual durante resposta pendente, link e página de destino, rodapé sem overflow no celular e desktop e todos os hashes inline da CSP.

Testes PHP incluem mapa de países, ausência de configuração e integração offline com o helper real, usando uma base SQLite fabricada sem IPs de visitantes. Foram conferidos também origem desconhecida e header de proxy forjado. Testes no Apache 2.4.66 local confirmaram `/privacy` com 200, URLs antiga e com barra/query com um redirecionamento seguido de 200, sem loop, e a CSP da página inicial idêntica. TLS foi verificado com certificado temporário local válido, sem desativar a verificação.

A página final teve comparação byte a byte com a versão aprovada do Admin. No Chrome, foram conferidos os seis parágrafos, a frase final, o CSS carregado com a CSP sem scripts, o link dos termos do Device Lab, o redirecionamento antigo e ausência de overflow em 390 e 1280 px. A integração do texto não alterou o JS de idioma nem o index já validados.

Fonte legível do motor atualizado: `src/site-language.js`. `scripts/build-language.cjs` usa Terser 5.51.2 para gerar o asset com hash e ajustar apenas sua referência no index. O servidor não necessita Node. Testes e capturas estão no workspace Desktop/KirMoon em `output/site-update-20261011`.

Referências da rota: [Apache THE_REQUEST](https://httpd.apache.org/docs/2.4/mod/mod_rewrite.html#rewritecond) e [Apache END](https://httpd.apache.org/docs/2.4/rewrite/flags.html#flag_end).

## Publicação verificada

Foram aplicados 42 arquivos na publicação conjunta do site e incremento de estatísticas, com backup privado anterior e snapshot SQLite consistente. O incremento preservou Editor, configurações, HTMLs das salas, segredo da coleta, histórico e cron de manutenção. Mesclou somente font-src no CSP administrativo, proteções das bibliotecas e inclusão de traffic.php para salas futuras; não substituiu index/boot/importador administrativos por cópias antigas.

O servidor conferiu hashes instalados, proteção de bibliotecas, tabelas de contexto e quatro renderizações privadas de Visão geral, Ferramentas, Salas e Origem. A base offline tem 710834 intervalos. BR/MX/US foram fixtures de teste, sem simular IPs geográficos. O certificado próprio do Admin foi mantido por decisão do usuário; não houve bypass de aviso do navegador ou envio de senha por TLS sem confiança. A validação do painel foi interna, sem exportar seus dados reais.

HTTPS público confirmou home e privacy com 200 e bytes revisados, redirecionamento antigo 308 sem loop, locale.php com contrato somente locale e cache private/no-store/max-age=0, traffic.php bloqueado com 403 e JS com cache imutável de um ano. A inspeção visual independente confirmou o rodapé e a página em 390 px sem overflow.

O rollback recuperável está guardado somente na área privada da hospedagem, incluindo configurações, arquivos anteriores e snapshot do histórico. O script privado de rollback verifica se os arquivos continuam na versão publicada antes de restaurar os arquivos de código; não substitui o banco de estatísticas por uma cópia antiga. Não distribuir esse material como parte do ZIP público.

Após inventário e conferência de cobertura, foram removidos dois ZIPs antigos de pré-alteração do código do Admin, totalizando 525787 bytes. Os snapshots completos e verificados de antes e depois desta publicação e a implantação estável de 09/10 foram preservados. Um arquivo histórico único de 391 bytes foi mantido separadamente na área privada. Materiais de outros serviços e estado/configurações/dados ativos não foram removidos. O inventário, motivos e a lista exata da limpeza estão em um relatório privado na hospedagem. As tarefas temporárias desta implantação foram retiradas, preservando os crons existentes de manutenção.
