const fs = require('fs');
const content = fs.readFileSync('src/data/problems.ts', 'utf-8');
const newMapStr = `
export const problemTitleToProblemMap = allProblems.reduce((acc, problem) => {
  acc[problem.title.toLowerCase()] = problem;
  return acc;
}, {} as Record<string, Problem>);
`;
const newContent = content + newMapStr;
fs.writeFileSync('src/data/problems.ts', newContent);
