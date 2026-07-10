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
  { center: [48.7760, 9.1830], zoom: 13.3 },
  { center: [48.7740, 9.1635], zoom: 12.6 },
  { center: [48.7730, 9.1500], zoom: 13.0 },
  { center: [48.7758, 9.1829], zoom: 11.0 },
  { center: [48.7758, 9.1829], zoom: 11.2 },
  { center: [48.7758, 9.1829], zoom: 10.8 }
];

const bigNumber = document.getElementById('bigNumber');
const progressFill = document.getElementById('progressFill');
const steps = [...document.querySelectorAll('.step')];

const labels = ['11/11', '', '', '', '', '', ''];
let cityLayer = null;

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
  })
  .catch(() => {});

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
