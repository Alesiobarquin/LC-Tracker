import fs from 'fs';

const content = fs.readFileSync('src/data/patterns.ts', 'utf8');

// I will parse the array manually
const prefixStr = content.substring(0, content.indexOf('export const patterns: PatternFoundation[] = [') + 'export const patterns: PatternFoundation[] = ['.length);
const arrayContent = content.substring(content.indexOf('export const patterns: PatternFoundation[] = [') + 'export const patterns: PatternFoundation[] = ['.length);

const objs = [];
let d = 0;
let current = '';
for(let i=0; i<arrayContent.length; i++) {
   const c = arrayContent[i];
   if(c === '{') d++;
   if(c === '}') d--;
   current += c;
   if(d === 0 && current.trim().length > 0 && current.trim().endsWith('}')) {
       // Found complete object
       objs.push(current.trim());
       current = '';
   }
}

const idRegex = /id:\s*'([^']+)'/;
const objMap = {};
for(const obj of objs) {
    const m = obj.match(idRegex);
    if(m) objMap[m[1]] = obj;
}
console.log(Object.keys(objMap));
