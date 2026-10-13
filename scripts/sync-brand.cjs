// Embed the official asset with isolated IDs; keep scripts and styles outside SVG.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
// Optional second checkout containing the editable index-lunula.html source.
const desktop=process.argv[2]?path.resolve(process.argv[2]):null;
const canonical=fs.readFileSync(path.join(root,'assets/brand/kirmoon-logo-animated.svg'),'utf8');
const motion=canonical.match(/<style>([\s\S]*?)<\/style>/)[1];
const css=`/* Geometry is generated from kirmoon-logo-animated.svg. */
.brand>.km-logo{display:block;flex:none;width:calc(var(--brand-size,21px) * 7.6651785714);height:calc(var(--brand-size,21px) * 1.8571428571);max-width:none;overflow:visible;pointer-events:none}
.floating-brand>.km-logo>g[clip-path]{opacity:var(--brand-arc-opacity,0);transition:opacity .18s}
${motion.replace('svg:hover .km-logo-glint','.brand:is(:hover,:focus-visible) .km-logo-glint').replace('svg:hover .km-logo-glint','.brand:is(:hover,:focus-visible) .km-logo-glint')}
#floating-brand.is-glinting:not(:hover):not(:focus-visible) .km-logo-glint{animation-name:km-logo-scroll}
@keyframes km-logo-scroll{0%{stroke-dashoffset:1;opacity:0}14%,76%{opacity:.9}100%{stroke-dashoffset:0;opacity:0}}
@media(prefers-reduced-motion:reduce){#floating-brand.is-glinting .km-logo-glint{animation:none;opacity:0}}
`;
const cssName='kirmoon-logo.'+crypto.createHash('sha256').update(css).digest('hex').slice(0,12)+'.css';
const svgTemplate=canonical.replace(/\s*<style>[\s\S]*?<\/style>/,'').replace(/\s*<(title|desc)\b[^>]*>[\s\S]*?<\/\1>/g,'').replace('role="img" aria-labelledby="km-logo-title km-logo-desc"','class="km-logo" aria-hidden="true" focusable="false"').replace('  <g transform="translate(','  <g class="km-logo-moon" transform="translate(');
function svg(id){return svgTemplate.replaceAll('km-logo-',id+'-').replace(`class="${id}-moon"`,'class="km-logo-moon"').replace(`class="${id}-glint"`,'class="km-logo-glint"').replace(/>\s+</g,'><').trim();}
function transform(file){
 if(!fs.existsSync(file))return;
 let html=fs.readFileSync(file,'utf8'),count=0;
 html=html.replace(/<(a|button)\b([^>]*\bclass=(?:"[^"]*\bbrand\b[^"]*"|'[^']*\bbrand\b[^']*'|brand))([^>]*)>([\s\S]*?)<\/\1>/g,(all,tag,a,b,inside)=>{
  if(!/brand-arc|class=["']?wm(?:[\s"'>])|class="km-logo"/.test(inside))return all;
  count++;
  return `<${tag}${a}${b}>${svg('km-brand-'+count)}</${tag}>`;
 });
 assert.ok(count>=1,'No institutional logos found in '+file);
 const href='/assets/brand/'+cssName;
 html=html.replace(/href="\/assets\/brand\/kirmoon-logo(?:\.[a-f0-9]{12})?\.css"/g,'href="'+href+'"');
 if(!html.includes(href)){
  const link=`<link rel="stylesheet" href="${href}">`;
  html=html.includes('</head>')?html.replace('</head>',link+'</head>'):html.replace('</style>','</style>'+link);
 }
 // The floating logo camera measures the crescent center, now outlined in SVG.
 html=html.replaceAll('querySelector(\".cres\").getBoundingClientRect()','querySelector(\".km-logo-moon,.cres\").getBoundingClientRect()').replaceAll("querySelector('.cres').getBoundingClientRect()","querySelector('.km-logo-moon,.cres').getBoundingClientRect()");
 fs.writeFileSync(file,html);console.log(path.relative(root,file)+': '+count+' logos');
}
fs.writeFileSync(path.join(root,'assets/brand/kirmoon-logo.css'),css);
fs.writeFileSync(path.join(root,'assets/brand',cssName),css);
if(desktop){fs.writeFileSync(path.join(desktop,'assets/brand/kirmoon-logo.css'),css);fs.writeFileSync(path.join(desktop,'assets/brand',cssName),css);}
for(const base of [root,...(desktop?[desktop]:[])])for(const file of ['index.html','404.html',...(base===desktop?['index-lunula.html']:[])])transform(path.join(base,file));
let main=fs.readFileSync(path.join(root,'index.html'),'utf8');
const oldApp=main.match(/src=(?:"|')?(assets\/kirmoon-app\.[a-f0-9]+\.js)/)[1];
const app=fs.readFileSync(path.join(root,oldApp),'utf8').replaceAll('querySelector(\".cres\").getBoundingClientRect()','querySelector(\".km-logo-moon,.cres\").getBoundingClientRect()');
const nextApp='assets/kirmoon-app.'+crypto.createHash('sha256').update(app).digest('hex').slice(0,12)+'.js';
fs.writeFileSync(path.join(root,nextApp),app);main=main.replaceAll(oldApp,nextApp);fs.writeFileSync(path.join(root,'index.html'),main);
const privacyFile=path.join(root,'km-stats/privacy.html');let privacy=fs.readFileSync(privacyFile,'utf8');
privacy=privacy.replace('<a href="/">← KirMoon</a>','<a class="km-privacy-brand" href="/" aria-label="KirMoon, página inicial"><span aria-hidden="true">←</span><img src="/assets/brand/kirmoon-logo-animated.svg" alt="" width="161" height="39"></a>');
fs.writeFileSync(privacyFile,privacy);
privacy=privacy.replace('href="/km-stats/notice.css"','href="/km-stats/notice.css?v=20261013-logo"');fs.writeFileSync(privacyFile,privacy);
const noticeFile=path.join(root,'km-stats/notice.css');let notice=fs.readFileSync(noticeFile,'utf8');if(!notice.includes('.km-privacy-brand'))notice+='\n.km-privacy .km-privacy-brand{display:inline-flex;align-items:center;gap:12px;min-height:44px}.km-privacy-brand img{display:block;width:161px;height:39px}\n';fs.writeFileSync(noticeFile,notice);
