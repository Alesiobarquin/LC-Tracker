/**
 * Builds LeetCode premium status metadata for all locally tracked problems.
 * Run from repo root:
 *   node scripts/build-problem-premium-status.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

function readLocalProblemIds() {
  const problemsTsPath = path.join(root, 'src/data/problems.ts');
  const extendedPath = path.join(root, 'src/data/leetcodeExtendedCatalog.json');

  const problemsTs = fs.readFileSync(problemsTsPath, 'utf8');
  const curatedIds = [...problemsTs.matchAll(/id: '([^']+)'/g)].map((match) => match[1]);

  const extended = JSON.parse(fs.readFileSync(extendedPath, 'utf8'));
  const extendedIds = Array.isArray(extended) ? extended.map((p) => p.id).filter(Boolean) : [];

  return new Set([...curatedIds, ...extendedIds]);
}

async function fetchPage(skip) {
  const query = `query {
    problemsetQuestionListV2(categorySlug: "", limit: 50, skip: ${skip}, filters: { filterCombineType: ALL }) {
      questions {
        titleSlug
        paidOnly
      }
    }
  }`;

  const response = await fetch('https://leetcode.com/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });

  const json = await response.json();
  if (json.errors) throw new Error(JSON.stringify(json.errors));
  return json.data.problemsetQuestionListV2.questions;
}

async function main() {
  const localIds = readLocalProblemIds();
  const statusById = {};

  let skip = 0;
  for (;;) {
    const batch = await fetchPage(skip);
    if (!batch.length) break;

    for (const q of batch) {
      if (!localIds.has(q.titleSlug)) continue;
      statusById[q.titleSlug] = Boolean(q.paidOnly);
    }

    skip += 50;
    if (batch.length < 50) break;
    await new Promise((resolve) => setTimeout(resolve, 120));
  }

  const unresolved = [...localIds].filter((id) => !(id in statusById)).sort((a, b) => a.localeCompare(b));
  const sortedStatusById = Object.fromEntries(
    Object.entries(statusById).sort(([a], [b]) => a.localeCompare(b))
  );

  const payload = {
    generatedAt: new Date().toISOString(),
    source: 'leetcode/graphql/problemsetQuestionListV2',
    totalLocalProblems: localIds.size,
    resolvedProblems: Object.keys(sortedStatusById).length,
    premiumCount: Object.values(sortedStatusById).filter(Boolean).length,
    freeCount: Object.values(sortedStatusById).filter((value) => !value).length,
    unresolved,
    statusById: sortedStatusById,
  };

  const outPath = path.join(root, 'src/data/leetcodePremiumStatus.json');
  fs.writeFileSync(outPath, `${JSON.stringify(payload, null, 2)}\n`);

  if (unresolved.length > 0) {
    console.error('Premium metadata incomplete. Unresolved ids:', unresolved.length);
    unresolved.slice(0, 20).forEach((id) => console.error(' -', id));
    process.exit(1);
  }

  console.log('Wrote premium metadata for', payload.resolvedProblems, 'problems to', outPath);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
