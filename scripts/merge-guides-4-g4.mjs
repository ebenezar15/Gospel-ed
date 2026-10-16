import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
const dir = join(import.meta.dirname, '..', 'content');
const out = [1, 2, 3, 4].map((n) => JSON.parse(readFileSync(join(dir, '_parts', `g4.${n}.json`), 'utf8')));
writeFileSync(join(dir, 'guides-4.json'), JSON.stringify(out, null, 2) + '\n');
console.log('wrote guides-4.json with', out.length, 'guides');
