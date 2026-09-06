// Optional maintenance utility. Normal development/build never needs network access for fonts.
import { writeFile, mkdir } from 'node:fs/promises';
const stylesheet = await fetch('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;1,400&family=Manrope:wght@400;500;600;700&display=swap', {
  headers: { 'User-Agent': 'Mozilla/5.0 AppleWebKit/537.36 Chrome/131.0.0.0 Safari/537.36' },
});
if (!stylesheet.ok) throw new Error(`Font stylesheet download failed: ${stylesheet.status}`);
const input = await stylesheet.text();
const blocks = [...input.matchAll(/\/\* (cyrillic|latin) \*\/[\s\S]*?\}/g)].map(([block]) => block);
await mkdir('public/assets/fonts', { recursive: true });
const files = new Map();
for (const block of blocks) {
  const url = block.match(/url\(([^)]+)\)/)[1];
  if (files.has(url)) continue;
  const family = block.match(/font-family: '([^']+)'/)[1].toLowerCase();
  const style = block.match(/font-style: ([^;]+)/)[1];
  const weight = block.match(/font-weight: ([^;]+)/)[1];
  const subset = block.match(/\/\* (\w+) \*\//)[1];
  files.set(url, `${family}-${style}-${weight}-${subset}.woff2`);
}
await Promise.all([...files].map(async ([url, name]) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Font download failed: ${response.status}`);
  await writeFile(`public/assets/fonts/${name}`, Buffer.from(await response.arrayBuffer()));
}));
const css = blocks.map(block => block.replace(/url\(([^)]+)\)/, (_, url) => `url('./${files.get(url)}')`)).join('\n');
await writeFile('public/assets/fonts/fonts.css', css);
console.log(`Downloaded ${files.size} font files.`);
