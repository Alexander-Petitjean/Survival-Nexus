import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const files = (await readdir(root)).filter(file => file.endsWith('.html')).sort();
const errors = [];
let amazonLinks = 0;

for (const file of files) {
  const html = await readFile(path.join(root, file), 'utf8');
  const anchors = (html.match(/<a\b[^>]*\bhref=["'][^"']+["'][^>]*>[\s\S]*?<\/a>/gi) || [])
    .filter(anchor => /amzn\.to|amazon\.com[^"']*(?:[?&]|&amp;)tag=/i.test(anchor));

  for (const anchor of anchors) {
    amazonLinks += 1;
    const rel = anchor.match(/\brel=["']([^"']*)["']/i)?.[1].toLowerCase().split(/\s+/) || [];
    const label = anchor.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    const ariaLabel = anchor.match(/\baria-label=["']([^"']*)["']/i)?.[1] || '';

    if (!/\btarget=["']_blank["']/i.test(anchor)) errors.push(`${file}: Amazon link must open in a new tab.`);
    for (const token of ['sponsored', 'nofollow', 'noopener']) {
      if (!rel.includes(token)) errors.push(`${file}: Amazon link is missing rel="${token}".`);
    }
    if (!/paid (?:signup )?link/i.test(`${label} ${ariaLabel}`)) {
      errors.push(`${file}: Amazon link is not plainly labeled as a paid link.`);
    }
  }
}

const app = await readFile(path.join(root, 'app.js'), 'utf8');
if (!/As an Amazon Associate I earn from qualifying purchases\./.test(app)) {
  errors.push('app.js: shared footer is missing the required Amazon Associates statement.');
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exitCode = 1;
} else {
  console.log(`Checked ${amazonLinks} Amazon link occurrence(s) across ${files.length} HTML files: 0 error(s).`);
}
