// Build tĩnh: content/*.yml + src/ -> dist/
//   dist/index.html      (vi)
//   dist/en/index.html   (en)
import { readFile, writeFile, mkdir, rm, cp } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { parse } from 'yaml';
import { renderPage, render404 } from './src/render.mjs';

const OUT = 'dist';
const load = async (p) => parse(await readFile(p, 'utf8'));

function check(c, file) {
  const required = ['lang', 'path', 'meta', 'nav', 'hero', 'fire', 'about', 'capabilities', 'thinking', 'contact', 'footer'];
  const missing = required.filter((k) => c[k] == null);
  if (missing.length) throw new Error(`${file}: thiếu khóa ${missing.join(', ')}`);
}

const site = await load('content/site.yml');
const vi = await load('content/vi.yml');
const en = await load('content/en.yml');
check(vi, 'content/vi.yml');
check(en, 'content/en.yml');

await rm(OUT, { recursive: true, force: true });
await mkdir(`${OUT}/en`, { recursive: true });
await cp('public', OUT, { recursive: true });

const css = await readFile('src/styles.css', 'utf8');
const hash = createHash('sha256').update(css).digest('hex').slice(0, 10);
const cssHref = `/styles.${hash}.css`;
await writeFile(`${OUT}${cssHref}`, css);

await writeFile(`${OUT}/index.html`, renderPage({ c: vi, other: en, site, cssHref }));
await writeFile(`${OUT}/en/index.html`, renderPage({ c: en, other: vi, site, cssHref }));
await writeFile(`${OUT}/404.html`, render404({ vi, en, cssHref }));

const today = new Date().toISOString().slice(0, 10);
const alt = `
    <xhtml:link rel="alternate" hreflang="vi" href="${site.url}${vi.path}"/>
    <xhtml:link rel="alternate" hreflang="en" href="${site.url}${en.path}"/>`;
await writeFile(`${OUT}/sitemap.xml`, `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
  <url><loc>${site.url}${vi.path}</loc><lastmod>${today}</lastmod>${alt}
  </url>
  <url><loc>${site.url}${en.path}</loc><lastmod>${today}</lastmod>${alt}
  </url>
</urlset>
`);
await writeFile(`${OUT}/robots.txt`, `User-agent: *\nAllow: /\n\nSitemap: ${site.url}/sitemap.xml\n`);

console.log(`Built ${OUT}/ — vi: ${vi.path}, en: ${en.path}, css: ${cssHref}`);
