/**
 * Fetches free LeetCode problems via GraphQL and writes leetcodeExtendedCatalog.json
 * (problems not already in the curated NeetCode 250 list). Run from repo root:
 *   node scripts/build-extended-catalog.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const TAG_PRIORITY = [
  ['trie', 'Tries'],
  ['heap-priority-queue', 'Heap / Priority Queue'],
  ['union-find', 'Graphs'],
  ['graph', 'Graphs'],
  ['breadth-first-search', 'Graphs'],
  ['depth-first-search', 'Graphs'],
  ['topological-sort', 'Advanced Graphs'],
  ['shortest-path', 'Advanced Graphs'],
  ['sliding-window', 'Sliding Window'],
  ['two-pointers', 'Two Pointers'],
  ['binary-search', 'Binary Search'],
  ['stack', 'Stack'],
  ['linked-list', 'Linked List'],
  ['backtracking', 'Backtracking'],
  ['greedy', 'Greedy'],
  ['dynamic-programming', '1-D Dynamic Programming'],
  ['bit-manipulation', 'Bit Manipulation'],
  ['math', 'Math & Geometry'],
  ['geometry', 'Math & Geometry'],
  ['string', 'Arrays & Hashing'],
  ['hash-table', 'Arrays & Hashing'],
  ['array', 'Arrays & Hashing'],
  ['sorting', 'Arrays & Hashing'],
  ['tree', 'Trees'],
  ['binary-search-tree', 'Trees'],
];

function mapCategory(tags) {
  const set = new Set(tags.map((t) => t.slug));
  for (const [slug, cat] of TAG_PRIORITY) {
    if (set.has(slug)) return cat;
  }
  return 'Arrays & Hashing';
}

function diffToDifficulty(d) {
  if (d === 'EASY') return 'Easy';
  if (d === 'MEDIUM') return 'Medium';
  return 'Hard';
}

async function fetchPage(skip) {
  const query = `query {
    problemsetQuestionListV2(categorySlug: "", limit: 50, skip: ${skip}, filters: { filterCombineType: ALL }) {
      questions {
        title
        titleSlug
        difficulty
        paidOnly
        topicTags { slug }
      }
    }
  }`;
  const res = await fetch('https://leetcode.com/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });
  const json = await res.json();
  if (json.errors) throw new Error(JSON.stringify(json.errors));
  return json.data.problemsetQuestionListV2.questions;
}

const problemsTs = fs.readFileSync(path.join(root, 'src/data/problems.ts'), 'utf8');
const curatedIds = new Set([...problemsTs.matchAll(/id: '([^']+)'/g)].map((m) => m[1]));

async function main() {
  const out = [];
  let skip = 0;
  for (;;) {
    const batch = await fetchPage(skip);
    if (!batch.length) break;
    for (const q of batch) {
      if (q.paidOnly) continue;
      if (curatedIds.has(q.titleSlug)) continue;
      const diff = diffToDifficulty(q.difficulty);
      const category = mapCategory(q.topicTags || []);
      out.push({
        id: q.titleSlug,
        title: q.title,
        difficulty: diff,
        category,
        leetcodeUrl: `https://leetcode.com/problems/${q.titleSlug}/`,
        videoUrl: '',
        isNeetCode75: false,
        isBlind75: false,
        isNeetCode150: false,
        isNeetCode250: false,
        isExtendedCatalog: true,
      });
    }
    skip += 50;
    if (batch.length < 50) break;
    await new Promise((r) => setTimeout(r, 120));
  }

  const outPath = path.join(root, 'src/data/leetcodeExtendedCatalog.json');
  fs.writeFileSync(outPath, JSON.stringify(out, null, 0));
  console.log('Wrote', out.length, 'entries to', outPath);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
