const fs = require('fs');
const content = fs.readFileSync('src/data/problems.ts', 'utf-8');
console.log(content.includes('problemTitleToProblemMap'));
