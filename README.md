# KirMoon — site institucional

Arquivos de publicação do [site institucional da KirMoon](https://kirmoon.com/), versionados a partir da cópia conferida em 7 de outubro de 2026.

## Conteúdo

- `index.html`: página institucional, serviços, demonstrações e seleção de idiomas.
- `404.html`: página de erro personalizada.
- `assets/` e `preview-assets/`: scripts, imagens, fontes e recursos das demonstrações.
- `.htaccess`: regras Apache e políticas de segurança do pacote validado.
- Ícones, `robots.txt` e `sitemap.xml` na raiz.
- `docs/snapshot-20261007.json`: origem e hashes SHA-256 dos 199 arquivos de publicação.

As aplicações completas Device Lab e Web Prisma são projetos separados. Este repositório contém os cards e links desses produtos no site institucional.

## Origem da primeira versão

Base: pacote `kirmoon-site-20261006.zip`. Os 198 arquivos acessíveis por HTTPS foram conferidos contra a hospedagem. O `index.html` foi atualizado com os bytes publicados, incluindo os dois links para `/web-prisma/`.

O `.htaccess` veio do pacote local validado; não foi obtido diretamente do servidor. Suas políticas de segurança foram conferidas com os HTMLs incluídos.

## Publicação e manutenção

O site é estático e não exige Node ou npm no servidor. Envie os arquivos de publicação à raiz do domínio em uma hospedagem Apache 2.4 compatível com as regras de `.htaccess`.

Preserve as pastas das aplicações independentes e as regras próprias da hospedagem. Publique os HTMLs e o `.htaccess` correspondente juntos: alterações em scripts ou estilos inline exigem atualizar os hashes da política CSP. Os links de contato e de produtos apontam para serviços externos; a execução 3D admite a biblioteca Three.js da CDN indicada no HTML e na política CSP.

`README.md`, `docs/` e arquivos de Git são documentação e controle de versão; não precisam ser enviados ao `public_html`.

O `.gitattributes` preserva os bytes dos arquivos publicados, inclusive as quebras de linha, para evitar alterações automáticas pelo Git no Windows.
