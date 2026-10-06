// Render the source SVG with the same browser engine used for interface checks.
import { chromium } from "playwright";
import { readFile, writeFile } from "node:fs/promises";
const svg = await readFile(
  new URL("../public/favicon.svg", import.meta.url),
  "utf8",
);
const browser = await chromium.launch({ headless: true });
try {
  for (const [size, name] of [
    [48, "favicon-48x48.png"],
    [192, "favicon-192x192.png"],
    [180, "apple-touch-icon.png"],
  ]) {
    const page = await browser.newPage({
      viewport: { width: size, height: size },
      deviceScaleFactor: 1,
    });
    await page.setContent(
      `<style>html,body{margin:0;padding:0}svg{display:block;width:100vw;height:100vh}</style>${svg}`,
    );
    const png = await page.screenshot({ omitBackground: true });
    await writeFile(new URL(`../public/${name}`, import.meta.url), png);
    if (size === 48) {
      const header = Buffer.alloc(22);
      header.writeUInt16LE(1, 2);
      header.writeUInt16LE(1, 4);
      header[6] = size;
      header[7] = size;
      header.writeUInt16LE(1, 10);
      header.writeUInt16LE(32, 12);
      header.writeUInt32LE(png.length, 14);
      header.writeUInt32LE(22, 18);
      await writeFile(
        new URL("../public/favicon.ico", import.meta.url),
        Buffer.concat([header, png]),
      );
    }
    await page.close();
  }
} finally {
  await browser.close();
}
