import fs from 'fs';

const content = fs.readFileSync('src/data/patterns.ts', 'utf8');

const startTag = 'export const patterns: PatternFoundation[] = [';
const startIndex = content.indexOf(startTag) + startTag.length;
const prefixStr = content.substring(0, startIndex);
const arrayContent = content.substring(startIndex);

const objs: string[] = [];
let d = 0;
let current = '';
for(let i=0; i<arrayContent.length; i++) {
   const c = arrayContent[i];
   if(c === '{') d++;
   if(c === '}') d--;
   current += c;
   if(d === 0 && current.trim().length > 0 && current.trim().endsWith('}')) {
       // We matched one object
       objs.push(current.trim());
       current = '';
   }
}

const idRegex = /id:\s*'([^']+)'/;
const objMap: Record<string, string> = {};
for(const obj of objs) {
    const m = obj.match(idRegex);
    if(m) {
      objMap[m[1]] = obj;
    }
}

const desiredOrder = [
  'two-pointers',
  'fast-slow-pointers',
  'sliding-window',
  'intervals',
  'in-place-manipulation-of-a-linked-list',
  'two-heaps',
  'k-way-merge',
  'top-k-elements',
  'binary-search',
  'subsets',
  'greedy-techniques',
  'backtracking',
  'dynamic-programming',
  'cyclic-sort',
  'topological-sort',
  'sort-and-search',
  'matrices',
  'stacks',
  'graphs',
  'tree-depth-first-search',
  'bfs',
  'trie',
  'hash-maps',
  'knowing-what-to-track',
  'union-find',
  'custom-data-structures',
  'bitwise-manipulation',
  'math-and-geometry',
  'challenge-yourself'
];

let res = prefixStr + '\n';
for (let i = 0; i < desiredOrder.length; i++) {
    const id = desiredOrder[i];
    if (objMap[id]) {
        res += '  ' + objMap[id].replace(/\n/g, '\n  ');
        if (i < desiredOrder.length - 1) {
            res += ',\n';
        }
    } else {
        console.error("missing", id);
    }
}
res += '\n];\n';

fs.writeFileSync('src/data/patterns.ts', res, 'utf8');
console.log('Saved src/data/patterns.ts');
