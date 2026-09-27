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

const pages = {
  list(key) {
    const list = sections[key];
    const track = list.map((w, i) => `<a href="${url(w)}" style="--h:${HEIGHTS[i % HEIGHTS.length]}%">${pic(w.cover, w.title, true)}</a>`).join('');
    $('.drift').innerHTML = `<div class="track">${track}</div><div class="track" aria-hidden="true">${track}</div>`;
    addEventListener('load', () => { const t = $('.drift .track'); document.querySelectorAll('.drift .track').forEach(x => x.style.setProperty('--t', t.scrollWidth / 40 + 's')); });
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
  artwork() { this.list('artwork'); },
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
