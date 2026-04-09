import { patterns } from './src/data/patterns.ts';
import { allProblems } from './src/data/problems.ts';

let found = 0;
let missing = 0;
for (const p of patterns) {
    if (p.educativeProblems) {
        for (const e of p.educativeProblems) {
            const m = allProblems.find(a => a.title.toLowerCase() === e.title.toLowerCase());
            if (m) found++; else { missing++; console.log('Missing:', e.title); }
        }
    }
}
console.log('Found:', found, 'Missing:', missing);
