import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rawData = fs.readFileSync(path.join(__dirname, '../Educative_problems'), 'utf8');
const lines = rawData.split('\n').map(line => line.trim());

const patterns = [];
let currentPattern = null;
let currentProblem = null;

const badLines = ['WEEK', 'My Proficiency', 'Introduction to'];
const difficulties = ['easy', 'med', 'hard'];

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    
    // Check if it's week marker
    if (line.startsWith('WEEK')) continue;
    if (line.includes('My Proficiency:')) continue;
    if (line.includes('Introduction to')) continue;

    // Check if it's a pattern header (e.g., "1.", "2.")
    if (/^\d+\.$/.test(line)) {
        // Next line should be the pattern name
        const patternName = lines[i + 1]?.trim();
        if (patternName) {
            currentPattern = {
                pattern: patternName,
                problems: []
            };
            patterns.push(currentPattern);
            i++; // skip the pattern name line
            
            // The next non-empty line is usually a description or empty
            while (i + 1 < lines.length && (!lines[i + 1].trim() || !lines[i + 1].trim().match(/^[A-Z]/))) {
               i++;
            }
            continue;
        }
    } else if (currentPattern) {
        // If it's a difficulty or tag, add to current problem badges
        if (difficulties.includes(line.toLowerCase()) || line.toLowerCase() === 'blind 75') {
            if (currentProblem) {
                currentProblem.badges.push(line);
            }
        } 
        // Otherwise, it might be a description line (if we just created a pattern and haven't seen a problem yet, or it's a new problem)
        else {
             // Let's assume it's a problem title
             // Make sure it doesn't look like a description (usually descriptions are long)
             if (line.length < 100 && !line.endsWith('.')) {
                 currentProblem = {
                     title: line,
                     badges: []
                 };
                 currentPattern.problems.push(currentProblem);
             }
        }
    }
}

const outputPath = path.join(__dirname, '../src/data/educative-patterns-extracted.json');
fs.writeFileSync(outputPath, JSON.stringify(patterns, null, 2));

console.log(`Cleaned ${patterns.length} patterns!`);
