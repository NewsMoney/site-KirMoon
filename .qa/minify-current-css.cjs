const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const zlib = require('node:zlib');

const root = path.resolve(__dirname, '..');
const file = path.join(root, 'index.html');
const backup = path.join(__dirname, 'index-before-css-minification.html');
assert(!fs.existsSync(backup), 'CSS source backup already exists');

function stripComments(css) {
  let result = '';
  for (let i = 0; i < css.length;) {
    const char = css[i];
    if (char === '"' || char === "'") {
      const quote = char;
      result += css[i++];
      while (i < css.length) {
        const next = css[i++];
        result += next;
        if (next === '\\' && i < css.length) result += css[i++];
        else if (next === quote) break;
      }
    } else if (char === '/' && css[i + 1] === '*') {
      const end = css.indexOf('*/', i + 2);
      assert(end !== -1, 'Unterminated CSS comment');
      i = end + 2;
    } else result += css[i++];
  }
  return result;
}

const original = fs.readFileSync(file, 'utf8');
let styles = 0;
const pattern = /(<style\b[^>]*>)([\s\S]*?)(<\/style>)/gi;
const output = original.replace(pattern, (_all, open, css, close) => {
  styles++;
  return open + stripComments(css) + close;
});
assert(styles > 0);
assert.equal(output.replace(pattern, '$1$3'), original.replace(pattern, '$1$3'), 'Non-CSS content changed');
assert(Buffer.byteLength(output) < Buffer.byteLength(original));
fs.writeFileSync(backup, original);
fs.writeFileSync(file, output);
console.log(JSON.stringify({styles,
  beforeBytes: Buffer.byteLength(original), afterBytes: Buffer.byteLength(output),
  beforeGzip: zlib.gzipSync(original).length, afterGzip: zlib.gzipSync(output).length,
  backup}, null, 2));
