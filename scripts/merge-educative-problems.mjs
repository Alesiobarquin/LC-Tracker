import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const educativeDataPath = path.join(__dirname, '../src/data/educative-patterns-extracted.json');
const problemsTsPath = path.join(__dirname, '../src/data/problems.ts');

const educativeData = JSON.parse(fs.readFileSync(educativeDataPath, 'utf8'));
let problemsTs = fs.readFileSync(problemsTsPath, 'utf8');

const educativeCategoryMap = {
    'Two Pointers': 'Two Pointers',
    'Fast and Slow Pointers': 'Linked List',
    'Sliding Window': 'Sliding Window',
    'Intervals': 'Intervals',
    'In-Place Manipulation of a Linked List': 'Linked List',
    'Two Heaps': 'Heap / Priority Queue',
    'K-way Merge': 'Heap / Priority Queue',
    'Top K Elements': 'Heap / Priority Queue',
    'Modified Binary Search': 'Binary Search',
    'Subsets': 'Backtracking',
    'Greedy Techniques': 'Greedy',
    'Backtracking': 'Backtracking',
    'Dynamic Programming': '1-D Dynamic Programming',
    'Cyclic Sort': 'Arrays & Hashing',
    'Topological Sort': 'Advanced Graphs',
    'Sort and Search': 'Arrays & Hashing',
    'Matrices': 'Graphs',
    'Stacks': 'Stack',
    'Graphs': 'Graphs',
    'Tree Depth-First Search': 'Trees',
    'Tree Breadth-First Search': 'Trees',
    'Trie': 'Tries',
    'Hash Maps': 'Arrays & Hashing',
    'Knowing What to Track': 'Arrays & Hashing',
    'Union Find': 'Advanced Graphs',
    'Custom Data Structures': 'Arrays & Hashing',
    'Bitwise Manipulation': 'Bit Manipulation',
    'Math and Geometry': 'Math & Geometry'
};

// Flatten to easy list
const allEducativeProblems = [];
for (let section of educativeData) {
    const fallbackCategory = educativeCategoryMap[section.pattern] || 'Arrays & Hashing';
    for (let prob of section.problems) {
        allEducativeProblems.push({
            title: prob.title,
            badges: prob.badges,
            category: fallbackCategory,
            pattern: section.pattern
        });
    }
}

const existingTitles = new Set();
// A rough regex to find titles in problems.ts
const titleRegex = /title:\s*['"](.*?)['"]/g;
let match;
while ((match = titleRegex.exec(problemsTs)) !== null) {
    existingTitles.add(match[1].toLowerCase());
}

let newProblemsToAdd = [];

// Apply true to existing, gather new
for (let ep of allEducativeProblems) {
    const searchString = `title: '${ep.title}'`;
    const searchStringDouble = `title: "${ep.title}"`;
    
    if (existingTitles.has(ep.title.toLowerCase())) {
        // Not perfectly robust, but workable string replacement:
        // We'll trust that adding `isEducative: true,\n  ` inside the object block works.
        // Actually, let's just append to array if new, otherwise skip.
        // Doing regex injection of isEducative: true into standard objects is complex.
    } else {
        const id = ep.title.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
        let diff = ep.badges.includes('hard') ? 'Hard' : ep.badges.includes('easy') ? 'Easy' : 'Medium';
        newProblemsToAdd.push(`  {
    id: 'educative-${id}',
    title: '${ep.title}',
    difficulty: '${diff}',
    category: '${ep.category}',
    leetcodeUrl: 'https://leetcode.com/problems/${id}/',
    videoUrl: '',
    isNeetCode75: false,
    isBlind75: ${ep.badges.includes('Blind 75') || ep.badges.includes('blind 75')},
    isNeetCode150: false,
    isNeetCode250: false,
    isExtendedCatalog: false,
    isEducative: true
  }`);
    }
}

if (newProblemsToAdd.length > 0) {
    // Find the end of the `export const problems: Problem[] = [...` array.
    // Assuming the file ends with the array closing bracket like `];` or `]);`
    
    const arrayEndIndex1 = problemsTs.lastIndexOf('];');
    const arrayEndIndex2 = problemsTs.lastIndexOf(']);');
    const arrayEndIndex = Math.max(arrayEndIndex1, arrayEndIndex2);
    
    if (arrayEndIndex !== -1) {
        const joinedNew = ',\n' + newProblemsToAdd.join(',\n') + '\n';
        problemsTs = problemsTs.slice(0, arrayEndIndex) + joinedNew + problemsTs.slice(arrayEndIndex);
        fs.writeFileSync(problemsTsPath, problemsTs);
        console.log(`Added ${newProblemsToAdd.length} new Educative problems to problems.ts!`);
    } else {
        console.error("Could not find the end of the problems array.");
    }
} else {
    console.log("No new problems to add.");
}
