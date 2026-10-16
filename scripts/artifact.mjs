// Turns dist/index.html into an Artifact page body: the publisher supplies <!doctype>, <html>, <head> and <body>,
// so we keep the head's contents (title, meta, fonts, styles, scripts) followed by the body's contents.
import { readFileSync, writeFileSync } from 'node:fs';
const html = readFileSync('dist/index.html', 'utf8');
const head = html.match(/<head>([\s\S]*?)<\/head>/)[1].replace(/<meta charset="UTF-8"\s*\/?>/i, '').replace(/<meta name="viewport"[^>]*>/i, '');
const body = html.match(/<body>([\s\S]*?)<\/body>/)[1];
const out = process.argv[2] ?? 'dist/logos-atlas.html';
writeFileSync(out, head.trim() + '\n' + body.trim() + '\n');
console.log('wrote', out, (readFileSync(out).length / 1e6).toFixed(2), 'MB');
