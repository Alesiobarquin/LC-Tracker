import { performance } from 'perf_hooks';

const count = 1000;
const queries = Array.from({ length: 1000 }, (_, i) => `problem-${i}`);
const allProblems = Array.from({ length: count }, (_, i) => ({ id: `problem-${i}`, title: `Problem ${i}` }));

const problemMap = allProblems.reduce((acc, p) => {
  acc[p.id] = p;
  return acc;
}, {});

function measure(name, fn) {
  const start = performance.now();
  for (let i = 0; i < 1000; i++) {
    for (const q of queries) {
      fn(q);
    }
  }
  const end = performance.now();
  console.log(`${name}: ${(end - start).toFixed(2)}ms`);
}

measure('Array.find', (q) => allProblems.find(p => p.id === q));
measure('problemMap', (q) => problemMap[q]);
