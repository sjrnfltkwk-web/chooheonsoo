// Stand-in for the Cargo 3 components this site uses: mobile mode, column-set spans, gallery-justify, image zoom.
const root = document.documentElement;
const rem = () => parseFloat(getComputedStyle(root).fontSize);
// Cargo attribute lengths: "1.9rem", "19.3%" (of width) or a bare number (rem)
const len = (v, w) => !v ? null : v.endsWith('%') ? parseFloat(v) / 100 * w : parseFloat(v) * (v.endsWith('px') ? 1 : rem());

// Cargo's base unit (from its frontend): min(w, h) * weight / 100, weight grows 9 -> 14 as the window turns portrait.
function mobile() {
  const w = root.clientWidth, h = innerHeight, m = w <= 768 && w < h;
  const l = Math.min(1, Math.max(0, h / w - 1) / .777777778);
  const base = Math.max(20, Math.min(w, h) * (9 + 5 * l) / 100) * .16;
  root.style.setProperty('--base-size', base + 'px');
  root.classList.toggle('mobile', m); document.body.classList.toggle('mobile', m);
}

function columns() {
  document.querySelectorAll('column-set').forEach(set => {
    const m = root.classList.contains('mobile');
    set.style.setProperty('--gutter', (len(m && set.getAttribute('mobile-gutter') || set.getAttribute('gutter') || '1rem', 0)) + 'px');
    const units = [...set.children].filter(u => u.tagName === 'COLUMN-UNIT');
    if (units.some(u => u.hasAttribute('span'))) {
      set.style.gridTemplateColumns = 'repeat(12, minmax(0, 1fr))';
      units.forEach(u => u.style.gridColumn = `span ${u.getAttribute('span') || Math.floor(12 / units.length)}`);
    }
  });
}

// Justified rows: fill each row to the container width at roughly the target row height; justify-row-end forces a break.
function justify() {
  document.querySelectorAll('gallery-justify').forEach(g => {
    g.querySelectorAll('.br').forEach(b => b.remove());
    const m = root.classList.contains('mobile'), W = g.clientWidth;
    const gap = len((m && g.getAttribute('mobile-gutter')?.split(' ')[0]) || g.getAttribute('gutter') || '1rem', W);
    const target = len((m && g.getAttribute('mobile-row-height')) || g.getAttribute('row-height') || '25%', W);
    const items = [...g.querySelectorAll(':scope > .mi')];
    let row = [];
    const place = (fill) => {
      const sum = row.reduce((s, i) => s + i.r, 0), free = W - gap * (row.length - 1);
      const h = fill ? free / sum : Math.min(target, free / sum);
      row.forEach((it, k) => Object.assign(it.el.style, { width: Math.floor(it.r * h * 100) / 100 - .05 + 'px', marginRight: k < row.length - 1 ? gap + 'px' : '0', marginBottom: gap + 'px' }));
      const br = document.createElement('span'); br.className = 'br'; row.at(-1).el.after(br);
      row = [];
    };
    items.forEach(el => {
      row.push({ el, r: el.dataset.w / el.dataset.h });
      const width = row.reduce((s, i) => s + i.r, 0) * target + gap * (row.length - 1);
      if (width >= W || el.hasAttribute('data-end')) place(true);
    });
    if (row.length) place(false);
  });
}

// gallery-columnized: items dealt left-to-right into the shortest column (masonry). gallery-grid: plain N-column grid.
function columnized() {
  const m = root.classList.contains('mobile');
  document.querySelectorAll('gallery-columnized, gallery-grid').forEach(g => {
    const n = +((m && g.getAttribute('mobile-columns')) || g.getAttribute('columns') || (m ? 2 : 3));
    const gap = len((m && g.getAttribute('mobile-gutter')) || g.getAttribute('gutter') || '1rem', g.clientWidth) + 'px';
    const items = g._items ||= [...g.querySelectorAll('.mi')];
    if (g.tagName === 'GALLERY-GRID') {
      Object.assign(g.style, { display: 'grid', gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))`, gap });
      return;
    }
    g.replaceChildren();
    const cols = Array.from({ length: n }, () => { const c = document.createElement('div'); c.className = 'col'; c.style.rowGap = gap; g.append(c); return c; });
    const hts = cols.map(() => 0);
    items.forEach(el => { const k = hts.indexOf(Math.min(...hts)); cols[k].append(el); hts[k] += el.dataset.h / el.dataset.w; });
    g.style.columnGap = gap;
  });
}

// gallery-freeform: each item placed by freeform-x/y (% of width) and freeform-scale (% width).
function freeform() {
  document.querySelectorAll('gallery-freeform').forEach(g => {
    const W = g.clientWidth; let H = 0;
    g.querySelectorAll('.mi').forEach(el => {
      const d = el.dataset, w = (+d.freeformScale || 30) / 100 * W, top = (+d.freeformY || 0) / 100 * W;
      Object.assign(el.style, { position: 'absolute', left: (+d.freeformX || 0) + '%', top: top + 'px', width: w + 'px', zIndex: d.freeformZ || 0 });
      H = Math.max(H, top + w * d.h / d.w);
    });
    g.style.height = H + 'px';
  });
}

function layout() { mobile(); columns(); justify(); columnized(); freeform(); }

// gallery-slideshow: one image at a time, click to advance
document.querySelectorAll('gallery-slideshow').forEach(g => {
  const items = [...g.querySelectorAll('.mi')]; let i = 0;
  const show = () => items.forEach((el, k) => el.hidden = k !== i);
  g.addEventListener('click', () => { i = (i + 1) % items.length; show(); });
  show();
});
// digital-clock
document.querySelectorAll('digital-clock').forEach(c => {
  const tick = () => c.textContent = new Date().toLocaleTimeString('en-GB');
  tick(); setInterval(tick, 1000);
});
layout();
addEventListener('resize', layout);

document.addEventListener('click', e => {
  const img = e.target.closest('img[data-zoom]');
  if (!img || img.closest('a')) return;
  const z = document.createElement('div'); z.className = 'zoom';
  z.innerHTML = `<img src="${img.src}" alt="">`;
  z.onclick = () => z.remove();
  document.body.append(z);
});
