import { chromium } from 'playwright';
import fs from 'fs';

(async () => {
    console.log("Starting Playwright...");
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    console.log("Navigating to course page...");
    await page.goto("https://www.educative.io/courses/grokking-coding-interview", {
        waitUntil: "domcontentloaded",
        timeout: 60000
    });

    console.log("Waiting for the Learning Roadmap section...");
    await page.waitForTimeout(3000);

    // Scroll a bunch to load all lazy content
    let currentHeight = 0;
    while (currentHeight < await page.evaluate(() => document.body.scrollHeight)) {
        await page.evaluate(`window.scrollBy(0, 1000)`);
        await page.waitForTimeout(500);
        currentHeight += 1000;
        
        // Stop if we see the footer section
        const isFooterVisible = await page.evaluate(() => {
            const el = Array.from(document.querySelectorAll('*')).find(el => el.innerText && el.innerText.includes('Frequently Asked Questions'));
            return el ? el.getBoundingClientRect().top < window.innerHeight : false;
        });
        if (isFooterVisible) break;
    }

    // Scroll back to Learning Roadmap
    await page.evaluate(() => {
        const h2 = Array.from(document.querySelectorAll('h2, h3')).find(h => h.innerText.includes('Learning Roadmap'));
        if (h2) h2.scrollIntoView();
    });
    await page.waitForTimeout(1000);

    // Literally find EVERY SVG inside the main roadmap listing and click its parent element if it's a button or heading
    await page.evaluate(async () => {
        const RoadmapHeading = Array.from(document.querySelectorAll('h2, h3')).find(h => h.innerText.includes('Learning Roadmap'));
        if (!RoadmapHeading) return;
        let container = RoadmapHeading;
        while (container && container.parentElement && !container.innerText.includes('Challenge Yourself')) {
            container = container.parentElement;
        }
        
        if (container) {
            const svgs = container.querySelectorAll('svg');
            for (let svg of svgs) {
                try {
                    let parent = svg.parentElement;
                    if (parent) {
                        parent.click();
                        await new Promise(r => setTimeout(r, 200));
                    }
                } catch(e) {}
            }
        }
    });

    await page.waitForTimeout(3000); // wait for all expands to finish rendering

    const data = await page.evaluate(() => {
        // Parse everything inside the roadmap container
        const headings = Array.from(document.querySelectorAll('h2, h3'));
        const roadmapH2 = headings.find(h => h.innerText.includes('Learning Roadmap'));
        let container = roadmapH2;
        for(let i=0; i<4; i++) {
           if(container && container.parentElement) container = container.parentElement;
        }
        
        if (!container) return { error: "No roadmap container found" };

        const elements = Array.from(container.querySelectorAll('li, div, a'));
        
        const categories = {};
        let currentCategory = null;

        for (const el of elements) {
            const text = el.innerText ? el.innerText.trim() : '';

            // E.g. "3. Sliding Window"
            if (text.match(/^\d+\.\s+/) && text.split('\n').length <= 2 && el.tagName !== 'LI' && el.tagName !== 'P') {
                const cleanName = text.replace(/^\d+\.\s*/, '').trim();
                
                if (cleanName && cleanName !== "Challenge Yourself" && !cleanName.includes("Frequently Asked")) {
                    if (!categories[cleanName]) {
                        categories[cleanName] = { pattern: cleanName, problems: [] };
                    }
                    currentCategory = categories[cleanName];
                }
            } else if (el.tagName.toLowerCase() === 'a' && currentCategory) {
                if (text.toLowerCase().includes('introduction to') || text === currentCategory.pattern) continue;
                
                const lines = text.split('\n').map(x => x.trim()).filter(Boolean);
                const title = lines[0];
                const badges = lines.slice(1);
                
                if (title && !title.toLowerCase().includes('grokking') && !title.toLowerCase().includes('educative') && title.length > 3) {
                    if (!currentCategory.problems.some(p => p.title === title)) {
                        currentCategory.problems.push({
                            title: title,
                            badges: badges
                        });
                    }
                }
            }
        }
        
        return Object.values(categories).filter(c => c.problems.length > 0);
    });

    const fileOutput = "src/data/educative-patterns-extracted.json";
    fs.writeFileSync(fileOutput, JSON.stringify(data, null, 2));
    console.log(`Scraped ${data.length} patterns. Saved to ${fileOutput}`);

    await browser.close();
})();