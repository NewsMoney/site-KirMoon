const fs = require('node:fs');
const assert = require('node:assert/strict');
const path = require('node:path');

// Only normalize CSS whitespace. Preserve strings, escapes, comments, rule
// order, declarations, HTML, embedded assets, and executable JavaScript.
function tokens(css) {
  const out = [];
  let i = 0;
  while (i < css.length) {
    const start = i;
    let type = 'text';
    if (/\s/.test(css[i])) {
      type = 'space';
      while (i < css.length && /\s/.test(css[i])) i++;
    } else if (css.startsWith('/*', i)) {
      type = 'comment';
      const end = css.indexOf('*/', i + 2);
      assert.notEqual(end, -1, 'Unterminated CSS comment');
      i = end + 2;
    } else if (css[i] === '"' || css[i] === "'") {
      type = 'string';
      const quote = css[i++];
      while (i < css.length) {
        if (css[i] === '\\') { i += 2; continue; }
        if (css[i++] === quote) break;
      }
    } else if (css[i] === '\\') {
      // Include an optional whitespace terminator of a hex escape verbatim.
      type = 'escape';
      i++;
      if (/[0-9a-f]/i.test(css[i] || '')) {
        let digits = 0;
        while (digits < 6 && i < css.length && /[0-9a-f]/i.test(css[i])) { i++; digits++; }
        if (css[i] === '\r' && css[i + 1] === '\n') i += 2;
        else if (i < css.length && /[\t\n\f\r ]/.test(css[i])) i++;
      } else {
        if (css[i] === '\r' && css[i + 1] === '\n') i += 2;
        else if (i < css.length) i++;
      }
    } else i++;
    out.push({type, value: css.slice(start, i)});
  }
  return out;
}

function compact(css) {
  const parsed = tokens(css);
  const normalized = parsed.map((token, i) => {
    if (token.type !== 'space') return token.value;
    const previous = parsed[i - 1];
    // Retain readable rule boundaries, with each declaration block on one line.
    return !previous || previous.value.endsWith('}') || previous.type === 'comment' ? '\n' : ' ';
  }).join('');
  const signature = input => tokens(input).map(token => token.type === 'space' ? ' ' : token.value).join('');
  assert.equal(signature(normalized), signature(css), 'CSS token or whitespace boundary changed');
  return normalized;
}

const source = path.resolve('kirmoon_site.html');
const backup = path.resolve('.qa/kirmoon_site.before-compaction-1405.html');
assert(!fs.existsSync(backup), 'Backup already exists; refusing to overwrite it');
const original = fs.readFileSync(source, 'utf8');
let styleBlocks = 0;
const pattern = /(<style\b[^>]*>)([\s\S]*?)(<\/style>)/gi;
const result = original.replace(pattern, (_, open, css, close) => {
  styleBlocks++;
  return open + compact(css) + close;
});
assert(styleBlocks > 0);
assert.equal(result.replace(pattern, '$1$3'), original.replace(pattern, '$1$3'), 'Non-CSS content changed');
assert(Buffer.byteLength(result) < Buffer.byteLength(original));
fs.writeFileSync(backup, original);
fs.writeFileSync(source, result);
console.log(JSON.stringify({
  styleBlocks,
  before: {lines: original.split('\n').length, bytes: Buffer.byteLength(original)},
  after: {lines: result.split('\n').length, bytes: Buffer.byteLength(result)},
  checks: ['CSS tokens and whitespace boundaries preserved', 'HTML, scripts and embedded assets unchanged'],
  backup
}, null, 2));
