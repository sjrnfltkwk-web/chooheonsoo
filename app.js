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
const artwork = WORKS.filter(w => w.section === 'artwork');
const project = WORKS.filter(w => w.section === 'project');

// ghost word behind the page, set by hovering a work
const ghost = Object.assign(document.createElement('div'), { className: 'ghost', ariaHidden: true });
document.body.append(ghost);
document.addEventListener('pointerover', e => {
  const a = e.target.closest('[data-ghost]');
  ghost.classList.toggle('on', !!a);
  if (a) ghost.textContent = a.dataset.ghost;
});

const pages = {
  artwork() {
    const mq = matchMedia('(max-width: 760px)');
    const draw = () => {
      const n = mq.matches ? 2 : 3, cols = Array.from({ length: n }, () => []);
      artwork.forEach((w, i) => cols[i % n].push(`
        <a class="spec rise" style="--i:${i}" href="${url(w)}" data-ghost="${esc(w.tag)}">
          <figure>${pic(w.cover, w.info[0], i < 3)}</figure>
          <div class="label"><span class="mono tag">-${esc(w.tag)}-</span><span class="t">${esc(w.info[0])}</span><span class="mono y">${year(w)}</span></div>
        </a>`));
      $('.wall').innerHTML = cols.map(c => `<div class="col">${c.join('')}</div>`).join('');
    };
    mq.addEventListener('change', draw);
    draw();
  },

  project() {
    $('.list').innerHTML = project.map((w, i) => `
      <a class="pano rise ${w.cover.w / w.cover.h > 3 ? 'wide' : ''}" style="--i:${i}" href="${url(w)}" data-ghost="${esc(w.title)}">
        <div class="strip">${pic(w.cover, w.info[0], i < 2)}</div>
        <div class="cap"><h2>${esc(w.info[0])}</h2><p>${w.info.slice(1, 3).map(esc).join('<br>')}</p></div>
      </a>`).join('');
  },

  work() {
    const w = WORKS.find(x => x.slug === new URLSearchParams(location.search).get('w'));
    if (!w) { $('main').innerHTML = '<p class="intro">작품을 찾을 수 없어요. <a class="tag" href="./">Artwork로 돌아가기</a></p>'; return; }
    document.title = `${w.info[0]} | Heon Soo Choo`;
    document.querySelector(`.top nav a[href="${w.section === 'project' ? 'project.html' : './'}"]`)?.setAttribute('aria-current', 'page');
    const wide = w.cover.w > w.cover.h;
    const list = w.section === 'project' ? project : artwork, i = list.indexOf(w);
    const prev = list[(i - 1 + list.length) % list.length], next = list[(i + 1) % list.length];
    const p = a => a.map(t => `<p>${esc(t)}</p>`).join('');
    $('main').innerHTML = `
      <article class="work ${wide ? 'wide' : ''}">
        <figure class="cover">${pic(w.cover, w.info[0], true)}</figure>
        <div>
          ${w.tag ? `<p class="big">-${esc(w.tag)}-</p>` : ''}
          <h1>${esc(w.info[0])}</h1>
          <p class="info">${w.info.slice(1).map(esc).join('<br>')}</p>
          ${w.videos.length ? `<div class="videos ${w.videos.length === 3 ? 'v3' : ''}">${w.videos.map(v => video(v, w.info[0])).join('')}</div>` : ''}
          <div class="text ${w.en.length ? '' : 'single'}"><div class="ko">${p(w.ko)}</div>${w.en.length ? `<div class="en" lang="en">${p(w.en)}</div>` : ''}</div>
        </div>
      </article>
      <section class="gallery">${w.images.map((im, k) => `<button data-k="${k}" aria-label="확대">${pic(im, `${w.info[0]} ${k + 1}`)}</button>`).join('')}</section>
      <nav class="pager">
        <a href="${url(prev)}" data-ghost="${esc(prev.tag || prev.title)}"><span class="mono tag">← prev</span>${esc(prev.info[0])}</a>
        <a href="${url(next)}" data-ghost="${esc(next.tag || next.title)}" style="text-align:right"><span class="mono tag">next →</span>${esc(next.info[0])}</a>
      </nav>
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
