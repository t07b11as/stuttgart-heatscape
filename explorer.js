const map = L.map('explorerMap', { zoomControl: false }).setView([48.7758, 9.1829], 12);

L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
  maxZoom: 19,
  attribution: '&copy; OpenStreetMap &copy; CARTO'
}).addTo(map);

L.control.zoom({ position: 'bottomright' }).addTo(map);

const monthFactor = { june: -4, july: 0, august: -1 };
const timeFactor = { 6: -18, 12: -2, 15: 0, 18: -5, 22: -13 };

let selectedLayer = 'heat';
let selectedMonth = 'july';
let selectedTime = '15';
let gridLayer;

const infoCard = document.getElementById('infoCard');

function getValue(props) {
  if (selectedLayer === 'green') return props.green_score;
  if (selectedLayer === 'sealed') return props.sealed_score;
  return Math.max(0, Math.min(100, props.heat_score + monthFactor[selectedMonth] + timeFactor[selectedTime]));
}

function colorScale(value, layer) {
  if (layer === 'green') {
    return value > 65 ? '#2f8f62' : value > 38 ? '#b9b84f' : '#e06b36';
  }
  if (layer === 'sealed') {
    return value > 70 ? '#e34a2e' : value > 45 ? '#f5c04f' : '#2f8f62';
  }
  return value > 72 ? '#e34a2e' : value > 48 ? '#f5a742' : '#2f8f62';
}

function styleFeature(feature) {
  const value = getValue(feature.properties);
  return {
    color: 'rgba(255,255,255,.18)',
    weight: 1,
    fillColor: colorScale(value, selectedLayer),
    fillOpacity: 0.58
  };
}

function renderInfo(props) {
  const heat = Math.round(props.heat_score + monthFactor[selectedMonth] + timeFactor[selectedTime]);
  const lst = (props.lst_base + monthFactor[selectedMonth]*0.18 + timeFactor[selectedTime]*0.12).toFixed(1);
  infoCard.innerHTML = `
    <h2>${props.district}</h2>
    <p class="muted">Rasterzelle ${props.cell_id} · ${document.querySelector('#monthSelect option:checked').textContent} · ${selectedTime}:00 Uhr</p>
    <div class="info-grid">
      <div class="kpi"><span>Heat Score</span><strong>${Math.max(0, Math.min(100, heat))}</strong></div>
      <div class="kpi"><span>Oberfläche</span><strong>${lst} °C</strong></div>
      <div class="kpi"><span>Grünindex</span><strong>${props.green_score}</strong></div>
      <div class="kpi"><span>Versiegelung</span><strong>${props.sealed_score}%</strong></div>
    </div>
    <p><strong>Einordnung:</strong> Modellierter Prototypwert. Hohe Versiegelung und niedriger Grünindex erhöhen die thermische Belastung.</p>
    <p class="muted">Datenqualität: ${props.confidence}</p>
  `;
}

function updateGrid() {
  if (!gridLayer) return;
  gridLayer.setStyle(styleFeature);
}

fetch('data/stuttgart-grid-placeholder.geojson')
  .then(res => res.json())
  .then(data => {
    gridLayer = L.geoJSON(data, {
      style: styleFeature,
      onEachFeature: (feature, layer) => {
        layer.on('mouseover', () => {
          layer.setStyle({ weight: 2, color: 'white', fillOpacity: .78 });
          renderInfo(feature.properties);
        });
        layer.on('mouseout', () => gridLayer.resetStyle(layer));
        layer.on('click', () => renderInfo(feature.properties));
      }
    }).addTo(map);
    map.fitBounds(gridLayer.getBounds(), { padding: [40, 40] });
  });

document.getElementById('monthSelect').addEventListener('change', e => {
  selectedMonth = e.target.value;
  updateGrid();
});
document.getElementById('timeSelect').addEventListener('change', e => {
  selectedTime = e.target.value;
  updateGrid();
});
document.getElementById('layerSelect').addEventListener('change', e => {
  selectedLayer = e.target.value;
  updateGrid();
});

const dialog = document.getElementById('methodDialog');
document.getElementById('methodBtn').addEventListener('click', () => dialog.showModal());
document.getElementById('closeMethod').addEventListener('click', () => dialog.close());
