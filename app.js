// Renders pages from WORKS (works.js). Page type comes from <body data-page>.
const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const url = w => `work.html?w=${w.slug}`;
// Wall-label caption: one size, titles in ink, facts in grey, one fact per line.
const label = (w, tag = 'p', link) => { const t = esc(w.title) + (w.en_title ? '<br>' + esc(w.en_title) : '');
  return `<${tag} class="label"><span class="t">${link ? `<a href="${link}">${t}</a>` : t}</span><br>${[w.year, ...w.meta].map(esc).join('<br>')}</${tag}>`; };
const ratio = im => im.w / im.h;
const pic = (im, alt, eager) => `<img src="${im.src}" width="${im.w}" height="${im.h}" alt="${esc(alt)}" ${eager ? '' : 'loading="lazy"'} decoding="async">`;
// videos entry: "video/x.mp4" (self-hosted, loops silently) | 11-char YouTube id | Vimeo id
const video = (v, title) => /\.mp4$/.test(v)
  ? `<video src="${v}" autoplay muted loop playsinline controls></video>`
  : `<iframe src="${/^[\w-]{11}$/.test(v) ? `https://www.youtube-nocookie.com/embed/${v}?rel=0` : `https://player.vimeo.com/video/${v}${v.includes('?') ? '&' : '?'}dnt=1`}" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen loading="lazy" title="${esc(title)}"></iframe>`;
const sections = { artwork: WORKS.filter(w => w.section === 'artwork'), project: WORKS.filter(w => w.section === 'project') };

// Justified rows (equal height per row), like Cargo's gallery-justify. Panoramas get a row to themselves.
const TARGET = 3.2; // summed aspect ratio that fills one row of the 8-col media column
const justify = (imgs, title) => {
  const rows = []; let row = [];
  const flush = () => { if (!row.length) return; const sum = row.reduce((s, x) => s + ratio(x.im), 0);
    rows.push(`<div class="jrow" style="width:${Math.min(100, sum / TARGET * 100)}%">${row.map(({ im, k }) =>
      `<button data-k="${k}" style="flex:${ratio(im)} 1 0" aria-label="확대">${pic(im, `${title} ${k + 1}`)}</button>`).join('')}</div>`); row = []; };
  imgs.forEach((im, k) => {
    if (ratio(im) > 2.4) { flush(); row = [{ im, k }]; flush(); return; }
    row.push({ im, k });
    if (row.reduce((s, x) => s + ratio(x.im), 0) >= TARGET) flush();
  });
  flush();
  return rows.join('');
};

const HEIGHTS = [100, 76, 90, 62, 84, 70]; // % of the drift band, cycled so the wall has a skyline

// Screen corners in img/intro/tv.jpg, as % of the image (tl, tr, br, bl), detected from the lit screens.
// Each screen shows one artwork: its stills channel-hop, or a looping clip if `clip` is set.
const SCREENS = [
  { q: [[46, 20.06], [52, 20.65], [52, 28.91], [45.83, 28.61]], w: 'brain' },
  { q: [[56, 32.15], [61.67, 33.92], [61.17, 41.59], [55.5, 40.12]], w: 'search-1' },
  { q: [[40, 34.22], [47, 33.92], [47.17, 43.07], [39.83, 42.77]], w: 'remains' },
  { q: [[32.67, 47.79], [37.17, 48.08], [37, 55.16], [32.5, 54.87]], w: 'problem' },
  { q: [[45.67, 48.08], [55, 48.08], [54.83, 59.29], [45.5, 59]], w: 'the-perfect-routine' },
  { q: [[60.67, 48.38], [65.5, 47.79], [65.83, 55.16], [60.67, 55.46]], w: 'paperman' },
  { q: [[26.67, 61.36], [34.33, 61.65], [34.33, 71.98], [26.67, 71.68]], w: 'green' },
  { q: [[64.67, 61.65], [71.5, 61.06], [71.5, 71.09], [64.83, 71.68]], w: 'zombie-wants-to-be' },
  { q: [[40.33, 65.19], [46.83, 64.9], [46.83, 73.75], [40.33, 74.04]], w: '0-1-dgree', clip: 'video/hallucigenia.mp4' },
  { q: [[52.5, 67.55], [58.17, 67.85], [58.17, 75.52], [52.33, 75.52]], w: 'search-1', from: 5 },
];
const thumb = src => src.replace(/\/(\d+\.webp)$/, '/t/$1');
const tvwall = () => {
  const html = SCREENS.map(({ q, w: slug, clip, from = 0 }) => {
    const w = WORKS.find(x => x.slug === slug);
    const xs = q.map(p => p[0]), ys = q.map(p => p[1]);
    const L = Math.min(...xs), T = Math.min(...ys), W = Math.max(...xs) - L, H = Math.max(...ys) - T;
    const poly = q.map(([x, y]) => `${((x - L) / W * 100).toFixed(1)}% ${((y - T) / H * 100).toFixed(1)}%`).join(',');
    const inner = clip ? `<video src="${clip}" autoplay muted loop playsinline></video>`
      : `<img src="${thumb(w.images[from % w.images.length].src)}" alt="" data-i="${from}">`;
    return `<a class="screen" href="${url(w)}" title="${esc(w.title)}" data-slug="${slug}"
      style="left:${L}%;top:${T}%;width:${W}%;height:${H}%;clip-path:polygon(${poly})">${inner}</a>`;
  }).join('');
  $('.tvwall').innerHTML = `<div class="stage"><img class="room" src="img/intro/tv.jpg" alt="어두운 방에 쌓인 브라운관 TV들">${html}</div>`;
  // channel-hop: each still screen cuts to its work's next frame on its own rhythm
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  document.querySelectorAll('.screen img').forEach(img => {
    const w = WORKS.find(x => x.slug === img.closest('.screen').dataset.slug);
    const hop = () => {
      const i = (+img.dataset.i + 1) % w.images.length;
      img.dataset.i = i; img.src = thumb(w.images[i].src);
      img.parentElement.classList.remove('flick'); void img.offsetWidth; img.parentElement.classList.add('flick');
      setTimeout(hop, 2200 + Math.random() * 3000);
    };
    setTimeout(hop, 800 + Math.random() * 3000);
  });
};

const pages = {
  list(key) {
    const list = sections[key];
    const track = list.map((w, i) => `<a href="${url(w)}" style="--h:${HEIGHTS[i % HEIGHTS.length]}%">${pic(w.cover, w.title, true)}</a>`).join('');
    if ($('.drift')) $('.drift').innerHTML = `<div class="track">${track}</div><div class="track" aria-hidden="true">${track}</div>`;
    addEventListener('load', () => { const t = $('.drift .track'); if (!t) return; document.querySelectorAll('.drift .track').forEach(x => x.style.setProperty('--t', t.scrollWidth / 40 + 's')); });
    $('.sheet').innerHTML = `
      <div class="grid head"><div class="l4 rule"></div><div class="r8 rule"><h1 class="label"><span class="t">${key === 'artwork' ? 'Artwork' : 'Project'}</span></h1></div></div>
      ${list.map((w, i) => `
      <article class="grid item ${ratio(w.cover) > 1.5 ? 'wide' : ''}">
        <div class="l4 rule"><a class="thumb" href="${url(w)}">${pic(w.cover, w.title)}</a></div>
        <div class="r8 rule">
          ${label(w, 'h2', url(w))}
        </div>
      </article>`).join('')}`;
  },
  artwork() { tvwall(); this.list('artwork'); },
  project() { this.list('project'); },

  work() {
    const w = WORKS.find(x => x.slug === new URLSearchParams(location.search).get('w'));
    if (!w) { $('main').innerHTML = '<p class="sheet work">작품을 찾을 수 없어요. <a href="./">Artwork</a></p>'; return; }
    document.title = `${w.title} | Heon Soo Choo`;
    const home = w.section === 'project' ? 'project.html' : './';
    document.querySelector(`.top nav a[href="${home}"]`)?.setAttribute('aria-current', 'page');
    const list = sections[w.section], i = list.indexOf(w), next = list[(i + 1) % list.length];
    const p = a => a.map(t => `<p>${esc(t)}</p>`).join('');
    const vids = w.videos.map(v => video(v, w.title)).join('');
    $('main').innerHTML = `
      <article class="sheet work">
        <div class="grid">
          <div class="l4 rule">
            ${label(w, 'h1')}
          </div>
          <div class="r8 rule media">
            ${w.videos.length === 3 ? `<div class="v3">${vids}</div>` : vids}
            ${justify(w.images, w.title)}
          </div>
        </div>
        ${w.ko.length ? `<div class="grid text"><div class="l4 rule"></div>
          <div class="r8 rule cols"><div>${p(w.ko)}</div>${w.en.length ? `<div lang="en">${p(w.en)}</div>` : ''}</div></div>` : ''}
        <div class="grid foot"><div class="l4 rule"><a class="label" href="${home}">Return to list</a></div>
          <div class="r8 rule"><a class="label" href="${url(next)}"><span class="t">Next</span><br>${esc(next.title)}</a></div></div>
      </article>
      <dialog><img alt=""></dialog>`;
    const dlg = $('dialog'), big = dlg.querySelector('img');
    $('.media').addEventListener('click', e => {
      const b = e.target.closest('button[data-k]'); if (!b) return;
      big.src = w.images[b.dataset.k].src; big.alt = b.querySelector('img').alt;
      dlg.showModal();
    });
    dlg.addEventListener('click', () => dlg.close());
  },
};
pages[document.body.dataset.page]?.();
