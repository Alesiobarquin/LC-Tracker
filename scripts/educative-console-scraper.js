/**
 * Educative.io Pattern Scraper (Browser Console)
 * 
 * Instructions:
 * 1. Go to https://www.educative.io/courses/grokking-coding-interview
 * 2. Scroll through the "Learning Roadmap" section to ensure it's rendered.
 * 3. Expand the sections you want to scrape (or run the snippet below to try expanding all).
 * 4. Paste this code into your browser's Developer Tools Console.
 * 5. It will automatically download a JSON file with the patterns!
 */

(async () => {
  console.log("Expanding all syllabus items...");
  // Find all SVGs that act as expansion chevrons and click them
  const buttons = Array.from(document.querySelectorAll('div, button')).filter(el => {
    const text = el.innerText || '';
    return text.match(/^\d+\.\s+/) && el.querySelector('svg') && text.length < 50;
  });

  for (let btn of buttons) {
    try { btn.click(); } catch(e) {}
    // Sleep a tiny bit to avoid freezing
    await new Promise(r => setTimeout(r, 50));
  }

  await new Promise(r => setTimeout(r, 1000)); // Wait for render

  console.log("Scraping patterns and problems...");
  const container = Array.from(document.querySelectorAll('h2, h3'))
                    .find(h => h.innerText.includes('Learning Roadmap'))
                    ?.parentElement?.parentElement?.parentElement || document.body;

  const items = Array.from(container.querySelectorAll('a, h3'));
  
  const results = [];
  let currentPattern = null;

  for (let el of items) {
      const text = el.innerText.trim();
      if (!text) continue;

      if (el.tagName === 'H3') {
          const match = text.match(/^\d+\.\s+(.*)/);
          if (match) {
              currentPattern = { pattern: match[1].trim(), problems: [] };
              results.push(currentPattern);
          }
      } else if (el.tagName === 'A' && currentPattern) {
          if (text.toLowerCase().includes('introduction to') || text.includes(currentPattern.pattern)) continue;
          
          const lines = text.split('\n').map(x => x.trim()).filter(Boolean);
          const title = lines[0];
          const badges = lines.slice(1);
          
          // Basic filter to ensure it's a problem
          if (title && title.length > 5 && !title.toLowerCase().includes('educative')) {
              // Deduplicate
              if (!currentPattern.problems.some(p => p.title === title)) {
                  currentPattern.problems.push({ title, badges });
              }
          }
      }
  }

  const cleanResults = results.filter(r => r.problems.length > 0);
  console.log(`Scraped ${cleanResults.length} patterns!`);
  
  // Download the JSON
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(cleanResults, null, 2));
  const downloadAnchorNode = document.createElement('a');
  downloadAnchorNode.setAttribute("href",     dataStr);
  downloadAnchorNode.setAttribute("download", "educative-patterns-extracted.json");
  document.body.appendChild(downloadAnchorNode); // required for firefox
  downloadAnchorNode.click();
  downloadAnchorNode.remove();
})();
