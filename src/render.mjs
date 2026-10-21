// Render một trang hoàn chỉnh từ nội dung YAML. Không framework, không runtime JS ngoài menu mobile.

export const esc = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const icon = {
  logo: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FF6B2C" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2.5c.7 3.3 3.2 5 4.7 7.3A6.6 6.6 0 1 1 5.8 11.4c.9 1.3 2.1 1.9 3.2 2-.6-3.9.8-7.8 3-10.9z"/><path d="M12 21a3 3 0 0 1-3-3c0-1.8 1.6-2.9 3-5.2 1.4 2.3 3 3.4 3 5.2a3 3 0 0 1-3 3z"/></svg>',
  arrow: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  external: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17L17 7M8 7h9v9"/></svg>',
  pin: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>',
  mail: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>',
  menu: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h10"/></svg>',
};

// Ngọn lửa ASCII: ký tự càng đặc thì càng nóng.
const FLAME = [
  '                 .',
  '                .:          .',
  '         .     .:*.        .:',
  '        .:     :*#:.      .:*',
  '        :*.   .*#%*:     .:*:',
  '       .:*:  .:#%%#*.   .:*#:',
  '   .   :*#*..*#%@%#*:  .:*#*.',
  '  .:  .:*#%*#%@@%#*:..:*#%*:',
  '  :*. :*#%%#%@@@%#**:*#%%#:',
  ' .:*:.*#%@%%@@@@%##%#%@%#*.',
  ' :*#**#%@@@@@@@@@%%%@@%#*:',
  '.:*#%%%@@@@@@@@@@@@@@@%#*:.',
  ':*#%@@@@@@@@@@@@@@@@@@%#*:.',
  ':*#%@@@@@@@@@@@@@@@@@@%%#*:',
  '.:*#%@@@@@@@@@@@@@@@@@%#*:.',
  ' .:*#%%@@@@@@@@@@@@@%%#*:.',
  '  .:*##%%@@@@@@@@@%%##*:.',
  '    .:**##%%%%%%%##**:.',
  '       ..::*****::..',
];
const HEAT = { '@': 't5', '%': 't4', '#': 't3', '*': 't2', ':': 't1', '.': 't0' };

function flameHtml() {
  return FLAME.map((line) => {
    let out = '';
    let cls = null;
    let run = '';
    const flush = () => {
      if (!run) return;
      out += cls ? `<span class="${cls}">${run}</span>` : run;
      run = '';
    };
    for (const ch of line) {
      const c = HEAT[ch] || null;
      if (c !== cls) { flush(); cls = c; }
      run += ch;
    }
    flush();
    return out;
  }).join('\n');
}

const SPARKS = [
  [38, 0, -18, ''], [46, 0.5, 12, 't3'], [55, 1.1, 24, ''], [61, 1.7, -10, 't5'],
  [33, 2.2, -26, 't3'], [50, 2.6, 6, 't5'], [66, 0.9, 30, 't1'],
];

const yamlLine = (k, v) =>
  `<span class="k">${esc(k)}</span><span class="p">: </span><span class="v">${esc(v)}</span>`;
const yamlList = (k, items) =>
  [`<span class="k">${esc(k)}</span><span class="p">:</span>`]
    .concat(items.map((i) => `<span class="p">  - </span><span class="v">${esc(i)}</span>`))
    .join('\n');

export function renderPage({ c, other, site, cssHref }) {
  const pageUrl = site.url + c.path;
  const editUrl = `${site.repo}/edit/main/content/${c.lang}.yml`;
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: c.hero.name,
    url: site.url,
    email: `mailto:${site.email}`,
    jobTitle: c.meta.job_title,
    worksFor: { '@type': 'Organization', name: c.hero.company, url: site.company_url },
    address: { '@type': 'PostalAddress', addressLocality: 'Ho Chi Minh City', addressCountry: 'VN' },
    sameAs: [site.github],
    knowsAbout: ['ERP', 'POS', 'AI agents', 'System architecture', 'NestJS', 'Go', 'Rust', 'PostgreSQL', 'Kafka'],
  };
  const ldJson = JSON.stringify(ld).replace(/</g, '\\u003c');

  const langLink = (code, label) => {
    const target = code === c.lang ? c : other;
    const current = code === c.lang ? ' aria-current="page"' : '';
    return `<a href="${target.path}" hreflang="${code}" lang="${code}"${current}>${label}</a>`;
  };

  const navItems = [
    ['about', c.nav.about],
    ['capabilities', c.nav.capabilities],
    ['thinking', c.nav.thinking],
    ['contact', c.nav.contact],
  ];

  return `<!doctype html>
<html lang="${c.lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
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
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&family=Caveat:wght@700&display=swap">
<link rel="stylesheet" href="${cssHref}">
<script type="application/ld+json">${ldJson}</script>
</head>
<body>
<a class="skip" href="#main">${esc(c.nav.skip)}</a>

<header class="site-header">
  <nav class="wrap nav" aria-label="${esc(c.nav.about)} · ${esc(c.nav.contact)}">
    <a class="brand" href="${c.path}">${icon.logo}<span>vuducnam<b>.dev</b></span></a>
    <div class="nav-links">
      ${navItems.map(([id, label]) => `<a href="#${id}">${esc(label)}</a>`).join('\n      ')}
    </div>
    <div class="nav-end">
      <div class="lang" role="group" aria-label="${esc(c.nav.language)}">${langLink('vi', 'VI')}${langLink('en', 'EN')}</div>
      <button class="menu-btn" type="button" aria-label="${esc(c.nav.menu)}" aria-expanded="false" aria-controls="mobile-menu">${icon.menu}</button>
    </div>
  </nav>
  <div id="mobile-menu" class="wrap mobile-menu" hidden>
    ${navItems.map(([id, label], i) => `<a href="#${id}"><span>${esc(label)}</span><span>0${i + 1}</span></a>`).join('\n    ')}
  </div>
</header>

<main id="main">

<section class="hero" aria-label="${esc(c.hero.name)}">
  <div class="wrap split hero-grid">
    <div class="stack hero-copy">
      <p class="prompt"><span class="cmd"><span class="host">nam@redsun</span>:~$ whoami</span><span>${esc(c.hero.answer)}<span class="cursor" aria-hidden="true"></span></span></p>
      <h1>${esc(c.hero.name)}</h1>
      <p class="role">${esc(c.hero.role_prefix)} <span>${esc(c.hero.company)}</span></p>
      <p class="lead">${esc(c.hero.lead)}</p>
      <p class="signature">${esc(c.hero.signature)}</p>
      <div class="actions">
        <a class="btn btn-primary" href="#contact">${esc(c.hero.cta_primary)}${icon.arrow}</a>
        <a class="btn" href="#capabilities">${esc(c.hero.cta_secondary)}</a>
      </div>
      <p class="meta">${icon.pin}${esc(c.hero.location)}</p>
    </div>

    <figure class="fire">
      <div class="fire-head"><strong>${esc(c.fire.label)}</strong><span class="fire-status"><span class="pulse" aria-hidden="true"></span>${esc(c.fire.status)}</span></div>
      <div class="fire-stage">
        ${SPARKS.map(([l, d, dx, h]) => `<span class="spark${h ? ' ' + h + 'b' : ''}" aria-hidden="true" style="left:${l}%;animation-delay:${d}s;--dx:${dx}px"></span>`).join('\n        ')}
<pre class="flame" aria-hidden="true">${flameHtml()}</pre>
        <div class="fuel">
          <span class="fuel-label">${esc(c.fire.fuel_label)}</span>
          <ul>${c.fire.fuel.map((f) => `<li>${esc(f)}</li>`).join('')}</ul>
        </div>
      </div>
      <div class="fire-stats">
        ${c.fire.stats.map((s) => `<div><strong>${esc(s.value)}</strong><span>${esc(s.label)}</span></div>`).join('\n        ')}
      </div>
      <figcaption><strong>${esc(c.fire.quote_strong)}</strong> ${esc(c.fire.quote_rest)}</figcaption>
    </figure>
  </div>
</section>

<section id="about" class="section" aria-labelledby="about-h">
  <div class="wrap split">
    <div class="stack">
      <p class="label">${esc(c.about.label)}</p>
      <h2 id="about-h" class="h2">${esc(c.about.title)}</h2>
      <p class="body">${esc(c.about.body)}</p>
      <h3 class="h3-mono">${esc(c.about.side_title)}</h3>
      <ol class="side">
        ${c.about.side.map((s) => `<li>${esc(s)}</li>`).join('\n        ')}
      </ol>
    </div>
    <figure class="code">
      <div class="code-head"><span>content/${c.lang}.yml</span><a href="${editUrl}">${esc(c.about.profile_edit)}${icon.external}</a></div>
<pre><span class="c">${esc(c.about.profile_comment)}</span>
${yamlLine('element', c.about.profile.element)}
${yamlList('stack', c.about.profile.stack)}
${yamlList('focus', c.about.profile.focus)}</pre>
    </figure>
  </div>
</section>

<section id="capabilities" class="section alt" aria-labelledby="cap-h">
  <div class="wrap stack-lg">
    <div class="stack intro">
      <p class="label">${esc(c.capabilities.label)}</p>
      <h2 id="cap-h" class="h2">${esc(c.capabilities.title)}</h2>
    </div>
    <div class="cap-grid">
      ${c.capabilities.items.map((it) => `<article class="cap">
        <span class="slug">${esc(it.slug)}</span>
        <h3>${esc(it.title)}</h3>
        <p>${esc(it.body)}</p>
        <p class="tech">${esc(it.tech)}</p>
      </article>`).join('\n      ')}
    </div>
    <div class="stack products-wrap">
      <h3 class="h3-mono">${esc(c.capabilities.products_title)}</h3>
      <div class="products">
        ${c.capabilities.products.map((p) => {
          const inner = `<span class="product-top"><span class="product-name">${esc(p.name)}</span><span class="product-tag">${esc(p.tag)}</span></span>
          <span class="product-body">${esc(p.body)}</span>${p.url ? `
          <span class="product-link">${esc(p.url_label)}${icon.external}</span>` : ''}`;
          return p.url
            ? `<a class="product" href="${esc(p.url)}" rel="noopener">${inner}</a>`
            : `<div class="product">${inner}</div>`;
        }).join('\n        ')}
      </div>
    </div>
  </div>
</section>

<section id="thinking" class="section" aria-labelledby="think-h">
  <div class="wrap stack-lg">
    <div class="stack intro">
      <p class="label">${esc(c.thinking.label)}</p>
      <h2 id="think-h" class="h2">${esc(c.thinking.title)}</h2>
    </div>
    <ol class="principles">
      ${c.thinking.items.map((it) => `<li><h3>${esc(it.title)}</h3><p>${esc(it.body)}</p></li>`).join('\n      ')}
    </ol>
  </div>
</section>

<section id="contact" class="contact-section" aria-labelledby="contact-h">
  <div class="wrap contact">
    <p class="label">${esc(c.contact.label)}</p>
    <h2 id="contact-h">${esc(c.contact.title)}</h2>
    <p class="lead">${esc(c.contact.body)}</p>
    <div class="actions">
      <a class="btn btn-primary" href="mailto:${esc(site.email)}">${icon.mail}${esc(site.email)}</a>
      <a class="btn" href="${esc(site.github)}" rel="me noopener">GitHub${icon.external}</a>
      <a class="btn" href="${esc(site.company_url)}" rel="noopener">redsun.vn${icon.external}</a>
    </div>
    <p class="signoff">${esc(c.contact.signoff)}</p>
  </div>
</section>

</main>

<footer class="site-footer">
  <div class="wrap">
    <span>© ${new Date().getFullYear()} ${esc(c.hero.name)} · ${esc(c.footer.note)}</span>
    <a href="${editUrl}">${esc(c.footer.edit)}${icon.external}</a>
  </div>
</footer>

<script>
(function () {
  var b = document.querySelector('.menu-btn'), m = document.getElementById('mobile-menu');
  if (!b || !m) return;
  function set(open) { b.setAttribute('aria-expanded', String(open)); m.hidden = !open; }
  b.addEventListener('click', function () { set(b.getAttribute('aria-expanded') !== 'true'); });
  m.addEventListener('click', function (e) { if (e.target.closest('a')) set(false); });
})();
</script>
</body>
</html>
`;
}

export function render404({ vi, en, cssHref }) {
  return `<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>404 — vuducnam.dev</title>
<meta name="robots" content="noindex">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;700;800&family=JetBrains+Mono:wght@400;700&display=swap">
<link rel="stylesheet" href="${cssHref}">
</head>
<body>
<main class="wrap notfound">
  <p class="prompt"><span class="cmd"><span class="host">nam@redsun</span>:~$ cd ???</span><span>404 — không có trang này / page not found<span class="cursor" aria-hidden="true"></span></span></p>
  <div class="actions">
    <a class="btn btn-primary" href="${vi.path}">Về trang chủ</a>
    <a class="btn" href="${en.path}">Back to home</a>
  </div>
</main>
</body>
</html>
`;
}
