import fs from 'fs';
const content = fs.readFileSync('src/utils/progressHelpers.ts', 'utf8');
console.log(content.split('\n').slice(920, 950).join('\n'));
