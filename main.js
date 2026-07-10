const storyMap = L.map('storyMap', {
  zoomControl: false,
  dragging: false,
  scrollWheelZoom: false,
  doubleClickZoom: false,
  boxZoom: false,
  keyboard: false,
  attributionControl: false
}).setView([48.7758, 9.1829], 12);

L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
  maxZoom: 19
}).addTo(storyMap);

const views = [
  { center: [48.7758, 9.1829], zoom: 12 },
  { center: [48.7784, 9.1800], zoom: 13 },
  { center: [48.7920, 9.2320], zoom: 13 },
  { center: [48.8030, 9.1690], zoom: 12 },
  { center: [48.7758, 9.1829], zoom: 11 }
];

const steps = document.querySelectorAll('.step');
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const step = Number(entry.target.dataset.step);
    document.body.className = `step-${step}`;
    const view = views[step] || views[0];
    storyMap.flyTo(view.center, view.zoom, { duration: 1.2 });
  });
}, { threshold: 0.55 });

steps.forEach(step => observer.observe(step));
