const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {minify}=require('terser');
const root=path.resolve(__dirname,'..');
(async()=>{
 const source=fs.readFileSync(path.join(root,'src/site-language.js'),'utf8');
 const code=(await minify(source,{compress:true,mangle:true,format:{ascii_only:true}})).code;
 const digest=crypto.createHash('sha256').update(code).digest('hex').slice(0,12);
 const asset='assets/site-language-20261011.'+digest+'.js';
 const indexPath=path.join(root,'index.html'),html=fs.readFileSync(indexPath,'utf8');
 const matches=html.match(/assets\/site-language-\d{8}\.[a-f0-9]{12}\.js/g)||[];
 if(matches.length!==1)throw Error('Esperado um único script de idioma no index.');
 fs.writeFileSync(path.join(root,asset),code);
 fs.writeFileSync(indexPath,html.replace(matches[0],asset));
 console.log(asset);
})();
