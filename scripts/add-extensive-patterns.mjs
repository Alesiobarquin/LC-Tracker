import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const educativeDataPath = path.join(__dirname, '../src/data/educative-patterns-extracted.json');
const patternsTsPath = path.join(__dirname, '../src/data/patterns.ts');

const educativeData = JSON.parse(fs.readFileSync(educativeDataPath, 'utf8'));
let patternsTs = fs.readFileSync(patternsTsPath, 'utf8');

// The 8 core patterns already exist in patterns.ts. Add isCore: true to them.
patternsTs = patternsTs.replace(/id: '(\w+(?:-\w+)*)',\n\s+name:/g, "id: '$1',\n    isCore: true,\n    name:");

const mappedPatterns = [
    'Two Pointers',
    'Sliding Window',
    'Fast and Slow Pointers',
    'Modified Binary Search',
    'Tree Breadth-First Search',
    'Topological Sort',
    'Top K Elements',
    'Two Heaps'
];

let newPatterns = [];
for (let section of educativeData) {
    if (!mappedPatterns.includes(section.pattern)) {
        const id = section.pattern.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
        
        newPatterns.push(`  {
    id: '${id}',
    isCore: false,
    name: '${section.pattern}',
    description: 'An advanced pattern from Educative Grokking for ${section.pattern}.',
    templateCodePython: '# To be added\\npass',
    templateCodeJs: '// To be added\\n',
    relatedCategories: [],
    relatedTags: [],
    educativeProblems: ${JSON.stringify(section.problems, null, 6).replace(/\n/g, '\n    ')}
  }`);
    }
}

if (newPatterns.length > 0) {
    const arrayEndIndex1 = patternsTs.lastIndexOf('];');
    const arrayEndIndex2 = patternsTs.lastIndexOf(']);');
    const arrayEndIndex = Math.max(arrayEndIndex1, arrayEndIndex2);
    
    if (arrayEndIndex !== -1) {
        const joinedNew = ',\n' + newPatterns.join(',\n') + '\n';
        patternsTs = patternsTs.slice(0, arrayEndIndex) + joinedNew + patternsTs.slice(arrayEndIndex);
        fs.writeFileSync(patternsTsPath, patternsTs);
        console.log(`Added ${newPatterns.length} new Educative (Extensive) patterns to patterns.ts!`);
    } else {
        console.error("Could not find the end of the patterns array.");
    }
} else {
    console.log("No new patterns to add.");
}
