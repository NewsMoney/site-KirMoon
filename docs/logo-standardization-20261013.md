# Logo oficial — 13/10/2026

A logo animada extraída do WebPrisma é a referência para a marca institucional KirMoon. O pacote está em `assets/brand/`, com letras em curvas e fundo transparente.

A página inicial usa o SVG oficial incorporado na marca flutuante e no rodapé, incluindo os links alternativos sem JavaScript. No hero, a marca flutuante aparece sem o arco próprio da logo, conforme a correção solicitada pelo usuário; o arco retorna quando a marca chega ao cabeçalho, usando a progressão de scroll existente. A órbita fina do cenário permanece. Cada ocorrência tem IDs próprios para seus filtros e recorte. A página 404 usa a mesma composição; a página de privacidade usa o arquivo animado no link de retorno. Os nomes e marcas dos produtos continuam próprios dos produtos.

Na página inicial e na página 404, a animação foi movida do SVG para `assets/brand/kirmoon-logo.css`, permitido pela CSP existente. Entrada, hover e foco disparam o brilho de 1,15 segundo. A marca flutuante também preserva o disparo por scroll e usa o centro do grupo vetorial da lua na medição de seu percurso. O novo runtime possui um nome com hash; o runtime anterior permanece disponível para rollback. O CSS da página de privacidade recebe uma versão na URL para evitar cache antigo.

`scripts/sync-brand.cjs` gera as incorporações diretamente do SVG oficial. Para regenerar o repositório, rode `node scripts/sync-brand.cjs`. Um argumento opcional permite sincronizar também outra pasta que contenha `index-lunula.html`, `index.html`, `404.html` e `assets/brand/`. Não substitua a versão de publicação do repositório por um build de uma fonte antiga.

Também foram atualizadas as fontes e a cópia de trabalho em Desktop/KirMoon. O build foi ajustado para levar o CSS da pasta `brand` ao pacote, pois a página 404 o utiliza como recurso externo.

## Validação

Conferidos no Edge em 1440×900 e 390×844: proporção e legibilidade, marca flutuante, rodapé, retorno ao início por Enter, brilho por hover, preferência por movimento reduzido, fallback sem JavaScript, página 404 e página de privacidade. Não houve overflow horizontal, exceções JavaScript ou violações CSP. Os hashes inline da página inicial permanecem compatíveis com a CSP existente.

O build da fonte editável passou, assim como os 16 testes existentes de navegação, percurso e interação 3D. As capturas e o relatório ficam na pasta de trabalho `tmp/logo-export/`.

## Entrega e publicação

Estado desta entrega: site KirMoon, Tech Atlas e Device Lab publicados em 13/10/2026 pelo gerenciador de arquivos do cPanel no Chrome. Os dois chats das ferramentas haviam concluído suas verificações antes da publicação. A correção posterior do hero também foi publicada: o arco da marca fica oculto na abertura e retorna no cabeçalho, com CSS de nome versionado para atualizar o cache.

Uma cópia recuperável dos HTMLs, das aplicações e dos arquivos de privacidade anteriores ficou fora da pasta pública, em `/.kirmoon-logo-backup-20261013` da conta de hospedagem. Os ZIPs de envio também ficam nessa área privada. A atualização foi incremental, sem substituir as políticas Apache existentes.

Na preparação para publicação, o HTML do Tech Atlas foi baseado na versão realmente hospedada e recebeu somente as referências novas do bundle e do CSS. Foram preservados o rastreador, o módulo de uso e o aviso existentes. No Device Lab, foram preservados o rastreador, o aviso e a chamada de início de uso já publicada; os recursos alterados receberam nomes versionados, evitando modificar a página anterior durante o envio. O index institucional correspondia exatamente à base conferida.

Na conferência pública dos três serviços, os SVGs apresentaram nove paths e animação de 1,15 segundo, sem erros registrados no Chrome. No site principal, foi confirmado arco com opacidade zero no hero e opacidade um ao chegar ao cabeçalho. O aceite jurídico do Device Lab não foi alterado durante a verificação.

Pacotes, manifesto, cópia local anterior e capturas estão em `Desktop/KirMoon/output/logo-standardization-20261013/`.

Envie somente os arquivos listados no manifesto, nos caminhos indicados. A base é o index do repositório que já inclui as alterações de idioma, estatísticas e privacidade de 11/10. Confira a base atualmente publicada antes de sobrescrever o index; se ela tiver mudado, aplique a alteração das logos sobre essa base mais recente. Preserve `.htaccess`, configurações, estatísticas e as aplicações independentes. Os scripts e estilos inline do index do repositório não foram modificados e não exigem trocar a CSP.

Para reverter, restaure os HTMLs e o CSS de privacidade anteriores e a referência anterior do runtime. O pacote não contém credenciais, configurações privadas ou arquivos de outras aplicações.
