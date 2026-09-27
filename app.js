// Renders pages from WORKS (works.js). Page type comes from <body data-page>.
const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const year = w => (w.info.join(' ').match(/20\d\d/) || [''])[0];
const url = w => `work.html?w=${w.slug}`;
const pic = (im, alt, eager) => `<img src="${im.src}" width="${im.w}" height="${im.h}" alt="${esc(alt)}" ${eager ? '' : 'loading="lazy"'} decoding="async">`;
// videos entry: "video/x.mp4" (self-hosted) | 11-char YouTube id | Vimeo id
const video = (v, title) => /\.mp4$/.test(v)
  ? `<video src="${v}" autoplay muted loop playsinline controls></video>`
  : `<iframe src="${/^[\w-]{11}$/.test(v) ? `https://www.youtube-nocookie.com/embed/${v}?rel=0` : `https://player.vimeo.com/video/${v}${v.includes('?') ? '&' : '?'}dnt=1`}" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen loading="lazy" title="${esc(title)}"></iframe>`;
// Gallery rows cycle through these so a page has rhythm instead of a uniform grid.
// n = images per row, w = row width %, at = where a narrower row sits. Panoramas (> 2.4:1) always get their own full row.
const ROWS = [{ n: 1, w: 100 }, { n: 2, w: 100 }, { n: 1, w: 44, at: 'end' }, { n: 3, w: 100 }, { n: 1, w: 66, at: 'start' }, { n: 2, w: 72, at: 'center' }];
const ratio = im => im.w / im.h;
const gallery = (imgs, title) => {
  const q = imgs.map((im, k) => ({ im, k })), rows = [];
  let r = 0, pano = 0;
  while (q.length) {
    const wide = ratio(q[0].im) > 2.4, spec = wide ? { n: 1, w: 100, bleed: pano++ % 2 } : ROWS[r++ % ROWS.length], take = [];
    while (take.length < spec.n && q.length && !(take.length && ratio(q[0].im) > 2.4)) take.push(q.shift());
    let w = spec.w;
    if (take.length === 1 && ratio(take[0].im) < 1.3) w = Math.min(w, ratio(take[0].im) < 1 ? 40 : 60); // lone portrait/square would be enormous at full width
    const cls = [spec.bleed ? 'bleed' : '', w < 100 ? 'loose' : '', spec.at || ''].join(' ');
    rows.push(`<div class="row ${cls}" style="--w:${w}%">${take.map(({ im, k }) =>
      `<button data-k="${k}" style="flex:${ratio(im)} 1 0" aria-label="확대">${pic(im, `${title} ${k + 1}`)}</button>`).join('')}</div>`);
  }
  return rows.join('');
};
const artwork = WORKS.filter(w => w.section === 'artwork');
const project = WORKS.filter(w => w.section === 'project');

const pages = {
  artwork() {
    $('.wall').innerHTML = artwork.map((w, i) => `
      <a class="spec" href="${url(w)}"><figure>${pic(w.cover, w.info[0], i < 3)}
        <figcaption><span>${esc(w.info[0])}</span><span class="mute">${year(w)}</span></figcaption></figure></a>`).join('');
  },

  project() {
    $('.list').innerHTML = project.map((w, i) => `
      <a class="pano" href="${url(w)}"><figure><div class="strip">${pic(w.cover, w.info[0], i < 2)}</div>
        <figcaption><span>${esc(w.info[0])}</span><span class="mute">${esc(w.info[1] || '')}</span></figcaption></figure></a>`).join('');
  },

  work() {
    const w = WORKS.find(x => x.slug === new URLSearchParams(location.search).get('w'));
    if (!w) { $('main').innerHTML = '<p class="work">작품을 찾을 수 없어요. <a href="./">Artwork로 돌아가기</a></p>'; return; }
    document.title = `${w.info[0]} | Heon Soo Choo`;
    document.querySelector(`.top nav a[href="${w.section === 'project' ? 'project.html' : './'}"]`)?.setAttribute('aria-current', 'page');
    const wide = w.cover.w > w.cover.h;
    const list = w.section === 'project' ? project : artwork, i = list.indexOf(w);
    const prev = list[(i - 1 + list.length) % list.length], next = list[(i + 1) % list.length];
    const p = a => a.map(t => `<p>${esc(t)}</p>`).join('');
    $('main').innerHTML = `
      <article class="work ${wide ? 'wide' : ''}">
        <figure class="cover">${pic(w.cover, w.info[0], true)}</figure>
        <header><h1 style="font:inherit">${esc(w.info[0])}</h1><p class="info">${w.info.slice(1).map(esc).join('<br>')}</p></header>
        ${w.videos.length ? `<div class="videos ${w.videos.length === 3 ? 'v3' : ''}">${w.videos.map(v => video(v, w.info[0])).join('')}</div>` : ''}
        <div class="text ${w.en.length ? '' : 'single'}"><div>${p(w.ko)}</div>${w.en.length ? `<div lang="en">${p(w.en)}</div>` : ''}</div>
        <section class="gallery">${gallery(w.images, w.info[0])}</section>
        <nav class="pager"><a href="${url(prev)}">← ${esc(prev.info[0])}</a><a href="${url(next)}">${esc(next.info[0])} →</a></nav>
      </article>
      <dialog><img alt=""></dialog>`;
    const dlg = $('dialog'), big = dlg.querySelector('img');
    $('.gallery').addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      big.src = w.images[b.dataset.k].src; big.alt = b.querySelector('img').alt;
      dlg.showModal();
    });
    dlg.addEventListener('click', () => dlg.close());
  },
};
pages[document.body.dataset.page]?.();
