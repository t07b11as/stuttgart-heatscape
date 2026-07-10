const map = L.map('explorerMap', { zoomControl: false }).setView([48.7758, 9.1829], 12);

L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
  maxZoom: 19,
  attribution: '&copy; OpenStreetMap &copy; CARTO'
}).addTo(map);

L.control.zoom({ position: 'bottomright' }).addTo(map);

let selectedLayer = 'heat';
let gridLayer;
const infoCard = document.getElementById('infoCard');

function valueFor(props) {
  if (selectedLayer === 'lst') return props.lst_base;
  if (selectedLayer === 'uhi') return props.uhi_c;
  if (selectedLayer === 'green') return props.green_score;
  return props.heat_score;
}

function normalizedValue(props) {
  if (selectedLayer === 'lst') return Math.max(0, Math.min(100, (props.lst_base - 28) / 18 * 100));
  if (selectedLayer === 'uhi') return Math.max(0, Math.min(100, (props.uhi_c + 5) / 20 * 100));
  return valueFor(props);
}

function colorScale(value, layer) {
  if (layer === 'green') {
    return value > 66 ? '#2f8f62' : value > 33 ? '#b9b84f' : '#e06b36';
  }
  return value > 66 ? '#e34a2e' : value > 33 ? '#f5c04f' : '#2f8f62';
}

function styleFeature(feature) {
  const value = normalizedValue(feature.properties);
  return {
    color: 'rgba(255,255,255,.16)',
    weight: 0.65,
    fillColor: colorScale(value, selectedLayer),
    fillOpacity: 0.68
  };
}

function interpretation(score) {
  if (score >= 67) return 'hoch';
  if (score >= 34) return 'mittel';
  return 'niedrig';
}

function renderInfo(props) {
  infoCard.innerHTML = `
    <h2>Rasterzelle ${props.cell_id}</h2>
    <p class="muted">250 × 250 m · Datenmittel 2016–2020</p>
    <div class="info-grid">
      <div class="kpi"><span>Heat Score</span><strong>${props.heat_score}</strong></div>
      <div class="kpi"><span>Oberfläche</span><strong>${Number(props.lst_base).toFixed(1)} °C</strong></div>
      <div class="kpi"><span>Wärmeinsel</span><strong>${Number(props.uhi_c).toFixed(1)} °C</strong></div>
      <div class="kpi"><span>Grünindex</span><strong>${props.green_score}</strong></div>
    </div>
    <p><strong>Einordnung:</strong> ${interpretation(props.heat_score)} thermische Belastung im stadtweiten Vergleich.</p>
    <p class="muted">Landoberflächentemperatur ist nicht identisch mit Lufttemperatur oder gefühlter Temperatur.</p>
    <p class="muted">${props.topography_note}</p>
  `;
}

function updateGrid() {
  if (gridLayer) gridLayer.setStyle(styleFeature);
}

fetch('data/stuttgart-grid-placeholder.geojson')
  .then(res => {
    if (!res.ok) throw new Error(`GeoJSON konnte nicht geladen werden (${res.status})`);
    return res.json();
  })
  .then(data => {
    gridLayer = L.geoJSON(data, {
      style: styleFeature,
      onEachFeature: (feature, layer) => {
        layer.on('mouseover', () => {
          layer.setStyle({ weight: 1.8, color: 'white', fillOpacity: .84 });
          renderInfo(feature.properties);
        });
        layer.on('mouseout', () => gridLayer.resetStyle(layer));
        layer.on('click', () => renderInfo(feature.properties));
      }
    }).addTo(map);
    map.fitBounds(gridLayer.getBounds(), { padding: [40, 40] });
  })
  .catch(err => {
    console.error(err);
    infoCard.innerHTML = `<p><strong>Fehler:</strong> ${err.message}</p>`;
  });

document.getElementById('layerSelect').addEventListener('change', e => {
  selectedLayer = e.target.value;
  updateGrid();
});

const dialog = document.getElementById('methodDialog');
document.getElementById('methodBtn').addEventListener('click', () => dialog.showModal());
document.getElementById('closeMethod').addEventListener('click', () => dialog.close());
