// Merge content/_parts/g3.<n>.json into content/guides-3.json
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
const dir = join(import.meta.dirname, '..', 'content');
const out = [1, 2, 3, 4].map((n) => JSON.parse(readFileSync(join(dir, '_parts', `g3.${n}.json`), 'utf8')));
writeFileSync(join(dir, 'guides-3.json'), JSON.stringify(out, null, 2) + '\n');
console.log(`guides-3.json: ${out.length} guides`);
