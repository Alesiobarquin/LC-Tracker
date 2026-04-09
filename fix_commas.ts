import fs from 'fs';
const content = fs.readFileSync('src/data/patterns.ts', 'utf8');
const fixed = content.replace(/},\s*,\s*{/g, '},\n  {');
fs.writeFileSync('src/data/patterns.ts', fixed, 'utf8');
