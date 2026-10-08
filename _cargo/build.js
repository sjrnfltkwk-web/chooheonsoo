// Rebuilds the Cargo site as static pages: _cargo/<page>.json + site.css -> ../<page>.html, ../media/<hash>.webp
// Run: node _cargo/build.js   (downloads missing media once)
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const PAGES = ['main', 'project', 'about', 'see-unseen', 'moment', 'la_sylfid', 'seoul', 'paperman', 'the-perfect-routine',
  'remains', 'green', 'zombie-wants-to-be', 'search-1', '0-1-dgree', 'problem', 'brain'];
// Vimeo subscription lapsed: its embeds are replaced by YouTube ids or self-hosted loops.
const VIDEO = {
  '1152781603': 'yt:79VEybXXYPc', '1113059706': 'yt:-LkwQWKkje0', '1113059399': 'yt:3dCncQZ2AFQ', '1113058525': 'yt:BkwdueseDlw',
  '1123541604': 'yt:ONVxyIfB2CM', '1113057759': 'yt:qoDitlJvJJ4',
  '1125583697': 'video/hallucigenia.mp4', '1125584446': 'video/anomalocaris.mp4', '1125584753': 'video/dickinsonia.mp4',
};
// Corrections applied on top of the Cargo content (source JSON stays untouched): [page, from, to]
const FIXES = [
  ['about', '하고있다', '하고 있다'],
  ['about', '환기하고자 합니다.', '환기하고자 한다.'],
  ['about', 'they serve', 'They serve'],
  ['about', 'Exhabition', 'Exhibition'],
  ['see-unseen', /Gwanghwa\s*,\s*Sejong\s*, Korea/, 'Gwanghwa, Sejong, Korea'],
  ['see-unseen', '생동감있는', '생동감 있는'],
  ['la_sylfid', 'Paradais city ,', 'Paradise City,'],
  ['la_sylfid', '’실피드‘', '‘실피드’'],
  ['seoul', 'artechnolozy', 'artechnology'],
  ['the-perfect-routine', 'Midjourney(AI Generated)', 'Midjourney (AI Generated)'],
  ['the-perfect-routine', '1920x1080 (px), 02’59”', '1920 x 1080 (px), 02’ 59”'],
  ['the-perfect-routine', '시도다.<br />\n\n.<br />', '시도다.<br />'],
  ['the-perfect-routine', /\sㅅ<br \/>/, '<br />'],
  ['search-1', /\sㅅ<br \/>/, '<br />'],
  ['remains', '여정/ What remains', '여정 / What remains'],
  ['search-1', '검색/ Search', '검색 / Search'],
  ['0-1-dgree', '1080x1920', '1080 x 1920'],
  ['brain', 'Never Die', 'Never Dies'],
  // confirmed by the artist: the artist's name is Yoon-Jeong Han, momentum was 2024
  ['see-unseen', 'Yoon Chung Han', 'Yoon-Jeong Han'],
  ['la_sylfid', 'Yoon Chung Han', 'Yoon-Jeong Han'],
  ['moment', '(2023)은', '(2024)은'],
  ['about', /2023\s*–\s*sense collective\. sense collection: momentum\. 2025\. Platform-L, Seoul/, '2024 – sense collective. sense collection: momentum. Platform-L, Seoul'],
];
// One menu for every page that has one: same size, order and alignment, never wraps.
const NAV = (color, lead = '') => `<div style="text-align: center"><h1 class="nav" style="--font-scale: 0.53;">${lead}${
  [['main', 'Artwork'], ['project', 'Project'], ['about', 'About']].map(([h, t]) =>
    `<a href="${h}" rel="history"${color ? ` style="color: ${color};"` : ''}>${t}</a>`).join('&nbsp; &nbsp; &nbsp;')}</h1></div>`;
const NAV_AT = {
  // main keeps Cargo's empty first line above the menu
  main: [/<div style="text-align: center"><h1 style="--font-scale: 0\.53;">[\s\S]*?<\/h1><\/div>/, NAV('', '<a class="no-wrap" href="main" rel="history"><br /></a>')],
  // project's back arrow above the menu is dropped (the menu already links home) so the menu sits where it does on main
  project: [/^[\s\S]*?<h1>[\s\S]*?<\/h1>/, NAV('rgba(255, 255, 255, 0.85)', '<a class="no-wrap" href="main" rel="history"><br /></a>') + '<br />\n<br />\n<br />'],
};
const fix = (p, html) => {
  for (const [page, from, to] of FIXES) if (page === p) {
    const hit = from instanceof RegExp ? from.test(html) : html.includes(from);
    if (!hit) throw new Error(`fix not found in ${p}: ${from}`);
    html = from instanceof RegExp ? html.replace(from, to) : html.split(from).join(to);
  }
  if (NAV_AT[p]) { if (!NAV_AT[p][0].test(html)) throw new Error(`nav not found in ${p}`); html = html.replace(...NAV_AT[p]); }
  return html;
};
const ICON = { 'leftwards-arrow': '←', 'upwards-arrow': '↑', 'rightwards-arrow': '→', 'downwards-arrow': '↓' };
const attrs = tag => Object.fromEntries([...tag.matchAll(/([\w-]+)(?:="([^"]*)")?/g)].slice(1).map(m => [m[1], m[2] ?? '']));
const downloads = new Map();

const media = (tag, byHash, inner = '') => {
  const a = attrs(tag), m = byHash[a.hash];
  if (!m) return '';
  if (m.is_url) {
    const id = (m.url.match(/(\d{6,})/) || [])[1], v = VIDEO[id];
    if (!v) return '';
    return v.startsWith('yt:')
      ? `<span class="mi video"><iframe src="https://www.youtube-nocookie.com/embed/${v.slice(3)}?rel=0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen loading="lazy" title="video"></iframe></span>`
      : `<span class="mi video vertical"><video src="${v}" autoplay muted loop playsinline controls></video></span>`;
  }
  const file = `media/${m.hash}.webp`;
  downloads.set(file, `https://freight.cargo.site/w/${Math.min(m.width, 2400)}/q/88/f/webp/i/${m.hash}/${encodeURIComponent(m.name)}`);
  const style = [a.scale && a.scale !== '100' ? `width:${/%|rem/.test(a.scale) ? a.scale : a.scale + '%'}` : '', a['media-style'] || ''].filter(Boolean).join(';');
  const zoom = /zoomable/.test(a.class || '') && a['disable-zoom'] !== 'true';
  const img = `<img src="${file}" width="${m.width}" height="${m.height}" alt="" loading="lazy" decoding="async"${zoom ? ' data-zoom' : ''}>`;
  const pic = a.href ? `<a href="${a.href}">${img}</a>` : img;
  const free = ['freeform-x', 'freeform-y', 'freeform-scale', 'freeform-z'].filter(k => a[k]).map(k => ` data-${k}="${a[k]}"`).join('');
  return `<span class="mi" data-w="${m.width}" data-h="${m.height}"${a['justify-row-end'] === 'true' ? ' data-end' : ''}${free}${style ? ` style="${style}"` : ''}>${pic}${inner}</span>`;
};

const convert = (html, byHash) => html
  .replace(/(<media-item\b[^>]*>)([\s\S]*?)<\/media-item>/g, (_, t, inner) => media(t, byHash, inner.trim()))
  .replace(/<text-icon icon="([\w-]+)"><\/text-icon>/g, (_, i) => `<span class="ti">${ICON[i] || ''}</span>`);

// Cargo scales mobile paddings by --mobile-padding-offset (1.32); horizontal page padding only.
const mobileCss = css => css.replace(/([^{}]+)\{([^}]*)\}/g, (_, sel, body) => {
  const pads = [...body.matchAll(/padding(-left|-right)?:\s*([\d.]+)rem/g)].map(([, side, v]) =>
    side ? `padding${side}: ${(v * 1.32).toFixed(2)}rem` : `padding-left: ${(v * 1.32).toFixed(2)}rem; padding-right: ${(v * 1.32).toFixed(2)}rem`);
  return pads.length && /page-content/.test(sel) ? `.mobile ${sel.trim()} { ${pads.join('; ')} }\n` : '';
});

const site = fs.readFileSync(path.join(__dirname, 'site.css'), 'utf8').replace(/"Diatype Variable"/g, '"Pretendard Variable", Pretendard, sans-serif')
  // Cargo drives every text style through --font-size so an inline --font-scale multiplies it
  .replace(/font-size:\s*([\d.]+rem);/g, '--font-size: $1; font-size: calc(var(--font-scale, 1) * var(--font-size));');
fs.writeFileSync(path.join(ROOT, 'site.css'), site);
// cache-busting: GitHub Pages caches assets ~10 min, so a new page could pair with a stale stylesheet
const ver = require('crypto').createHash('sha1')
  .update(['cargo.css', 'cargo.js', 'site.css'].map(f => fs.readFileSync(path.join(ROOT, f))).join('')).digest('hex').slice(0, 8);

for (const p of PAGES) {
  const d = JSON.parse(fs.readFileSync(path.join(__dirname, p + '.json'), 'utf8'));
  const byHash = Object.fromEntries(d.media.map(m => [m.hash, m]));
  const bd = d.backdrops || {}, grad = bd.activeBackdrop === 'gradient' && bd.backdropSettings?.gradient?.['color-one'];
  const title = p === 'main' ? 'chooheonsoo' : `${d.title} — chooheonsoo`;
  // Cargo's "morphovision" backdrop: full-screen page images cycling behind the content (brain page; its text is white)
  let backdrop = '';
  const mv = bd.activeBackdrop === 'legacy/morphovision' && bd.backdropSettings['legacy/morphovision'];
  if (mv) {
    // Cargo cycles the page's images minus `excluded` (the configured start image is itself excluded here)
    let pool = d.media.filter(m => m.is_image && !mv.excluded.includes(m.hash)).map(m => m.hash);
    if (!pool.length) pool = [mv.image];
    backdrop = `<div class="backdrop" data-time="${mv.transition_time || 10}">${pool.map((h, i) => {
      const m = byHash[h]; const file = `media/${h}.webp`;
      downloads.set(file, `https://freight.cargo.site/w/${Math.min(m.width, 2400)}/q/88/f/webp/i/${h}/${encodeURIComponent(m.name)}`);
      return `<img src="${file}" alt=""${i ? ' loading="lazy"' : ' class="on"'}>`;
    }).join('')}</div>\n`;
  }
  const out = `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<link rel="icon" href="favicon.ico">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css">
<link rel="stylesheet" href="cargo.css?v=${ver}">
<link rel="stylesheet" href="site.css?v=${ver}">
<style>
${d.local_css || ''}
${mobileCss(d.local_css || '')}${grad ? `body { background-color: ${grad}; }` : ''}
</style>
<script src="cargo.js?v=${ver}" defer></script>
</head>
<body class="${p === 'main' ? 'home' : ''}">
${backdrop}<div class="content">
<div class="page" id="${d.id}"><div class="page-layout"><div class="page-content"><bodycopy>
${convert(fix(p, d.content), byHash)}
</bodycopy></div></div></div>
</div>
</body>
</html>
`;
  fs.writeFileSync(path.join(ROOT, p + '.html'), out);
  if (p === 'main') fs.writeFileSync(path.join(ROOT, 'index.html'), out);
}

(async () => {
  let n = 0;
  for (const [file, url] of downloads) {
    const out = path.join(ROOT, file);
    if (fs.existsSync(out)) continue;
    fs.mkdirSync(path.dirname(out), { recursive: true });
    const r = await fetch(url); if (!r.ok) { console.log('FAIL', r.status, url); continue; }
    fs.writeFileSync(out, Buffer.from(await r.arrayBuffer())); n++;
  }
  console.log('pages', PAGES.length, 'media', downloads.size, 'downloaded', n);
})();
