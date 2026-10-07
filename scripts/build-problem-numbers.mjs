/** Refresh public LeetCode numbers for the curated and extended catalogs. */
import fs from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const source = 'https://leetcode.com/api/problems/all/';

async function main() {
  const [curated, extended] = await Promise.all([
    fs.readFile(new URL('src/data/problems.ts', root), 'utf8'),
    fs.readFile(new URL('src/data/leetcodeExtendedCatalog.json', root), 'utf8'),
  ]);
  const localIds = new Set([
    ...[...curated.matchAll(/id: '([^']+)'/g)].map((match) => match[1]),
    ...JSON.parse(extended).map((problem) => problem.id),
  ]);
  const response = await fetch(source);
  if (!response.ok) throw new Error(`LeetCode catalog request failed: ${response.status}`);
  const catalog = await response.json();
  const numberById = {};
  for (const { stat } of catalog.stat_status_pairs) {
    const id = stat.question__title_slug;
    const number = stat.frontend_question_id;
    if (localIds.has(id) && Number.isInteger(number) && number > 0) {
      numberById[id] = number;
    }
  }
  const unresolved = [...localIds].filter((id) => !(id in numberById));
  if (unresolved.length) {
    throw new Error(`Missing LeetCode numbers: ${unresolved.join(', ')}`);
  }
  const payload = {
    source,
    numberById: Object.fromEntries(
      Object.entries(numberById).sort(([a], [b]) => a.localeCompare(b)),
    ),
  };
  await fs.writeFile(
    new URL('src/data/leetcodeProblemNumbers.json', root),
    `${JSON.stringify(payload, null, 2)}\n`,
  );
  console.log(`Wrote LeetCode numbers for ${localIds.size} problems.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
