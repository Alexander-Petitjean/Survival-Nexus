import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const rootFiles = readdirSync(root);
const verificationFiles = rootFiles.filter(file => /^google[a-f0-9]+\.html$/i.test(file));
const htmlFiles = rootFiles.filter(file => (
  extname(file).toLowerCase() === '.html' && !verificationFiles.includes(file)
));
const errors = [];
const warnings = [];
const siteBase = 'https://alexander-petitjean.github.io/Survival-Nexus/';
const expectedNoindex = new Set([
  '404.html',
  'footer-check.html',
  'search.html'
]);
const indexableCanonicalUrls = [];

const report = (collection, file, message) => collection.push(`${file}: ${message}`);

for (const file of verificationFiles) {
  const expected = `google-site-verification: ${file}`;
  if (readFileSync(resolve(root, file), 'utf8').trim() !== expected) {
    report(errors, file, 'Google site verification token does not match its filename');
  }
}

for (const file of htmlFiles) {
  const source = readFileSync(resolve(root, file), 'utf8');
  const titles = source.match(/<title\b[^>]*>[\s\S]*?<\/title>/gi) || [];
  const descriptions = source.match(/<meta\s+[^>]*name=["']description["'][^>]*>/gi) || [];
  const h1s = source.match(/<h1\b[^>]*>/gi) || [];
  const metaTags = source.match(/<meta\b[^>]*>/gi) || [];
  const refreshTag = metaTags.find(tag => /http-equiv=["']refresh["']/i.test(tag));
  const refreshContent = refreshTag?.match(/content=["']([^"']+)["']/i)?.[1];
  const refreshTarget = refreshContent?.match(/url\s*=\s*(.+)\s*$/i)?.[1]?.trim();
  const isRedirect = Boolean(refreshTag);
  const robotsTags = source.match(/<meta\s+[^>]*name=["']robots["'][^>]*>/gi) || [];
  const isNoindex = robotsTags.some(tag => /content=["'][^"']*\bnoindex\b/i.test(tag));
  const canonicalTags = source.match(/<link\s+[^>]*rel=["'][^"']*\bcanonical\b[^"']*["'][^>]*>/gi) || [];
  const canonicalUrls = canonicalTags
    .map(tag => tag.match(/href=["']([^"']+)["']/i)?.[1])
    .filter(Boolean);

  if (titles.length !== 1) report(errors, file, `expected one <title>; found ${titles.length}`);
  if (descriptions.length !== 1) report(warnings, file, `expected one meta description; found ${descriptions.length}`);
  if (h1s.length !== 1) report(errors, file, `expected one <h1>; found ${h1s.length}`);
  if ((expectedNoindex.has(file) || isRedirect) && !isNoindex) {
    report(errors, file, 'expected a noindex robots directive');
  }
  if (!expectedNoindex.has(file) && !isRedirect) {
    const expectedCanonical = file === 'index.html' ? siteBase : `${siteBase}${file}`;
    if (canonicalUrls.length !== 1) {
      report(errors, file, `expected one canonical URL; found ${canonicalUrls.length}`);
    } else if (canonicalUrls[0] !== expectedCanonical) {
      report(errors, file, `canonical URL should be "${expectedCanonical}"`);
    }
    if (isNoindex) report(warnings, file, 'public page is unexpectedly marked noindex');
    if (!isNoindex && canonicalUrls.length === 1) indexableCanonicalUrls.push(canonicalUrls[0]);
  }
  if (isRedirect) {
    if (!refreshTarget) report(errors, file, 'redirect is missing a readable refresh target');
    if (canonicalUrls.length !== 1) {
      report(errors, file, `redirect should have one canonical URL; found ${canonicalUrls.length}`);
    } else if (refreshTarget) {
      const expectedCanonical = new URL(refreshTarget, siteBase).href;
      if (canonicalUrls[0] !== expectedCanonical) {
        report(errors, file, `redirect canonical should be "${expectedCanonical}"`);
      }
    }
  }
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

const sitemapPath = resolve(root, 'sitemap.xml');
if (!existsSync(sitemapPath)) {
  report(errors, 'sitemap.xml', 'missing sitemap');
} else {
  const sitemap = readFileSync(sitemapPath, 'utf8');
  const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/gi)].map(match => match[1].trim());
  const uniqueSitemapUrls = new Set(sitemapUrls);
  if (sitemapUrls.length !== uniqueSitemapUrls.size) report(errors, 'sitemap.xml', 'contains duplicate URLs');
  for (const url of indexableCanonicalUrls) {
    if (!uniqueSitemapUrls.has(url)) report(errors, 'sitemap.xml', `missing indexable canonical "${url}"`);
  }
  for (const url of uniqueSitemapUrls) {
    if (!indexableCanonicalUrls.includes(url)) report(errors, 'sitemap.xml', `contains non-indexable or unknown URL "${url}"`);
  }
}

const robotsPath = resolve(root, 'robots.txt');
if (!existsSync(robotsPath)) {
  report(errors, 'robots.txt', 'missing robots file');
} else if (!readFileSync(robotsPath, 'utf8').includes(`Sitemap: ${siteBase}sitemap.xml`)) {
  report(errors, 'robots.txt', 'missing the canonical sitemap declaration');
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
