/**
 * home-interfaces.js — Interactive interface concepts on the homepage:
 * the living-archive cycle, LandBook dashboard, land layers explorer,
 * estate record and the regional dashboard map.
 *
 * All figures are illustrative sample data for the concept, not live data.
 */

const SVG_NS = 'http://www.w3.org/2000/svg';
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function initHomeInterfaces() {
  initCycle();
  initTabs();
  initValueTooltips();
  initScenarioChart();
  initLayers();
  initEstateRecord();
  initRegionalDashboard();
}

// --------------------------------------------------------------------------
// Living archive: Observe → Remember → Return
// --------------------------------------------------------------------------
function initCycle() {
  const items = [...document.querySelectorAll('.h-cycle-item')];
  const nodes = [...document.querySelectorAll('.h-cycle-node')];
  const progress = document.getElementById('h-cycle-progress');
  if (!items.length) return;
  const CIRC = 2 * Math.PI * 150;
  let current = 0;
  let timer = null;

  const show = (i) => {
    current = i;
    items.forEach((el, k) => {
      el.classList.toggle('is-active', k === i);
      el.setAttribute('aria-selected', String(k === i));
    });
    nodes.forEach((n, k) => n.classList.toggle('is-active', k === i));
    if (progress) progress.style.strokeDashoffset = String(CIRC - CIRC * ((i + 1) / 3));
  };
  const start = () => {
    if (reduceMotion) return;
    stop();
    timer = setInterval(() => show((current + 1) % items.length), 4200);
  };
  const stop = () => { if (timer) clearInterval(timer); timer = null; };

  items.forEach((el, i) => {
    el.addEventListener('click', () => { show(i); start(); });
    el.addEventListener('mouseenter', stop);
    el.addEventListener('mouseleave', start);
  });

  const section = document.getElementById('archive');
  if (section && 'IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => (e.isIntersecting ? start() : stop()), { threshold: 0.3 }).observe(section);
  }
  show(0);
}

// --------------------------------------------------------------------------
// LandBook tabs (WAI-ARIA tabs pattern)
// --------------------------------------------------------------------------
function initTabs() {
  const tabs = [...document.querySelectorAll('#lb-app .h-tab')];
  if (!tabs.length) return;
  const select = (tab, focus) => {
    tabs.forEach(t => {
      const on = t === tab;
      t.classList.toggle('is-active', on);
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      const panel = document.getElementById(t.dataset.panel);
      if (panel) { panel.hidden = !on; panel.classList.toggle('is-active', on); }
    });
    if (focus) tab.focus();
  };
  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => select(tab));
    tab.addEventListener('keydown', (e) => {
      const dir = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
      if (!dir) return;
      e.preventDefault();
      select(tabs[(i + dir + tabs.length) % tabs.length], true);
    });
  });
}

// --------------------------------------------------------------------------
// Shared floating tooltip
// --------------------------------------------------------------------------
let tipEl = null;
function tip(text, x, y) {
  if (!tipEl) {
    tipEl = document.createElement('div');
    tipEl.className = 'h-tip';
    tipEl.setAttribute('role', 'status');
    document.body.appendChild(tipEl);
  }
  if (text == null) { tipEl.classList.remove('is-on'); return; }
  tipEl.textContent = text;
  tipEl.style.left = `${x + 14}px`;
  tipEl.style.top = `${y - 36}px`;
  tipEl.classList.add('is-on');
}

function initValueTooltips() {
  document.querySelectorAll('#lb-bars .h-bar').forEach(bar => {
    bar.tabIndex = 0;
    bar.addEventListener('mousemove', (e) => tip(bar.dataset.tip, e.clientX, e.clientY));
    bar.addEventListener('mouseleave', () => tip(null));
    bar.addEventListener('focus', () => {
      const r = bar.getBoundingClientRect();
      tip(bar.dataset.tip, r.left + r.width / 2, r.top);
    });
    bar.addEventListener('blur', () => tip(null));
  });
}

// --------------------------------------------------------------------------
// Future scenarios line chart (one axis, legend toggles, crosshair tooltip)
// --------------------------------------------------------------------------
const SCENARIOS = [
  { name: 'Continue as now', color: '#C0582F', values: [100, 98, 96, 93, 90, 88, 85] },
  { name: 'Regenerative grazing', color: '#6A9A2C', values: [100, 104, 110, 117, 123, 128, 132] },
  { name: 'Rewild the valley', color: '#2E6FA8', values: [100, 102, 107, 114, 122, 131, 139] },
];
const YEARS = [2026, 2031, 2036, 2041, 2046, 2051, 2056];

function initScenarioChart() {
  const host = document.getElementById('lb-chart');
  if (!host) return;
  const W = 720, H = 300, m = { t: 16, r: 150, b: 30, l: 40 };
  const iw = W - m.l - m.r, ih = H - m.t - m.b;
  const yMin = 80, yMax = 145;
  const x = (i) => m.l + (i / (YEARS.length - 1)) * iw;
  const y = (v) => m.t + ih - ((v - yMin) / (yMax - yMin)) * ih;
  const el = (tag, attrs = {}, parent) => {
    const n = document.createElementNS(SVG_NS, tag);
    Object.entries(attrs).forEach(([k, v]) => n.setAttribute(k, v));
    if (parent) parent.appendChild(n);
    return n;
  };

  const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': 'Line chart of soil organic carbon index under three scenarios, 2026 to 2056' });
  const grid = el('g', { class: 'grid' }, svg);
  const axis = el('g', { class: 'axis' }, svg);
  [80, 100, 120, 140].forEach(v => {
    el('line', { x1: m.l, x2: m.l + iw, y1: y(v), y2: y(v) }, grid);
    el('text', { x: m.l - 10, y: y(v) + 4, 'text-anchor': 'end' }, axis).textContent = v;
  });
  YEARS.forEach((yr, i) => {
    if (i % 2) return;
    el('text', { x: x(i), y: H - 8, 'text-anchor': 'middle' }, axis).textContent = yr;
  });

  // Direct labels at line ends, nudged apart so they never collide
  const ends = SCENARIOS.map((s, k) => ({ k, y: y(s.values.at(-1)) })).sort((a, b) => a.y - b.y);
  for (let i = 1; i < ends.length; i++) if (ends[i].y - ends[i - 1].y < 16) ends[i].y = ends[i - 1].y + 16;
  const labelY = Object.fromEntries(ends.map(e => [e.k, e.y]));

  const groups = SCENARIOS.map((s, k) => {
    const g = el('g', { class: 'series' }, svg);
    const d = s.values.map((v, i) => `${i ? 'L' : 'M'}${x(i)} ${y(v)}`).join(' ');
    // Uncertainty band widening over time
    const up = s.values.map((v, i) => `${i ? 'L' : 'M'}${x(i)} ${y(v + i * 1.3)}`).join(' ');
    const down = s.values.map((v, i) => `L${x(i)} ${y(v - i * 1.3)}`).reverse().join(' ');
    el('path', { d: `${up} ${down} Z`, class: 'band', fill: s.color }, g);
    const line = el('path', { d, stroke: s.color }, g);
    if (!reduceMotion) {
      const len = line.getTotalLength?.() || 800;
      line.style.strokeDasharray = len;
      line.style.strokeDashoffset = len;
      line.style.transition = 'stroke-dashoffset 1.4s cubic-bezier(.2,.7,.2,1)';
    }
    el('text', { x: x(YEARS.length - 1) + 10, y: labelY[k] + 4 }, g).textContent = `${s.name} · ${s.values.at(-1)}`;
    const dot = el('circle', { r: 5, class: 'dot', fill: s.color }, g);
    return { g, line, dot };
  });

  const cross = el('line', { class: 'cross', y1: m.t, y2: m.t + ih }, svg);
  const hit = el('rect', { x: m.l, y: m.t, width: iw, height: ih, fill: 'transparent' }, svg);
  host.appendChild(svg);

  const tipBox = document.createElement('div');
  tipBox.className = 'h-chart-tip';
  host.appendChild(tipBox);

  const visible = SCENARIOS.map(() => true);
  const move = (clientX) => {
    const r = svg.getBoundingClientRect();
    const sx = ((clientX - r.left) / r.width) * W;
    const i = Math.max(0, Math.min(YEARS.length - 1, Math.round(((sx - m.l) / iw) * (YEARS.length - 1))));
    cross.setAttribute('x1', x(i)); cross.setAttribute('x2', x(i));
    groups.forEach((gr, k) => { gr.dot.setAttribute('cx', x(i)); gr.dot.setAttribute('cy', y(SCENARIOS[k].values[i])); });
    tipBox.innerHTML = `<b>${YEARS[i]}</b>` + SCENARIOS.map((s, k) => visible[k]
      ? `<span><em><i style="background:${s.color}"></i>${s.name}</em><strong>${s.values[i]}</strong></span>` : '').join('');
    const px = (x(i) / W) * r.width;
    tipBox.style.left = `${px > r.width * 0.55 ? px - 190 : px + 16}px`;
    host.classList.add('is-hover');
  };
  hit.addEventListener('mousemove', (e) => move(e.clientX));
  hit.addEventListener('touchstart', (e) => move(e.touches[0].clientX), { passive: true });
  hit.addEventListener('touchmove', (e) => move(e.touches[0].clientX), { passive: true });
  hit.addEventListener('mouseleave', () => host.classList.remove('is-hover'));

  document.querySelectorAll('#lb-legend .h-legend-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const k = +btn.dataset.series;
      visible[k] = !visible[k];
      btn.classList.toggle('is-on', visible[k]);
      btn.setAttribute('aria-pressed', String(visible[k]));
      groups[k].g.classList.toggle('is-off', !visible[k]);
    });
  });

  // Draw lines the first time the panel is shown
  const draw = () => groups.forEach(gr => { gr.line.style.strokeDashoffset = '0'; });
  const tab = document.getElementById('lb-tab-scenarios');
  tab?.addEventListener('click', () => requestAnimationFrame(() => requestAnimationFrame(draw)));
  tab?.addEventListener('focus', () => requestAnimationFrame(draw));
  if (reduceMotion) draw();
}

// --------------------------------------------------------------------------
// The land in layers
// --------------------------------------------------------------------------
const LAYERS = [
  {
    title: 'Land & Water', sub: 'Terrain, geology, soils and water access.',
    rows: [['Dominant soil', 'Schist lithosol', 'obs'], ['Slope > 15%', '22% of area', 'cmp'], ['Nearest perennial water', '340 m', 'obs']],
    src: 'SoilGrids, DGT terrain model, field survey',
  },
  {
    title: 'Biodiversity & Habitat', sub: 'Species records and habitat context.',
    rows: [['Species recorded', '286', 'obs'], ['Habitats of EU interest', '2', 'obs'], ['Connectivity score', '0.71', 'mod']],
    src: 'GBIF, iNaturalist, Natura 2000',
  },
  {
    title: 'Climate & Seasons', sub: 'Rainfall, temperature and growing conditions.',
    rows: [['Annual rainfall', '618 mm', 'obs'], ['Days above 35°C', '14 / yr', 'cmp'], ['Growing season', 'Oct – Jun', 'cmp']],
    src: 'Open-Meteo reanalysis, IPMA',
  },
  {
    title: 'History & Trends', sub: 'Climate change and landscape trajectories.',
    rows: [['Rainfall trend', '−11% since 1991', 'cmp'], ['Tree cover change', '+4% since 2000', 'obs'], ['Projected aridity 2050', 'Higher', 'mod']],
    src: 'Copernicus land cover, CMIP6 ensemble',
  },
  {
    title: 'Risks & Resilience', sub: 'Fire, flood, drought and capacity to adapt.',
    rows: [['Wildfire hazard', 'High', 'mod'], ['Flood exposure', 'Low', 'cmp'], ['Drought months / yr', '4.2', 'cmp']],
    src: 'EFFIS, NASA FIRMS, flood maps',
  },
  {
    title: 'Sources & Methodology', sub: 'See what is observed, computed or modelled.',
    rows: [['Observed', '41 sources', 'obs'], ['Computed', '18 indicators', 'cmp'], ['Modelled', '9 estimates', 'mod']],
    src: 'Every value links back to its evidence',
  },
];
const EV_LABEL = { obs: 'Observed', cmp: 'Computed', mod: 'Modelled' };

function initLayers() {
  const list = document.getElementById('h-layer-list');
  const card = document.getElementById('h-layer-card');
  if (!list || !card) return;
  list.innerHTML = LAYERS.map((l, i) => `
    <button class="h-layer-btn" role="tab" aria-selected="false" data-i="${i}" tabindex="${i ? -1 : 0}">
      <span class="n">0${i + 1}</span><span><strong>${l.title}</strong><em>${l.sub}</em></span>
    </button>`).join('');
  const btns = [...list.children];
  const show = (i, focus) => {
    btns.forEach((b, k) => {
      b.classList.toggle('is-active', k === i);
      b.setAttribute('aria-selected', String(k === i));
      b.tabIndex = k === i ? 0 : -1;
    });
    const l = LAYERS[i];
    card.innerHTML = `
      <h3>${l.title}</h3>
      <ul>${l.rows.map(([k, v, ev]) => `<li><span>${k}<span class="h-ev h-ev--${ev}">${EV_LABEL[ev]}</span></span><b>${v}</b></li>`).join('')}</ul>
      <p class="src"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>${l.src}</p>`;
    card.classList.remove('is-swap'); void card.offsetWidth; card.classList.add('is-swap');
    if (focus) btns[i].focus();
  };
  btns.forEach((b, i) => {
    b.addEventListener('click', () => show(i));
    b.addEventListener('keydown', (e) => {
      const dir = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
      if (dir) { e.preventDefault(); show((i + dir + btns.length) % btns.length, true); }
    });
  });
  show(0);
}

// --------------------------------------------------------------------------
// Estate record: filterable evidence feed linked to map pins
// --------------------------------------------------------------------------
const KINDS = {
  photo: { label: 'Photo of the land', color: '#B4532E', icon: '<path d="M4 7h3l2-3h6l2 3h3v13H4z"/><circle cx="12" cy="13" r="3.5"/>' },
  drone: { label: 'Drone footage', color: '#2E6FA8', icon: '<circle cx="6" cy="6" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M8 8l8 8M16 8l-8 8"/>' },
  soil: { label: 'Soil test', color: '#8C6A43', icon: '<path d="M9 3h6M10 3v6L5 19a1.5 1.5 0 0 0 1.3 2h11.4A1.5 1.5 0 0 0 19 19l-5-10V3"/><path d="M7.5 14h9"/>' },
  record: { label: 'Map & local record', color: '#4F7A45', icon: '<path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2z"/><path d="M9 4v14M15 6v14"/>' },
};
const ENTRIES = [
  { kind: 'photo', title: 'First orchids on the north meadow', meta: '12 Apr 2026 · Ana, estate team', tags: ['Spring', 'Habitat'], x: 32, y: 30, img: '/wiki/ecology.png' },
  { kind: 'soil', title: 'Soil panel, olive terrace T3', meta: '28 Mar 2026 · Lab result', tags: ['pH 6.4', 'SOM 3.1%', 'P low'], x: 56, y: 42 },
  { kind: 'drone', title: 'Winter flight after storm Kirk', meta: '19 Jan 2026 · 4 min, 2.7k', tags: ['Erosion', 'Stream'], x: 70, y: 62, img: '/wiki/water.png' },
  { kind: 'record', title: '1958 cadastral map, scanned', meta: 'Estate archive · Box 4', tags: ['Boundaries', 'Wells'], x: 44, y: 70, img: '/wiki/landuse.png' },
  { kind: 'record', title: 'Where the old spring ran', meta: 'Oral history · Sr. Joaquim, neighbour', tags: ['Water', 'Memory'], x: 22, y: 58 },
  { kind: 'photo', title: 'Cork harvest, block B', meta: '14 Jul 2025 · Field crew', tags: ['Montado', 'Work'], x: 62, y: 24, img: '/wiki/land.png' },
  { kind: 'soil', title: 'Infiltration test, grazed paddock', meta: '2 Jun 2025 · Field kit', tags: ['18 mm/h'], x: 80, y: 38 },
];

function initEstateRecord() {
  const feed = document.getElementById('h-feed');
  const pins = document.getElementById('h-record-pins');
  const filters = document.getElementById('h-record-filters');
  if (!feed || !pins) return;

  feed.innerHTML = ENTRIES.map((e, i) => {
    const k = KINDS[e.kind];
    const thumb = e.img
      ? `<div class="h-entry-thumb" style="background-image:url('${e.img}')"></div>`
      : `<div class="h-entry-thumb h-entry-thumb--data"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${k.icon}</svg></div>`;
    return `<li class="h-entry" data-i="${i}" data-kind="${e.kind}" tabindex="0" style="--c:${k.color}">
      ${thumb}
      <div><span class="h-entry-kind">${k.label}</span><h4>${e.title}</h4><p>${e.meta}</p>
      <div class="tags">${e.tags.map(t => `<span>${t}</span>`).join('')}</div></div>
    </li>`;
  }).join('');

  pins.innerHTML = ENTRIES.map((e, i) => {
    const k = KINDS[e.kind];
    return `<button class="h-record-pin" data-i="${i}" data-kind="${e.kind}" style="left:${e.x}%;top:${e.y}%;--c:${k.color}" aria-label="${k.label}: ${e.title}">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${k.icon}</svg></button>`;
  }).join('');

  const entryEls = [...feed.children];
  const pinEls = [...pins.children];
  const hot = (i, on) => {
    entryEls[i]?.classList.toggle('is-hot', on);
    pinEls[i]?.classList.toggle('is-hot', on);
  };
  entryEls.forEach((el, i) => {
    el.addEventListener('mouseenter', () => hot(i, true));
    el.addEventListener('mouseleave', () => hot(i, false));
    el.addEventListener('focus', () => hot(i, true));
    el.addEventListener('blur', () => hot(i, false));
  });
  pinEls.forEach((el, i) => {
    el.addEventListener('mouseenter', () => hot(i, true));
    el.addEventListener('mouseleave', () => hot(i, false));
    el.addEventListener('click', () => {
      entryEls[i].scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'nearest' });
      entryEls[i].focus({ preventScroll: true });
    });
  });

  filters?.querySelectorAll('.h-filter').forEach(btn => {
    btn.addEventListener('click', () => {
      const kind = btn.dataset.kind;
      filters.querySelectorAll('.h-filter').forEach(b => {
        const on = b === btn;
        b.classList.toggle('is-on', on);
        b.setAttribute('aria-pressed', String(on));
      });
      entryEls.forEach(el => { el.hidden = kind !== 'all' && el.dataset.kind !== kind; });
      pinEls.forEach(el => el.classList.toggle('is-dim', kind !== 'all' && el.dataset.kind !== kind));
    });
  });
}

// --------------------------------------------------------------------------
// Regional dashboard: layer toggles, sensor network, groundwater sparkline
// --------------------------------------------------------------------------
const SENSORS = [
  { x: 120, y: 236, name: 'Rain gauge · Odemira', reading: '7.2 mm last 24 h' },
  { x: 250, y: 236, name: 'River level · Mira', reading: '1.34 m, normal' },
  { x: 452, y: 150, name: 'Reservoir · Santa Clara', reading: '58% capacity' },
  { x: 330, y: 330, name: 'Groundwater well GW-04', reading: '13.9 m below ground' },
  { x: 190, y: 120, name: 'Soil moisture · São Teotónio', reading: '18% vol.' },
  { x: 500, y: 300, name: 'Weather station · Sabóia', reading: '24°C, NW 12 km/h' },
  { x: 100, y: 330, name: 'Nitrate probe · coastal plain', reading: '38 mg/L' },
];

function initRegionalDashboard() {
  const map = document.getElementById('h-dash-map');
  const sensors = document.getElementById('h-sensors');
  const tipBox = document.getElementById('h-dm-tip');
  if (!map) return;

  if (sensors) {
    SENSORS.forEach((s, i) => {
      const g = document.createElementNS(SVG_NS, 'g');
      g.setAttribute('class', 'h-sensor');
      g.setAttribute('tabindex', '0');
      g.setAttribute('role', 'button');
      g.setAttribute('aria-label', `${s.name}: ${s.reading}`);
      g.innerHTML = `<circle class="halo" cx="${s.x}" cy="${s.y}" r="8" style="animation-delay:${i * 0.4}s"/><circle class="core" cx="${s.x}" cy="${s.y}" r="6"/>`;
      const showTip = () => {
        if (!tipBox) return;
        const r = map.getBoundingClientRect();
        const host = tipBox.parentElement.getBoundingClientRect();
        const vb = map.viewBox.baseVal;
        const scale = Math.max(r.width / vb.width, r.height / vb.height);
        const ox = (r.width - vb.width * scale) / 2, oy = (r.height - vb.height * scale) / 2;
        tipBox.innerHTML = `<b>${s.name}</b><br>${s.reading}`;
        tipBox.style.left = `${r.left - host.left + ox + (s.x - vb.x) * scale}px`;
        tipBox.style.top = `${r.top - host.top + oy + (s.y - vb.y) * scale}px`;
        tipBox.classList.add('is-on');
      };
      const hide = () => tipBox?.classList.remove('is-on');
      g.addEventListener('mouseenter', showTip);
      g.addEventListener('focus', showTip);
      g.addEventListener('mouseleave', hide);
      g.addEventListener('blur', hide);
      sensors.appendChild(g);
    });
  }

  document.querySelectorAll('#h-dash-layers .h-layer-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const on = !btn.classList.contains('is-on');
      btn.classList.toggle('is-on', on);
      btn.setAttribute('aria-pressed', String(on));
      map.querySelector(`.h-dm-layer[data-layer="${btn.dataset.layer}"]`)?.classList.toggle('is-on', on);
      if (!on) tipBox?.classList.remove('is-on');
    });
  });

  // Groundwater depth (m below ground), monthly; deeper = lower on the chart
  const spark = document.getElementById('h-spark-gw');
  if (spark) {
    const v = [12.1, 12.0, 12.3, 12.6, 12.9, 13.2, 13.0, 12.8, 12.7, 12.9, 13.1, 13.4, 13.6, 13.5, 13.3, 13.2, 13.4, 13.6, 13.8, 13.9, 13.8, 13.7, 13.8, 13.9];
    const W = 260, H = 64, pad = 4;
    const min = 11.8, max = 14.2;
    const px = (i) => pad + (i / (v.length - 1)) * (W - pad * 2 - 40);
    const py = (d) => pad + ((d - min) / (max - min)) * (H - pad * 2);
    const d = v.map((d, i) => `${i ? 'L' : 'M'}${px(i).toFixed(1)} ${py(d).toFixed(1)}`).join(' ');
    const last = v.length - 1;
    spark.innerHTML = `
      <path class="area" d="${d} L${px(last)} ${pad} L${px(0)} ${pad} Z"/>
      <path class="line" d="${d}"/>
      <circle class="end" cx="${px(last)}" cy="${py(v[last])}" r="4"/>
      <text x="${px(last) + 8}" y="${py(v[last]) + 4}">13.9 m</text>
      <text x="${px(0)}" y="${H + 10}">2024</text>
      <text x="${px(last)}" y="${H + 10}" text-anchor="end">2026</text>`;
  }
}
