const fs = require('fs');

let content = fs.readFileSync('src/components/PatternFoundations.tsx', 'utf8');

// I cannot just parse and fix with a regex, I need the actual old version of PatternFoundations.tsx to reference it.
