const storyMap = L.map('storyMap', {
  zoomControl: false,
  dragging: false,
  scrollWheelZoom: false,
  doubleClickZoom: false,
  boxZoom: false,
  keyboard: false,
  attributionControl: false
}).setView([48.7758, 9.1829], 11.5);

L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
  maxZoom: 19
}).addTo(storyMap);

const views = [
  { center: [48.7758, 9.1829], zoom: 11.4 },
  { center: [48.7758, 9.1829], zoom: 13.2 },
  { center: [48.7730, 9.1500], zoom: 12.2 },
  { center: [48.7730, 9.1500], zoom: 13.1 },
  { center: [48.7758, 9.1829], zoom: 11.2 },
  { center: [48.7758, 9.1829], zoom: 11.0 },
  { center: [48.7758, 9.1829], zoom: 10.8 }
];

const bigNumber = document.getElementById('bigNumber');
const progressFill = document.getElementById('progressFill');
const steps = [...document.querySelectorAll('.step')];

const labels = ['11/11', '', '', '', '', '', ''];
let cityLayer = null;
let scatterBuilt = false;

function colorByLST(value) {
  const t = Math.max(0, Math.min(1, (value - 27) / 20));
  const stops = ['#176b54', '#f0d84f', '#f08a24', '#e53920', '#7f0000'];
  const idx = Math.min(stops.length - 2, Math.floor(t * (stops.length - 1)));
  return stops[idx];
}

fetch('data/stuttgart-grid-placeholder.geojson')
  .then(r => r.json())
  .then(data => {
    cityLayer = L.geoJSON(data, {
      style: feature => ({
        color: 'rgba(255,255,255,.08)',
        weight: .35,
        fillColor: colorByLST(Number(feature.properties.lst_18)),
        fillOpacity: .56
      }),
      interactive: false
    }).addTo(storyMap);
    cityLayer.bringToFront();
    buildScatter(data.features);
  })
  .catch(() => {
    buildScatter([]);
  });

function buildScatter(features) {
  if (scatterBuilt) return;
  scatterBuilt = true;

  const svg = document.getElementById('scatterSvg');
  const width = 720;
  const height = 440;
  const pad = { left: 64, right: 30, top: 28, bottom: 58 };

  const source = features
    .map(f => f.properties)
    .filter(p => Number.isFinite(Number(p.ndvi_18)) && Number.isFinite(Number(p.lst_18)))
    .filter((_, i) => i % 5 === 0);

  const xMin = 0.02, xMax = 0.48;
  const yMin = 25, yMax = 49;
  const x = v => pad.left + (v - xMin) / (xMax - xMin) * (width - pad.left - pad.right);
  const y = v => height - pad.bottom - (v - yMin) / (yMax - yMin) * (height - pad.top - pad.bottom);

  const ns = 'http://www.w3.org/2000/svg';

  const bg = document.createElementNS(ns, 'rect');
  bg.setAttribute('x', 0); bg.setAttribute('y', 0);
  bg.setAttribute('width', width); bg.setAttribute('height', height);
  bg.setAttribute('rx', 24);
  bg.setAttribute('fill', 'rgba(7,9,7,.72)');
  svg.appendChild(bg);

  [0.1, 0.2, 0.3, 0.4].forEach(v => {
    const line = document.createElementNS(ns, 'line');
    line.setAttribute('x1', x(v)); line.setAttribute('x2', x(v));
    line.setAttribute('y1', pad.top); line.setAttribute('y2', height - pad.bottom);
    line.setAttribute('stroke', 'rgba(255,255,255,.08)');
    svg.appendChild(line);
  });
  [30, 35, 40, 45].forEach(v => {
    const line = document.createElementNS(ns, 'line');
    line.setAttribute('x1', pad.left); line.setAttribute('x2', width - pad.right);
    line.setAttribute('y1', y(v)); line.setAttribute('y2', y(v));
    line.setAttribute('stroke', 'rgba(255,255,255,.08)');
    svg.appendChild(line);
  });

  source.forEach(p => {
    const c = document.createElementNS(ns, 'circle');
    c.setAttribute('cx', x(Number(p.ndvi_18)));
    c.setAttribute('cy', y(Number(p.lst_18)));
    c.setAttribute('r', 2.3);
    c.setAttribute('fill', 'rgba(255,150,76,.38)');
    svg.appendChild(c);
  });

  const trend = document.createElementNS(ns, 'line');
  trend.setAttribute('x1', x(.06));
  trend.setAttribute('y1', y(44));
  trend.setAttribute('x2', x(.44));
  trend.setAttribute('y2', y(29));
  trend.setAttribute('stroke', '#ffb16d');
  trend.setAttribute('stroke-width', 4);
  trend.setAttribute('stroke-linecap', 'round');
  svg.appendChild(trend);

  const xLabel = document.createElementNS(ns, 'text');
  xLabel.setAttribute('x', width / 2);
  xLabel.setAttribute('y', height - 16);
  xLabel.setAttribute('text-anchor', 'middle');
  xLabel.setAttribute('fill', '#c9c1b8');
  xLabel.textContent = 'NDVI – Vegetationsausprägung';
  svg.appendChild(xLabel);

  const yLabel = document.createElementNS(ns, 'text');
  yLabel.setAttribute('x', 18);
  yLabel.setAttribute('y', height / 2);
  yLabel.setAttribute('transform', `rotate(-90 18 ${height / 2})`);
  yLabel.setAttribute('text-anchor', 'middle');
  yLabel.setAttribute('fill', '#c9c1b8');
  yLabel.textContent = 'LST – Landoberflächentemperatur';
  svg.appendChild(yLabel);
}

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;

    const step = Number(entry.target.dataset.step);
    document.body.className = `step-${step}`;
    bigNumber.textContent = labels[step] || '';
    progressFill.style.width = `${((step + 1) / steps.length) * 100}%`;

    const view = views[step] || views[0];
    storyMap.flyTo(view.center, view.zoom, { duration: 1.35 });

    if (cityLayer) {
      if (step === 1) {
        cityLayer.setStyle(feature => {
          const district = feature.properties.district;
          return {
            color: 'rgba(255,255,255,.08)',
            weight: .35,
            fillColor: district === 'Mitte' ? '#7f0000' : colorByLST(Number(feature.properties.lst_18)),
            fillOpacity: district === 'Mitte' ? .86 : .28
          };
        });
      } else if (step === 2) {
        cityLayer.setStyle(feature => {
          const district = feature.properties.district;
          const isFocus = district === 'Mitte' || district === 'West';
          return {
            color: 'rgba(255,255,255,.08)',
            weight: .35,
            fillColor: district === 'West' ? '#176b54' : district === 'Mitte' ? '#a41414' : '#252825',
            fillOpacity: isFocus ? .78 : .13
          };
        });
      } else if (step === 3) {
        cityLayer.setStyle(feature => ({
          color: 'rgba(255,255,255,.08)',
          weight: .35,
          fillColor: feature.properties.district === 'West' ? '#ef6e39' : '#252825',
          fillOpacity: feature.properties.district === 'West' ? .82 : .12
        }));
      } else if (step === 5) {
        cityLayer.setStyle(feature => {
          const ndvi = Number(feature.properties.ndvi_18);
          const t = Math.max(0, Math.min(1, (ndvi - .05) / .4));
          return {
            color: 'rgba(255,255,255,.06)',
            weight: .3,
            fillColor: t > .66 ? '#0b5d2a' : t > .33 ? '#57a957' : '#a0522d',
            fillOpacity: .62
          };
        });
      } else {
        cityLayer.setStyle(feature => ({
          color: 'rgba(255,255,255,.08)',
          weight: .35,
          fillColor: colorByLST(Number(feature.properties.lst_18)),
          fillOpacity: .56
        }));
      }
    }
  });
}, { threshold: .58 });

steps.forEach(step => observer.observe(step));

window.addEventListener('scroll', () => {
  const story = document.getElementById('story');
  const rect = story.getBoundingClientRect();
  const total = story.offsetHeight - window.innerHeight;
  const progress = Math.max(0, Math.min(1, -rect.top / total));
  progressFill.style.width = `${progress * 100}%`;
}, { passive: true });
