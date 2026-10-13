# Logo oficial KirMoon

Esta pasta é o pacote de referência para a identidade da KirMoon. A origem é a logo do cabeçalho do WebPrisma, extraída em 13/10/2026 de `web-prisma/index.html`: Barlow Light, lua crescente e arco orbital com brilho de 1,15 segundo.

## Arquivos

- `kirmoon-logo-animated.svg`: versão animada para interfaces. O brilho toca uma vez ao carregar; ao incorporar o SVG inline ou com `<object>`, passar o mouse também dispara o brilho. Respeita `prefers-reduced-motion`.
- `kirmoon-logo.svg`: mesma composição, estática, para documentos, apresentações, importadores de SVG e outras ferramentas sem animação.
- `preview.html`: prévia local das duas versões em fundo escuro.
- `Barlow-OFL.txt`: licença da fonte original utilizada para gerar as letras em curvas.

Os SVGs têm fundo transparente, letras em curvas e nenhuma dependência de fonte, JavaScript ou recurso remoto. As posições das letras, da lua e do arco foram medidas no WebPrisma depois do carregamento da fonte. Não usar o PNG antigo como fonte para novas aplicações.

## Uso

Imagem estática:

```html
<img src="/assets/brand/kirmoon-logo.svg" alt="KirMoon" width="161" height="39">
```

Imagem com brilho na entrada:

```html
<img src="/assets/brand/kirmoon-logo-animated.svg" alt="KirMoon" width="161" height="39">
```

Para reproduzir também o brilho ao passar o mouse:

```html
<object data="/assets/brand/kirmoon-logo-animated.svg"
        type="image/svg+xml" width="161" height="39" aria-label="KirMoon">
  <img src="/assets/brand/kirmoon-logo.svg" alt="KirMoon" width="161" height="39">
</object>
```

Manter a proporção e o espaço transparente do arquivo. Usar sobre fundo escuro para preservar o contraste da versão branca original. Ao inserir várias cópias inline na mesma página, atribuir um prefixo diferente aos IDs de cada cópia e às referências `url(#...)` e `aria-labelledby` correspondentes; `<img>` e `<object>` isolam esses IDs automaticamente.

O brilho por hover é o comportamento original do WebPrisma. A reprodução única ao carregar foi adicionada na exportação para que a versão animada funcione também como `<img>`. Ferramentas que ignoram filtros podem apresentar a composição sem o halo suave.

## Distribuição

O mesmo pacote está em `assets/brand/` na pasta de trabalho KirMoon e no repositório `site-KirMoon`. Para outras ferramentas e projetos, copiar estes arquivos sem redesenhar a marca. A inclusão do pacote não substitui automaticamente as logos já incorporadas nas aplicações.

## Verificação

Comparação visual com a origem no Edge, animação na entrada e por hover, abertura direta do SVG e preferência por movimento reduzido verificadas em 13/10/2026.
