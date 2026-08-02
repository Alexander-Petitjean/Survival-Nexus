import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const htmlFiles = readdirSync(root).filter(file => extname(file).toLowerCase() === '.html');
const errors = [];
const warnings = [];

const report = (collection, file, message) => collection.push(`${file}: ${message}`);

for (const file of htmlFiles) {
  const source = readFileSync(resolve(root, file), 'utf8');
  const titles = source.match(/<title\b[^>]*>[\s\S]*?<\/title>/gi) || [];
  const descriptions = source.match(/<meta\s+[^>]*name=["']description["'][^>]*>/gi) || [];
  const h1s = source.match(/<h1\b[^>]*>/gi) || [];
  const isRedirect = /<meta\s+[^>]*http-equiv=["']refresh["']/i.test(source);

  if (titles.length !== 1) report(errors, file, `expected one <title>; found ${titles.length}`);
  if (descriptions.length !== 1) report(warnings, file, `expected one meta description; found ${descriptions.length}`);
  if (h1s.length !== 1) report(errors, file, `expected one <h1>; found ${h1s.length}`);
  if (!isRedirect && file !== 'footer-check.html') {
    if (!/id=["']siteFooter["']/i.test(source)) report(errors, file, 'missing #siteFooter placeholder');
    if (!/<script\b[^>]*src=["']app\.js(?:[?#][^"']*)?["']/i.test(source)) report(errors, file, 'missing app.js');
  }
  if (/hello@example\.com/i.test(source)) report(warnings, file, 'placeholder contact email is still configured');

  const ids = [...source.matchAll(/\sid=["']([^"']+)["']/gi)].map(match => match[1]);
  for (const id of new Set(ids)) {
    if (ids.filter(value => value === id).length > 1) report(errors, file, `duplicate id "${id}"`);
  }

  for (const match of source.matchAll(/<(?:a|img|script|link)\b[^>]*(?:href|src)=["']([^"']+)["']/gi)) {
    const reference = match[1];
    if (reference.includes('${')) continue;
    if (/^(?:[a-z]+:|#|\/\/)/i.test(reference)) continue;
    const cleanReference = decodeURIComponent(reference.split(/[?#]/)[0]);
    if (!cleanReference) continue;
    const target = resolve(root, dirname(file), cleanReference);
    if (!existsSync(target)) report(errors, file, `missing local reference "${reference}"`);
  }

  for (const match of source.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      JSON.parse(match[1]);
    } catch (error) {
      report(errors, file, `invalid JSON-LD (${error.message})`);
    }
  }
}

const searchIndexPath = resolve(root, 'search-index.json');
if (!existsSync(searchIndexPath)) {
  report(errors, 'search-index.json', 'missing search index');
} else {
  try {
    const searchIndex = JSON.parse(readFileSync(searchIndexPath, 'utf8'));
    if (!Array.isArray(searchIndex)) throw new Error('top-level value must be an array');
    for (const [position, item] of searchIndex.entries()) {
      if (!item.title || !item.url || !item.description || !item.type) {
        report(errors, 'search-index.json', `entry ${position + 1} is missing a required field`);
      } else if (!existsSync(resolve(root, item.url.split('#')[0]))) {
        report(errors, 'search-index.json', `entry ${position + 1} references missing page "${item.url}"`);
      }
    }
  } catch (error) {
    report(errors, 'search-index.json', `invalid JSON (${error.message})`);
  }
}

for (const warning of warnings) console.warn(`WARN ${warning}`);
for (const error of errors) console.error(`ERROR ${error}`);

console.log(`Checked ${htmlFiles.length} HTML files: ${errors.length} error(s), ${warnings.length} warning(s).`);
if (errors.length) process.exitCode = 1;
