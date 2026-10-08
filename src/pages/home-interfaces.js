/**
 * home-interfaces.js — Interactive interfaces on the homepage: the
 * living-archive cycle, LandBook dashboard, land layers explorer, estate
 * record and the regional dashboard.
 *
 * LandBook figures come from the Monte da Ribeira sample report
 * (src/lib/landbook-sample.js); regional figures come from the Odemira
 * commons data (src/lib/wiki-data.js). The estate record entries are
 * illustrative examples of what an owner would add.
 */

import {
  SCORECARD, ECOSYSTEM_SERVICES, LAND_COVER_VALUE, CLIMATE_PROJECTION, VALUATION_SCENARIOS,
} from '../lib/landbook-sample.js';
import { ODEMIRA, getSectionById, getLandmarks } from '../lib/wiki-data.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function initHomeInterfaces() {
  initCycle();
  initTabs();
  initScorecard();
  initValueBars();
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

const eur = (n) => `€${Math.round(n).toLocaleString('en-GB')}`;

function hoverTip(el, text) {
  el.tabIndex = 0;
  el.addEventListener('mousemove', (e) => tip(text, e.clientX, e.clientY));
  el.addEventListener('mouseleave', () => tip(null));
  el.addEventListener('focus', () => {
    const r = el.getBoundingClientRect();
    tip(text, r.left + r.width / 2, r.top);
  });
  el.addEventListener('blur', () => tip(null));
}

// --------------------------------------------------------------------------
// LandBook: scorecard, ecosystem services, climate trajectory, valuation
// --------------------------------------------------------------------------
function initScorecard() {
  const list = document.getElementById('lb-scorecard');
  if (!list) return;
  list.innerHTML = SCORECARD.map(d => `
    <li data-tip="${d.label} ${d.score}/10 · regional ${d.regional}/10 · ${d.basis}">
      <span>${d.label}</span>
      <div class="h-meter"><i style="--v:${d.score * 10}%"></i><s style="--t:${d.regional * 10}%"></s></div>
      <b>${d.score}</b>
    </li>`).join('');
  list.querySelectorAll('li').forEach(li => hoverTip(li, li.dataset.tip));
}

function initValueBars() {
  const bars = document.getElementById('lb-bars');
  if (bars) {
    const max = Math.max(...ECOSYSTEM_SERVICES.map(d => d.value));
    const total = ECOSYSTEM_SERVICES.reduce((a, d) => a + d.value, 0);
    bars.innerHTML = ECOSYSTEM_SERVICES.map(d => `
      <div class="h-bar" role="listitem">
        <span class="h-bar-label">${d.label}</span>
        <div class="h-bar-track"><i style="--v:${(d.value / max) * 100}%"></i></div>
        <b>${eur(d.value)}</b>
      </div>`).join('');
    bars.querySelectorAll('.h-bar').forEach((el, i) => {
      const d = ECOSYSTEM_SERVICES[i];
      hoverTip(el, `${d.label} · ${eur(d.value)} a year · ${Math.round((d.value / total) * 100)}% of the total`);
    });
  }
  const cover = document.getElementById('lb-cover');
  if (cover) {
    cover.innerHTML = `<h4>Natural capital by land cover</h4>
      <table><thead><tr><th>Land cover</th><th>Area</th><th>Annual value</th></tr></thead><tbody>
      ${LAND_COVER_VALUE.map(d => `<tr><td>${d.label}</td><td>${d.ha} ha</td><td>${eur(d.value)}</td></tr>`).join('')}
      </tbody></table>`;
  }
}

// Single-series line chart of projected rainfall (one axis), crosshair tooltip
function initScenarioChart() {
  const host = document.getElementById('lb-chart');
  if (!host) return;
  const data = CLIMATE_PROJECTION;
  const W = 520, H = 280, m = { t: 24, r: 24, b: 34, l: 44 };
  const iw = W - m.l - m.r, ih = H - m.t - m.b;
  const yMin = 550, yMax = 670;
  const x = (i) => m.l + (i / (data.length - 1)) * iw;
  const y = (v) => m.t + ih - ((v - yMin) / (yMax - yMin)) * ih;
  const el = (tag, attrs = {}, parent) => {
    const n = document.createElementNS(SVG_NS, tag);
    Object.entries(attrs).forEach(([k, v]) => n.setAttribute(k, v));
    if (parent) parent.appendChild(n);
    return n;
  };

  const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': 'Projected annual rainfall falling from 652 mm today to 580 mm by 2045–2050' });
  const grid = el('g', { class: 'grid' }, svg);
  const axis = el('g', { class: 'axis' }, svg);
  [560, 600, 640].forEach(v => {
    el('line', { x1: m.l, x2: m.l + iw, y1: y(v), y2: y(v) }, grid);
    el('text', { x: m.l - 10, y: y(v) + 4, 'text-anchor': 'end' }, axis).textContent = v;
  });
  el('text', { x: m.l - 10, y: m.t - 10, 'text-anchor': 'end' }, axis).textContent = 'mm';
  data.forEach((d, i) => {
    el('text', { x: x(i), y: H - 10, 'text-anchor': i === 0 ? 'start' : i === data.length - 1 ? 'end' : 'middle' }, axis).textContent = d.period;
  });

  const g = el('g', { class: 'series' }, svg);
  const d = data.map((p, i) => `${i ? 'L' : 'M'}${x(i)} ${y(p.rain)}`).join(' ');
  el('path', { d: `${d} L${x(data.length - 1)} ${m.t + ih} L${x(0)} ${m.t + ih} Z`, class: 'band', fill: '#2E6FA8' }, g);
  const line = el('path', { d, stroke: '#2E6FA8' }, g);
  data.forEach((p, i) => {
    el('circle', { cx: x(i), cy: y(p.rain), r: 4, fill: '#2E6FA8', stroke: '#fff', 'stroke-width': 2 }, g);
    if (i) el('text', { x: x(i), y: y(p.rain) - 12, 'text-anchor': i === data.length - 1 ? 'end' : 'middle', class: 'ann' }, g).textContent = `+${p.temp}°C`;
  });
  if (!reduceMotion) {
    const len = line.getTotalLength?.() || 600;
    line.style.strokeDasharray = len;
    line.style.strokeDashoffset = len;
    line.style.transition = 'stroke-dashoffset 1.4s cubic-bezier(.2,.7,.2,1)';
  }
  const cross = el('line', { class: 'cross', y1: m.t, y2: m.t + ih }, svg);
  const dot = el('circle', { r: 6, class: 'dot', fill: '#2E6FA8' }, svg);
  const hit = el('rect', { x: m.l - 20, y: m.t, width: iw + 40, height: ih, fill: 'transparent' }, svg);
  host.appendChild(svg);

  const tipBox = document.createElement('div');
  tipBox.className = 'h-chart-tip';
  host.appendChild(tipBox);
  const move = (clientX) => {
    const r = svg.getBoundingClientRect();
    const sx = ((clientX - r.left) / r.width) * W;
    const i = Math.max(0, Math.min(data.length - 1, Math.round(((sx - m.l) / iw) * (data.length - 1))));
    const p = data[i];
    cross.setAttribute('x1', x(i)); cross.setAttribute('x2', x(i));
    dot.setAttribute('cx', x(i)); dot.setAttribute('cy', y(p.rain));
    const change = p.rain - data[0].rain;
    tipBox.innerHTML = `<b>${p.period}</b><span><em>Annual rainfall</em><strong>${p.rain} mm</strong></span>`
      + (i ? `<span><em>vs today</em><strong>${change} mm</strong></span><span><em>Warming</em><strong>+${p.temp}°C</strong></span>` : '');
    const px = (x(i) / W) * r.width;
    tipBox.style.left = `${px > r.width * 0.55 ? px - 186 : px + 16}px`;
    host.classList.add('is-hover');
  };
  hit.addEventListener('mousemove', (e) => move(e.clientX));
  hit.addEventListener('touchstart', (e) => move(e.touches[0].clientX), { passive: true });
  hit.addEventListener('touchmove', (e) => move(e.touches[0].clientX), { passive: true });
  hit.addEventListener('mouseleave', () => host.classList.remove('is-hover'));

  const draw = () => { line.style.strokeDashoffset = '0'; };
  const tab = document.getElementById('lb-tab-scenarios');
  tab?.addEventListener('click', () => requestAnimationFrame(() => requestAnimationFrame(draw)));
  tab?.addEventListener('focus', () => requestAnimationFrame(draw));
  if (reduceMotion) draw();

  const val = document.getElementById('lb-valuation');
  if (val) {
    const max = Math.max(...VALUATION_SCENARIOS.map(s => s.total));
    val.innerHTML = '<h4>Valuation scenarios</h4>' + VALUATION_SCENARIOS.map(s => `
      <div class="h-scen-card">
        <div><span>${s.label}</span><strong>${eur(s.total)}</strong></div>
        <div class="h-meter"><i style="--v:${(s.total / max) * 100}%"></i></div>
        <em>${eur(s.perHa)}/ha · ${s.basis}</em>
      </div>`).join('');
  }
}

// --------------------------------------------------------------------------
// The land in layers (values from the Monte da Ribeira sample report)
// --------------------------------------------------------------------------
const LAYERS = [
  {
    title: 'Land & Water', sub: 'Terrain, geology, soils and water access.',
    rows: [['Soil type', 'Cambisols', 'mod'], ['Average slope', '8.3%', 'cmp'], ['Springs and wells', '2 + 1', 'obs']],
    src: 'SoilGrids 2.0, Open-Meteo DEM, OpenStreetMap',
  },
  {
    title: 'Biodiversity & Habitat', sub: 'Species records and habitat context.',
    rows: [['Species within 15 km', '287', 'obs'], ['Threatened species', '14', 'obs'], ['Habitat connectivity', '6.2 / 10', 'mod']],
    src: 'iNaturalist, GBIF, Natura 2000',
  },
  {
    title: 'Climate & Seasons', sub: 'Rainfall, temperature and growing conditions.',
    rows: [['Annual rainfall', '652 mm', 'cmp'], ['Mean temperature', '15.8°C', 'cmp'], ['Growing season', '~270 days', 'cmp']],
    src: 'Open-Meteo archive, 30-year normals',
  },
  {
    title: 'History & Trends', sub: 'Climate change and landscape trajectories.',
    rows: [['Land cover 2000–2018', 'Stable agro-forestry', 'obs'], ['Basin tree cover lost', '1.16 km²', 'obs'], ['Rainfall by 2045–50', '−11%', 'mod']],
    src: 'CORINE Land Cover, Global Forest Watch, CMIP6',
  },
  {
    title: 'Risks & Resilience', sub: 'Fire, flood, drought and capacity to adapt.',
    rows: [['Fire', '45/100, moderate', 'cmp'], ['Drought', '30/100, moderate', 'cmp'], ['Fire detections, 10 yrs', '2,847 within 25 km', 'obs']],
    src: 'Risk model, NASA FIRMS',
  },
  {
    title: 'Sources & Methodology', sub: 'See what is observed, computed or modelled.',
    rows: [['Every value', 'Cites its source', 'obs'], ['Synthetic sections', 'Flagged in red', 'mod'], ['Methods', 'TEEB, SoilGrids, CMIP6', 'cmp']],
    src: 'Full list in the report’s methodology section',
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
// Estate record: filterable evidence feed linked to map pins.
// Mirrors LandBook's Vault (notes) and Capture (photos) views; entries are examples.
// --------------------------------------------------------------------------
const KINDS = {
  photo: { label: 'Photo of the land', color: '#B4532E', icon: '<path d="M4 7h3l2-3h6l2 3h3v13H4z"/><circle cx="12" cy="13" r="3.5"/>' },
  drone: { label: 'Drone footage', color: '#2E6FA8', icon: '<circle cx="6" cy="6" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M8 8l8 8M16 8l-8 8"/>' },
  soil: { label: 'Soil test', color: '#8C6A43', icon: '<path d="M9 3h6M10 3v6L5 19a1.5 1.5 0 0 0 1.3 2h11.4A1.5 1.5 0 0 0 19 19l-5-10V3"/><path d="M7.5 14h9"/>' },
  record: { label: 'Map & local record', color: '#4F7A45', icon: '<path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2z"/><path d="M9 4v14M15 6v14"/>' },
};
const ENTRIES = [
  { kind: 'photo', title: 'First orchids on the north meadow', meta: '12 Apr 2026 · Ana, estate team', tags: ['Spring', 'Habitat'], x: 32, y: 30, img: '/wiki/ecology.png' },
  { kind: 'soil', title: 'Soil panel, south terrace', meta: '28 Mar 2026 · Lab result', tags: ['pH 5.8', 'OC 18.4 g/kg', 'Cambisol'], x: 56, y: 42 },
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
// Regional dashboard: Odemira commons data, places and layers
// --------------------------------------------------------------------------
const [S, W0, N, E0] = ODEMIRA.bbox; // [south, west, north, east]
const project = ([lat, lng]) => [((lng - W0) / (E0 - W0)) * 600, 20 + ((N - lat) / (N - S)) * 430];

function initRegionalDashboard() {
  const map = document.getElementById('h-dash-map');
  const places = document.getElementById('h-places');
  const tipBox = document.getElementById('h-dm-tip');
  if (!map) return;

  if (places) {
    getLandmarks().forEach((lm, i) => {
      const [px, py] = project(lm.coords);
      const g = document.createElementNS(SVG_NS, 'g');
      g.setAttribute('class', `h-sensor h-sensor--${lm.type}`);
      g.setAttribute('tabindex', '0');
      g.setAttribute('role', 'button');
      g.setAttribute('aria-label', `${lm.name}: ${lm.desc}`);
      g.innerHTML = `<circle class="halo" cx="${px}" cy="${py}" r="8" style="animation-delay:${i * 0.4}s"/><circle class="core" cx="${px}" cy="${py}" r="${lm.type === 'town' ? 6 : 4.5}"/>`
        + (lm.type === 'town' ? `<text x="${px + 10}" y="${py + 4}" class="h-dm-tag">${lm.name}</text>` : '');
      const showTip = () => {
        if (!tipBox) return;
        const r = map.getBoundingClientRect();
        const host = tipBox.parentElement.getBoundingClientRect();
        const vb = map.viewBox.baseVal;
        const scale = Math.min(r.width / vb.width, r.height / vb.height);
        const ox = (r.width - vb.width * scale) / 2, oy = (r.height - vb.height * scale) / 2;
        tipBox.innerHTML = `<b>${lm.name}</b><br>${lm.desc}`;
        tipBox.style.left = `${r.left - host.left + ox + (px - vb.x) * scale}px`;
        tipBox.style.top = `${r.top - host.top + oy + (py - vb.y) * scale}px`;
        tipBox.classList.add('is-on');
      };
      const hide = () => tipBox?.classList.remove('is-on');
      g.addEventListener('mouseenter', showTip);
      g.addEventListener('focus', showTip);
      g.addEventListener('mouseleave', hide);
      g.addEventListener('blur', hide);
      places.appendChild(g);
    });
  }

  const setLayer = (name, on) => {
    map.querySelector(`.h-dm-layer[data-layer="${name}"]`)?.classList.toggle('is-on', on);
    liveSetLayer?.(name, on);
    if (!on) tipBox?.classList.remove('is-on');
  };
  document.querySelectorAll('#h-dash-layers .h-layer-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const on = !btn.classList.contains('is-on');
      btn.classList.toggle('is-on', on);
      btn.setAttribute('aria-pressed', String(on));
      setLayer(btn.dataset.layer, on);
    });
  });

  renderSignals();
  initLiveMap();
}

// Signals panel, built from the commons' own section data
function renderSignals() {
  const host = document.getElementById('h-signals');
  if (!host) return;
  const stat = (sec, label) => getSectionById(sec)?.visuals?.stats?.find(s => s.label === label)?.value;
  const water = stat('water', 'Reservoir Level');
  const waterSub = getSectionById('water')?.visuals?.stats?.find(s => s.label === 'Reservoir Level')?.sublabel;
  const climate = getSectionById('climate')?.visuals?.charts?.[0]?.data;
  const rain = climate?.datasets?.find(d => /Precip/i.test(d.label));
  const landuse = getSectionById('landuse')?.visuals?.charts?.[0]?.data || [];
  const risks = getSectionById('risks')?.visuals?.charts?.[0]?.data || [];
  const level = parseFloat(water) || 0;

  const W = 260, H = 60;
  const maxR = Math.max(...(rain?.values || [1]));
  const bw = W / 12;
  const bars = (rain?.values || []).map((v, i) => {
    const h = (v / maxR) * (H - 14);
    return `<rect x="${i * bw + 2}" y="${H - 12 - h}" width="${bw - 4}" height="${h}" rx="2" class="${v < 25 ? 'dry' : ''}"><title>${climate.labels[i]}: ${v} mm</title></rect>`
      + (i % 3 === 0 ? `<text x="${i * bw + bw / 2}" y="${H}" text-anchor="middle">${climate.labels[i]}</text>` : '');
  }).join('');

  host.innerHTML = `
    <a class="h-signal" href="/wiki/water">
      <div class="h-signal-head"><span>Water</span><b class="h-warn">${water || '—'}</b></div>
      <p>Santa Clara reservoir level, ${waterSub || ''}</p>
      <div class="h-thresh"><i style="--v:${level}%"></i><s style="--t:78%"></s></div>
      <div class="h-thresh-scale"><span>Empty</span><span>Usual level</span><span>Full</span></div>
    </a>
    <a class="h-signal" href="/wiki/climate">
      <div class="h-signal-head"><span>Rainfall</span><b>${stat('climate', 'Annual Rainfall') || ''}</b></div>
      <p>Monthly rainfall; dry season ${stat('climate', 'Dry Season') || ''}</p>
      <svg viewBox="0 0 ${W} ${H + 4}" class="h-spark h-spark--bars" role="img" aria-label="Monthly rainfall, wettest in December, near zero in July and August">${bars}</svg>
    </a>
    <a class="h-signal" href="/wiki/landuse">
      <div class="h-signal-head"><span>Land use</span><b>${stat('landuse', 'Greenhouses 2021') || ''}</b></div>
      <p>Under greenhouses in 2021, up from ${stat('landuse', 'Greenhouses 2013') || ''} in 2013</p>
      <div class="h-stack" role="img" aria-label="${landuse.map(d => `${d.name} ${d.value}%`).join(', ')}">
        ${landuse.map(d => `<i style="--v:${d.value}%;--c:${d.color}" title="${d.name} ${d.value}%"></i>`).join('')}
      </div>
      <div class="h-stack-key">${landuse.map(d => `<span><i style="--c:${d.color}"></i>${d.name} ${d.value}%</span>`).join('')}</div>
    </a>
    <a class="h-signal" href="/wiki/risks">
      <div class="h-signal-head"><span>Risks</span><b class="h-warn">${stat('risks', 'Overall') || ''}</b></div>
      <p>Regional risk scores out of 100</p>
      <ul class="h-risk">${risks.map(r => `<li><span>${r.axis}</span><div class="h-meter ${r.value >= 60 ? 'h-meter--warn' : ''}"><i style="--v:${r.value}%"></i></div><b>${r.value}</b></li>`).join('')}</ul>
    </a>`;
}

// When a Mapbox key is configured, swap the schematic for the commons' live map
let liveSetLayer = null;
async function initLiveMap() {
  if (!import.meta.env.VITE_MAPBOX_TOKEN) return;
  const wrap = document.getElementById('h-dash-mapwrap');
  if (!wrap || !('IntersectionObserver' in window)) return;
  const io = new IntersectionObserver(async ([e]) => {
    if (!e.isIntersecting) return;
    io.disconnect();
    try {
      const [{ createMap, addWmsLayer, addMarker }, cop, nat, effis] = await Promise.all([
        import('../lib/mapbox.js'), import('../api/copernicus.js'), import('../api/natura2000.js'), import('../api/effis.js'),
      ]);
      const div = document.createElement('div');
      div.id = 'h-live-map';
      div.className = 'h-live-map';
      wrap.appendChild(div);
      const map = createMap('h-live-map', { center: [ODEMIRA.center[1], ODEMIRA.center[0]], zoom: 9.2, scrollZoom: false });
      const layers = {};
      const markers = [];
      map.on('load', () => {
        map.addSource('h-s2', { type: 'raster', tiles: [cop.SENTINEL2_TILES], tileSize: 256 });
        map.addLayer({ id: 'h-s2-layer', type: 'raster', source: 'h-s2', paint: { 'raster-opacity': 0.8 }, layout: { visibility: 'none' } });
        layers.satellite = ['h-s2-layer'];
        layers.landcover = [addWmsLayer(map, cop.CORINE_WMS, cop.getCorineWmsParams(), { opacity: 0.5 }).layerId];
        layers.protected = [addWmsLayer(map, nat.NATURA2000_WMS, nat.getNatura2000WmsParams(), { opacity: 0.45 }).layerId];
        layers.fire = [addWmsLayer(map, effis.EFFIS_WMS, effis.getFireDangerWmsParams(), { opacity: 0.45 }).layerId];
        getLandmarks().forEach(lm => markers.push(addMarker(map, [lm.coords[1], lm.coords[0]], { color: '#B4532E', popupHtml: `<strong>${lm.name}</strong><br>${lm.desc}` })));
        document.querySelectorAll('#h-dash-layers .h-layer-toggle').forEach(b => liveSetLayer(b.dataset.layer, b.classList.contains('is-on')));
        wrap.classList.add('is-live');
        const mode = document.getElementById('h-dash-mode');
        if (mode) mode.textContent = 'Live map';
      });
      liveSetLayer = (name, on) => {
        (layers[name] || []).forEach(id => map.getLayer(id) && map.setLayoutProperty(id, 'visibility', on ? 'visible' : 'none'));
        if (name === 'places') markers.forEach(m => (m.getElement().style.display = on ? '' : 'none'));
      };
    } catch (err) {
      console.warn('Live map unavailable, keeping schematic:', err);
    }
  }, { rootMargin: '200px' });
  io.observe(wrap);
}
