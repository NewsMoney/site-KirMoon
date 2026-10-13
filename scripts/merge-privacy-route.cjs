// Merge the bounded route block into a downloaded hosting configuration.
// Keep all other rules/headers byte-for-byte; never replace the whole .htaccess.
const fs=require('node:fs'),path=require('node:path');
const [input,output]=process.argv.slice(2);
if(!input||!output)throw Error('Uso: node scripts/merge-privacy-route.cjs HTACCESS_ATUAL HTACCESS_PREPARADO');
const source=fs.readFileSync(input,'utf8');
const template=fs.readFileSync(path.resolve(__dirname,'../docs/privacy-route.htaccess'),'utf8');
const marker='# BEGIN KIRMOON PRIVACY ROUTE';
const block=template.match(/# BEGIN KIRMOON PRIVACY ROUTE[\s\S]*?# END KIRMOON PRIVACY ROUTE/);
if(!block)throw Error('Bloco de rota não encontrado na fonte.');
let updated=source;
if(source.includes(marker)){
 const existing=source.match(/# BEGIN KIRMOON PRIVACY ROUTE[\s\S]*?# END KIRMOON PRIVACY ROUTE/);
 if(!existing||existing[0].replace(/\r\n/g,'\n')!==block[0].replace(/\r\n/g,'\n'))throw Error('Existe outro bloco de rota: revisar antes de substituir.');
}else{
 const anchor='# END KIRMOON SITE PROTECTION';
 if(source.split(anchor).length!==2)throw Error('Bloco HTTPS conhecido não encontrado. Inserir a rota após o redirecionamento HTTPS e antes de regras gerais, preservando a configuração atual.');
 updated=source.replace(anchor,anchor+'\n\n'+block[0]);
}
fs.writeFileSync(output,updated);console.log('Bloco de rota mesclado; outras regras preservadas.');
