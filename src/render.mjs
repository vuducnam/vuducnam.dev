// Render trang câu chuyện từ nội dung YAML. Chữ là HTML thật; cảnh 3D (src/story.js) chỉ là lớp nền.

export const esc = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const LOGO = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FF6B2C" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2.5c.7 3.3 3.2 5 4.7 7.3A6.6 6.6 0 1 1 5.8 11.4c.9 1.3 2.1 1.9 3.2 2-.6-3.9.8-7.8 3-10.9z"/><path d="M12 21a3 3 0 0 1-3-3c0-1.8 1.6-2.9 3-5.2 1.4 2.3 3 3.4 3 5.2a3 3 0 0 1-3 3z"/></svg>';

const FONTS = 'https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&family=Caveat:wght@700&display=swap';

function chapterHtml(ch, n, total, c, site) {
  const id = `c${n}`;
  const parts = [
    `<p class="label">${esc(c.ui.chapter)} <b>${n}</b>/${total} · ${esc(ch.name)}</p>`,
    `<h2 id="h-${id}">${esc(ch.title)}</h2>`,
  ];
  if (ch.body) parts.push(`<p class="body">${esc(ch.body)}</p>`);
  if (ch.chips) parts.push(`<ul class="chips">${ch.chips.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>`);
  if (ch.roles) {
    parts.push(`<ul class="roles">${ch.roles.map((r) => `<li><b>${esc(r.who)}</b><span>${esc(r.what)}</span></li>`).join('')}</ul>`);
  }
  if (ch.principles) parts.push(`<ol class="principles">${ch.principles.map((p) => `<li><b>${esc(p)}</b></li>`).join('')}</ol>`);
  if (ch.aside) parts.push(`<p class="aside">${esc(ch.aside)}</p>`);
  if (ch.contact) {
    parts.push(`<div class="email">
        <a href="mailto:${esc(site.email)}" id="email-text">${esc(site.email)}</a>
        <button class="btn btn-primary" type="button" id="copy-email" data-copy="${esc(site.email)}" data-done="${esc(c.ui.copied)}" data-fallback="${esc(c.ui.copy_fallback)}">${esc(c.ui.copy)}</button>
      </div>`);
    parts.push(`<div class="actions"><a class="btn" href="${esc(site.github)}" rel="me noopener">GitHub</a></div>`);
    parts.push(`<p class="sig">${esc(c.hero.signature)}</p>`);
    parts.push(`<p class="foot">© ${new Date().getFullYear()} ${esc(c.hero.name)} · ${esc(c.footer.note)} · <a href="${site.repo}/edit/main/content/${c.lang}.yml">${esc(c.footer.edit)}</a></p>`);
  }
  return `<section class="ch" id="${id}" data-name="${esc(ch.name)}" aria-labelledby="h-${id}">
    <div class="panel">
      ${parts.join('\n      ')}
    </div>
  </section>`;
}

export function renderPage({ c, other, site, assets }) {
  const pageUrl = site.url + c.path;
  const total = c.chapters.length;
  const names = [c.hero.name_short, ...c.chapters.map((ch) => ch.name)];
  const ld = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: c.hero.name,
    url: site.url,
    email: `mailto:${site.email}`,
    jobTitle: c.meta.job_title,
    description: c.meta.description,
    address: { '@type': 'PostalAddress', addressLocality: 'Ho Chi Minh City', addressCountry: 'VN' },
    sameAs: [site.github],
  }).replace(/</g, '\\u003c');

  const langLink = (code) => {
    const target = code === c.lang ? c : other;
    const cur = code === c.lang ? ' aria-current="page"' : '';
    return `<a href="${target.path}" hreflang="${code}" lang="${code}"${cur}>${code.toUpperCase()}</a>`;
  };

  return `<!doctype html>
<html lang="${c.lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(c.meta.title)}</title>
<meta name="description" content="${esc(c.meta.description)}">
<link rel="canonical" href="${pageUrl}">
<link rel="alternate" hreflang="${c.lang}" href="${pageUrl}">
<link rel="alternate" hreflang="${other.lang}" href="${site.url + other.path}">
<link rel="alternate" hreflang="x-default" href="${site.url}/">
<meta property="og:type" content="profile">
<meta property="og:title" content="${esc(c.meta.title)}">
<meta property="og:description" content="${esc(c.meta.description)}">
<meta property="og:url" content="${pageUrl}">
<meta property="og:locale" content="${c.locale}">
<meta property="og:locale:alternate" content="${other.locale}">
<meta name="twitter:card" content="summary">
<meta name="theme-color" content="#110C0A">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${FONTS}">
<link rel="stylesheet" href="${assets.css}">
<script type="application/ld+json">${ld}</script>
</head>
<body>
<a class="skip" href="#c1">${esc(c.ui.skip)}</a>
<canvas id="scene" aria-hidden="true"></canvas>

<header class="hud">
  <a class="brand" href="#c0" aria-label="vuducnam.dev — ${esc(c.ui.home)}">${LOGO}<span>vuducnam<b>.dev</b></span></a>
  <div class="hud-end">
    <p class="chapter" aria-hidden="true"><strong id="hud-num">00/0${total}</strong><span id="hud-name">${esc(names[0])}</span></p>
    <div class="lang" role="group" aria-label="${esc(c.ui.language)}">${langLink('vi')}${langLink('en')}</div>
  </div>
</header>

<nav class="rail" aria-label="${esc(c.ui.chapters)}">
  ${names.map((n, i) => `<a href="#c${i}"${i === 0 ? ' aria-current="step"' : ''}><span>${esc(n)}</span><i></i></a>`).join('\n  ')}
</nav>

<main>
  <section class="ch" id="c0" data-name="${esc(c.hero.name_short)}" aria-label="${esc(c.hero.name)}">
    <div class="panel">
      <p class="prompt"><span class="cmd"><span class="host">nam@vuducnam</span>:~$ whoami</span><span>${esc(c.hero.answer)}<span class="cursor" aria-hidden="true"></span></span></p>
      <h1>${esc(c.hero.name)}</h1>
      <p class="role">${esc(c.hero.role)} · <span>${esc(c.hero.role_accent)}</span></p>
      <p class="lead">${esc(c.hero.lead)}</p>
      <p class="sig">${esc(c.hero.signature)}</p>
      <p class="cue"><i aria-hidden="true"></i>${esc(c.ui.scroll)}</p>
    </div>
  </section>

  ${c.chapters.map((ch, i) => chapterHtml(ch, i + 1, total, c, site)).join('\n\n  ')}
</main>

<script src="${assets.three}" defer></script>
<script src="${assets.story}" defer></script>
</body>
</html>
`;
}

export function render404({ vi, en, assets }) {
  return `<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>404 — vuducnam.dev</title>
<meta name="robots" content="noindex">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="${FONTS}">
<link rel="stylesheet" href="${assets.css}">
</head>
<body>
<main class="notfound">
  <p class="prompt"><span class="cmd"><span class="host">nam@vuducnam</span>:~$ cd ???</span><span>404 · không có trang này / page not found<span class="cursor" aria-hidden="true"></span></span></p>
  <div class="actions">
    <a class="btn btn-primary" href="${vi.path}">Về trang chủ</a>
    <a class="btn" href="${en.path}">Back to home</a>
  </div>
</main>
</body>
</html>
`;
}
