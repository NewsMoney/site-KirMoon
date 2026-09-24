const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const htmlPath = path.join(root, 'index.html');
const before = fs.readFileSync(htmlPath, 'utf8');
const servicesMarker = 'SERVIÇOS v14 — interações das três demonstrações';
const carouselMarker = 'Carrossel de serviços em Compromissos: texto recortado + satélite em órbita.';

function extract(html, marker, file) {
  const markerAt = html.indexOf(marker);
  if (markerAt < 0) throw new Error(`Script marker missing: ${marker}`);
  const start = html.lastIndexOf('<script>', markerAt);
  const end = html.indexOf('</script>', markerAt) + '</script>'.length;
  if (start < 0 || end < markerAt) throw new Error(`Script bounds missing: ${marker}`);
  const code = html.slice(start + '<script>'.length, end - '</script>'.length);
  new (require('node:vm').Script)(code, {filename:file});
  fs.writeFileSync(path.join(root, 'assets', file), code.trim() + '\n');
  return {html: html.slice(0, start) + html.slice(end), bytes: Buffer.byteLength(code)};
}

let result = extract(before, carouselMarker, 'commitments-carousel-20260924.js');
const carouselBytes = result.bytes;
result = extract(result.html, servicesMarker, 'service-demos-20260924.js');
const serviceBytes = result.bytes;

const bootstrap = `<script id="kirmoon-section-scripts">
(() => {
  const sections = [
    ['apps', 'assets/service-demos-20260924.js'],
    ['sites', 'assets/service-demos-20260924.js'],
    ['ti', 'assets/service-demos-20260924.js'],
    ['compromissos', 'assets/commitments-carousel-20260924.js']
  ];
  const loaded = new Set();
  const load = ([, src]) => {
    if (loaded.has(src)) return;
    loaded.add(src);
    const script = document.createElement('script');
    script.src = src;
    document.body.appendChild(script);
  };
  if (!('IntersectionObserver' in window)) {
    sections.forEach(load);
    return;
  }
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      observer.unobserve(entry.target);
      const section = sections.find(([id]) => id === entry.target.id);
      if (section) load(section);
    });
  }, {rootMargin:'200px 0px'});
  sections.forEach(section => {
    const element = document.getElementById(section[0]);
    if (element) observer.observe(element);
  });
})();
</script>`;

const insertionPoint = '<script>\n/* Altura do cabeçalho fixo para as páginas de tela inteira. */';
if (!result.html.includes(insertionPoint)) throw new Error('Bootstrap insertion point missing');
result.html = result.html.replace(insertionPoint, bootstrap + '\n' + insertionPoint);
fs.writeFileSync(htmlPath, result.html);
console.log(JSON.stringify({serviceBytes, carouselBytes, htmlBytesBefore:Buffer.byteLength(before), htmlBytesAfter:Buffer.byteLength(result.html)}));
