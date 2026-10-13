// Apply only the two requested changes to a freshly downloaded production index.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'docs/site-update-20261011-manifest.json')));
const [input,output]=process.argv.slice(2);
if(!input||!output)throw Error('Uso: node scripts/patch-index.cjs INDEX_ATUAL.html INDEX_PREPARADO.html');
const source=fs.readFileSync(input,'utf8');
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
if(hash(source)===manifest.index_sha256){fs.writeFileSync(output,source);console.log('Arquivo já atualizado.');process.exit(0);}
assert.equal(hash(source),manifest.baseline_sha256,'O site mudou desde a base validada. Rebasear as duas mudanças antes de instalar.');
const old='assets/site-language-20261006.915c912b2c7d.js';
assert.equal(source.split(old).length,2);
const notices=source.match(/<aside\b[^>]*class=(?:"km-usage-notice"|km-usage-notice)[^>]*>[\s\S]*?<\/aside>/g)||[];
assert.equal(notices.length,1);
let next=source.replace(notices[0],'').replace(old,manifest.language_asset);
const footer=next.match(/<footer(?:\s[^>]*)?>[\s\S]*?<\/footer>/g);
assert.equal(footer?.length,1);
const nav=footer[0].match(/<nav\s+aria-label=(?:"Rodapé"|Rodapé)>[\s\S]*?<\/nav>/g);
assert.equal(nav?.length,1);assert.ok(nav[0].includes('Contato'));
const link='<a class="km-footer-policy" href="/privacy">Termos de uso e privacidade</a>';
next=next.replace(footer[0],footer[0].replace(nav[0],nav[0].replace('</nav>',link+'</nav>')));
assert.equal(hash(next),manifest.index_sha256,'Resultado diferente do pacote validado.');
fs.writeFileSync(output,next);console.log('Patch restrito de idioma e rodapé aplicado.');
