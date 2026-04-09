const fs = require('fs');

const content = fs.readFileSync('src/data/patterns.ts', 'utf8');

const patternOrder = [
  'two-pointers',
  'fast-slow-pointers',
  'sliding-window',
  'intervals',
  'in-place-reversal',
  'two-heaps',
  'k-way-merge',
  'top-k-elements',
  'binary-search',
  'subsets',
  'greedy',
  'backtracking',
  'dynamic-programming',
  'cyclic-sort',
  'topological-sort',
  'sort-search',
  'matrices',
  'stacks',
  'graphs',
  'tree-dfs',
  'bfs',
  'trie',
  'hash-maps',
  'knowing-what-to-track',
  'union-find',
  'custom-data-structures',
  'bitwise',
  'math-geometry',
  'challenge-yourself'
];

const objects = [];
let currentCode = '';
let parsing = false;
let currentId = '';

const lines = content.split('\n');
let exportStart = -1;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('export const patterns: PatternFoundation[] = [')) {
    exportStart = i;
    break;
  }
}

// Just map IDs from the list to their objects
const idRegex = /id:\s*'([^']+)'/;

// split the array text by `{` and `}` properly
let insideArrayText = content.substring(content.indexOf('export const patterns: PatternFoundation[] = ['));
