// Build tĩnh: content/*.yml + src/ -> dist/
//   dist/index.html      (vi)
//   dist/en/index.html   (en)
import { readFile, writeFile, mkdir, rm, cp } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { parse } from 'yaml';
import { renderPage, renderWork, render404 } from './src/render.mjs';

const OUT = 'dist';
const SCENES = 6; // số chương có cảnh 3D tương ứng trong src/story.js
const require = createRequire(import.meta.url);
const load = async (p) => parse(await readFile(p, 'utf8'));

function check(c, file) {
  const required = ['lang', 'path', 'meta', 'ui', 'hero', 'chapters', 'footer'];
  const missing = required.filter((k) => c[k] == null);
  if (missing.length) throw new Error(`${file}: thiếu khóa ${missing.join(', ')}`);
  if (c.chapters.length !== SCENES) throw new Error(`${file}: cần đúng ${SCENES} chương (đang có ${c.chapters.length})`);
  c.chapters.forEach((ch, i) => {
    if (!ch.name || !ch.title) throw new Error(`${file}: chương ${i + 1} thiếu name hoặc title`);
  });
  if (c.work) {
    const w = ['path', 'nav', 'title', 'groups', 'open'].filter((k) => c.work[k] == null);
    if (w.length) throw new Error(`${file}: work thiếu khóa ${w.join(', ')}`);
  }
}

// Ghi file với tên có hash nội dung để cache lâu dài.
async function emit(name, ext, content) {
  const hash = createHash('sha256').update(content).digest('hex').slice(0, 10);
  const href = `/${name}.${hash}.${ext}`;
  await writeFile(`${OUT}${href}`, content);
  return href;
}

const site = await load('content/site.yml');
const vi = await load('content/vi.yml');
const en = await load('content/en.yml');
check(vi, 'content/vi.yml');
check(en, 'content/en.yml');

await rm(OUT, { recursive: true, force: true });
await mkdir(`${OUT}/en`, { recursive: true });
await cp('public', OUT, { recursive: true });

const assets = {
  css: await emit('styles', 'css', await readFile('src/styles.css')),
  story: await emit('story', 'js', await readFile('src/story.js')),
  three: await emit('three.r128', 'js', await readFile(require.resolve('three/build/three.min.js'))),
};

await writeFile(`${OUT}/index.html`, renderPage({ c: vi, other: en, site, assets }));
await writeFile(`${OUT}/en/index.html`, renderPage({ c: en, other: vi, site, assets }));
await writeFile(`${OUT}/404.html`, render404({ vi, en, assets }));

// Mỗi cặp [vi, en] là một trang có hai bản ngôn ngữ.
const pairs = [[vi.path, en.path]];
if (vi.work && en.work) {
  for (const [c, other] of [[vi, en], [en, vi]]) {
    await mkdir(`${OUT}${c.work.path}`, { recursive: true });
    await writeFile(`${OUT}${c.work.path}index.html`, renderWork({ c, other, site, assets }));
  }
  pairs.push([vi.work.path, en.work.path]);
}

const today = new Date().toISOString().slice(0, 10);
const urls = pairs.flatMap(([pv, pe]) => {
  const alt = `
    <xhtml:link rel="alternate" hreflang="vi" href="${site.url}${pv}"/>
    <xhtml:link rel="alternate" hreflang="en" href="${site.url}${pe}"/>`;
  return [pv, pe].map((p) => `  <url><loc>${site.url}${p}</loc><lastmod>${today}</lastmod>${alt}
  </url>`);
});
await writeFile(`${OUT}/sitemap.xml`, `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join('\n')}
</urlset>
`);
await writeFile(`${OUT}/robots.txt`, `User-agent: *\nAllow: /\n\nSitemap: ${site.url}/sitemap.xml\n`);

console.log(`Built ${OUT}/ — vi: ${vi.path}, en: ${en.path}`, assets);
