import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const educativeDataPath = path.join(__dirname, '../src/data/educative-patterns-extracted.json');
const patternsTsPath = path.join(__dirname, '../src/data/patterns.ts');

const educativeData = JSON.parse(fs.readFileSync(educativeDataPath, 'utf8'));
let patternsTs = fs.readFileSync(patternsTsPath, 'utf8');

// Map educative patterns to local pattern IDs
const patternMap = {
    'Two Pointers': 'two-pointers',
    'Sliding Window': 'sliding-window',
    'Fast and Slow Pointers': 'fast-slow-pointers',
    'Modified Binary Search': 'binary-search',
    'Tree Breadth-First Search': 'bfs',
    'Topological Sort': 'topological-sort',
    'Top K Elements': 'top-k-elements',
    'Two Heaps': 'two-heaps'
};

const problemsByPattern = {};

for (let section of educativeData) {
    const localId = patternMap[section.pattern];
    if (localId) {
        if (!problemsByPattern[localId]) {
            problemsByPattern[localId] = [];
        }
        
        for (let prob of section.problems) {
            problemsByPattern[localId].push({
                title: prob.title,
                badges: prob.badges
            });
        }
    }
}

let modified = patternsTs;

for (const [id, problems] of Object.entries(problemsByPattern)) {
    // Regex matching the pattern block
    // Basically finding `id: 'two-pointers',\n...relatedTags: [...]`
    // We will find `id: '${id}'`, then search forward for `relatedTags:`
    const idRe = new RegExp(`id:\\s*'${id}'`);
    const idMatch = idRe.exec(modified);
    
    if (idMatch) {
       const startIdx = idMatch.index;
       // Find next relatedTags array
       const blockEnd = modified.indexOf('  },', startIdx);
       if (blockEnd > -1) {
           const block = modified.slice(startIdx, blockEnd);
           if (!block.includes('educativeProblems:')) {
               const educativeString = `\n    educativeProblems: ` + JSON.stringify(problems, null, 6).replace(/\]$/, '    ]');
               
               // we want to insert right before the closing `  }` of the object.
               // Wait, finding the real end is tricky because of `}` inside `[]`.
               // Let's just find the last property (`relatedTags: [...]`)
               const tagsMatch = block.match(/relatedTags:\s*\[.*?\]/s);
               if (tagsMatch) {
                   const insertionIdx = startIdx + tagsMatch.index + tagsMatch[0].length;
                   modified = modified.slice(0, insertionIdx) + `,${educativeString}` + modified.slice(insertionIdx);
               } else if (block.includes('relatedTags: []')) {
                   const rIdx = startIdx + block.indexOf('relatedTags: []') + 'relatedTags: []'.length;
                   modified = modified.slice(0, rIdx) + `,${educativeString}` + modified.slice(rIdx);
               } else {
                   // Fallback
                   modified = modified.slice(0, blockEnd) + `,\n    educativeProblems: ` + JSON.stringify(problems) + modified.slice(blockEnd);
               }
               console.log(`Added ${problems.length} educative problems to ${id}`);
           }
       }
    }
}

fs.writeFileSync(patternsTsPath, modified);
