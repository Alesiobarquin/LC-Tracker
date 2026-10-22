// Keep every raster icon and sharing card derived from the checked-in SVGs.
import { chromium } from 'playwright';
import { readFile, writeFile } from 'node:fs/promises';

const svg = await readFile(new URL('../public/favicon.svg', import.meta.url), 'utf8');
const browser = await chromium.launch({ headless: true });
const icoImages = [];
try {
  for (const size of [16, 32, 48, 96, 180, 192, 512]) {
    const page = await browser.newPage({ viewport: { width: size, height: size }, deviceScaleFactor: 1 });
    await page.setContent(`<style>html,body{margin:0;padding:0}svg{display:block;width:100vw;height:100vh}</style>${svg}`);
    const png = await page.screenshot({ omitBackground: true });
    if (size <= 48) icoImages.push({ size, png });
    const name = size === 180 ? 'apple-touch-icon.png' : size === 512 ? 'icon-512x512.png' : `favicon-${size}x${size}.png`;
    if (size >= 48) await writeFile(new URL(`../public/${name}`, import.meta.url), png);
    if (size === 512) {
      // The complete mark fits inside the central 80% safe circle of a maskable icon.
      const maskable = svg.replace('rx="6"', 'rx="0"').replace('translate(.8 .8) scale(1.2)', 'translate(4 4)');
      await page.setContent(`<style>html,body{margin:0;padding:0}svg{display:block;width:100vw;height:100vh}</style>${maskable}`);
      await writeFile(new URL('../public/icon-maskable-512x512.png', import.meta.url), await page.screenshot());
    }
    await page.close();
  }
  const directory = Buffer.alloc(6 + 16 * icoImages.length);
  directory.writeUInt16LE(1, 2);
  directory.writeUInt16LE(icoImages.length, 4);
  let offset = directory.length;
  icoImages.forEach(({ size, png }, index) => {
    const entry = 6 + 16 * index;
    directory[entry] = size;
    directory[entry + 1] = size;
    directory.writeUInt16LE(1, entry + 4);
    directory.writeUInt16LE(32, entry + 6);
    directory.writeUInt32LE(png.length, entry + 8);
    directory.writeUInt32LE(offset, entry + 12);
    offset += png.length;
  });
  await writeFile(new URL('../public/favicon.ico', import.meta.url), Buffer.concat([directory, ...icoImages.map(image => image.png)]));

  const card = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  const socialSvg = await readFile(new URL('../public/og-image.svg', import.meta.url), 'utf8');
  await card.setContent(`<style>html,body{margin:0;padding:0}svg{display:block}</style>${socialSvg}`);
  await card.evaluate(() => document.fonts.ready);
  await writeFile(new URL('../public/og-image.png', import.meta.url), await card.screenshot());
  await card.close();
} finally {
  await browser.close();
}
console.log('Rendered ICO, PNG, Apple, maskable, and 1200×630 social assets.');
