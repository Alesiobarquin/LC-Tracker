import { chromium } from 'playwright';
import { readFileSync } from 'fs';
import path from 'path';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  const svgPath = path.resolve('public', 'favicon.svg');
  const svgContent = readFileSync(svgPath, 'utf8');

  // Instead of navigating to file://, we load the SVG string directly 
  // into an HTML document so we can control the background and sizing perfectly.
  const sizes = [
    { name: 'favicon-192x192.png', size: 192, bg: null },
    { name: 'favicon-48x48.png', size: 48, bg: null },
    { name: 'apple-touch-icon.png', size: 180, bg: '#09090b' },
  ];

  for (const { name, size, bg } of sizes) {
    await page.setViewportSize({ width: size, height: size });
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body, html { margin: 0; padding: 0; width: ${size}px; height: ${size}px; background: ${bg || 'transparent'}; display: flex; justify-content: center; align-items: center; overflow: hidden; }
            svg { width: 100%; height: 100%; }
          </style>
        </head>
        <body>
          ${svgContent}
        </body>
      </html>
    `;
    
    await page.setContent(htmlContent);
    await page.waitForTimeout(500); // Give fonts/effects time to paint
    
    await page.screenshot({ 
      path: path.join('public', name), 
      omitBackground: !bg,
      clip: { x: 0, y: 0, width: size, height: size }
    });
    console.log(`Generated ${name}`);
  }

  await browser.close();
})();
