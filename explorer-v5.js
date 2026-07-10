const map = L.map('explorerMap', { zoomControl: false }).setView([48.7758, 9.1829], 11);

const streetLayer = L.tileLayer(
  'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
  {
    maxZoom: 19,
    opacity: .94,
    attribution: '&copy; OpenStreetMap &copy; CARTO'
  }
).addTo(map);

const satelliteLayer = L.tileLayer(
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  {
    maxZoom: 19,
    opacity: .92,
    attribution: 'Tiles &copy; Esri'
  }
);

L.control.zoom({ position: 'bottomright' }).addTo(map);

let period = '18';
let layerName = 'heat';
let activeDistrict = '';
let cityData = null;
let summaries = [];
let manifest = [];
let cityGridLayer = null;
let districtGridLayer = null;
let borderLayer = null;

const periodSelect = document.getElementById('periodSelect');
const layerSelect = document.getElementById('layerSelect');
const districtSelect = document.getElementById('districtSelect');
const basemapSelect = document.getElementById('basemapSelect');
const resolutionNote = document.getElementById('resolutionNote');
const districtCard = document.getElementById('districtCard');
const infoCard = document.getElementById('infoCard');
const legendLow = document.getElementById('legendLow');
const legendHigh = document.getElementById('legendHigh');
const legendGradient = document.getElementById('legendGradient');

const districtNames = [
  'Bad Cannstatt', 'Degerloch', 'Feuerbach', 'Mitte', 'Ost',
  'Süd', 'Untertürkheim', 'Vaihingen', 'West', 'Zuffenhausen'
];
districtNames.forEach(name => districtSelect.add(new Option(name, name)));

const definitions = {
  heat: 'Projektbezogener Vergleichsindex aus Landoberflächentemperatur, Wärmeinsel-Effekt und Vegetationsdefizit. Er ist keine gemessene Luft- oder gefühlte Temperatur.',
  lst: 'Die Landoberflächentemperatur beschreibt, wie warm die Erdoberfläche ist. Asphalt, Dächer oder Rasen können deutlich wärmer oder kühler als die Luft sein.',
  uhi: 'Eine städtische Hitzeinsel ist ein Gebiet, das sich gegenüber dem ländlichen Referenzraum stärker erwärmt – etwa durch Versiegelung, dichte Bebauung und wenig Vegetation.',
  ndvi: 'Der NDVI ist ein aus Satellitendaten berechneter Vegetationsindex. Höhere Werte weisen auf dichtere oder vitalere Vegetation hin.'
};

const domains = {
  heat: [0, 100],
  lst: [25, 50],
  uhi: [-8, 16],
  green: [0.00, 0.55],
  lst_change: [-5, 5],
  uhi_change: [-5, 5],
  green_change: [-0.15, 0.15]
};

function hexToRgb(hex) {
  const value = hex.replace('#', '');
  return {
    r: parseInt(value.slice(0, 2), 16),
    g: parseInt(value.slice(2, 4), 16),
    b: parseInt(value.slice(4, 6), 16)
  };
}

function rgbToHex({ r, g, b }) {
  return '#' + [r, g, b]
    .map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0'))
    .join('');
}

function interpolateColor(a, b, t) {
  const c1 = hexToRgb(a);
  const c2 = hexToRgb(b);
  return rgbToHex({
    r: c1.r + (c2.r - c1.r) * t,
    g: c1.g + (c2.g - c1.g) * t,
    b: c1.b + (c2.b - c1.b) * t
  });
}

function rampColor(t, stops) {
  const clamped = Math.max(0, Math.min(1, t));
  const scaled = clamped * (stops.length - 1);
  const index = Math.min(stops.length - 2, Math.floor(scaled));
  return interpolateColor(stops[index], stops[index + 1], scaled - index);
}

function selectedField() {
  if (period === 'change') {
    if (layerName === 'green') return 'ndvi_change';
    return `${layerName}_change`;
  }
  if (layerName === 'green') return `ndvi_${period}`;
  return `${layerName}_${period}`;
}

function selectedValue(props) {
  const value = Number(props[selectedField()]);
  return Number.isFinite(value) ? value : null;
}

function normalizedValue(props) {
  const value = selectedValue(props);
  if (value === null) return 0.5;

  let key = layerName;
  if (period === 'change') key = `${layerName}_change`;

  const [min, max] = domains[key];
  return Math.max(0, Math.min(1, (value - min) / (max - min)));
}

function fillColor(props) {
  const t = normalizedValue(props);

  if (period === 'change') {
    return rampColor(t, ['#1e5aa8', '#7fb8e8', '#f4f1ea', '#f08a74', '#a41414']);
  }

  if (layerName === 'green') {
    return rampColor(t, ['#8c2d1f', '#d98e32', '#e7dc67', '#57a957', '#0b5d2a']);
  }

  return rampColor(t, ['#176b54', '#f0d84f', '#f08a24', '#e53920', '#7f0000']);
}

function featureStyle(feature) {
  return {
    color: 'rgba(255,255,255,.22)',
    weight: activeDistrict ? .4 : .55,
    fillColor: fillColor(feature.properties),
    fillOpacity: basemapSelect.value === 'satellite' ? .64 : .78
  };
}

function classification(value) {
  if (value >= 67) return 'eine hohe';
  if (value >= 34) return 'eine mittlere';
  return 'eine geringe';
}

function tooltip(term, key) {
  return `${term}<span class="term-tip" tabindex="0" data-tip="${definitions[key]}">?</span>`;
}

function explanation(props) {
  const value = selectedValue(props);

  if (period === 'change') {
    const direction = value > 0 ? 'zugenommen' : value < 0 ? 'abgenommen' : 'sich kaum verändert';
    if (layerName === 'lst') {
      return `Die mittlere Landoberflächentemperatur hat ${direction} (${value > 0 ? '+' : ''}${value.toFixed(1)} °C).`;
    }
    if (layerName === 'uhi') {
      return `Der Hitzeinsel-Effekt hat ${direction} (${value > 0 ? '+' : ''}${value.toFixed(1)} °C).`;
    }
    return `Der mittlere NDVI-Wert hat ${direction} (${value > 0 ? '+' : ''}${value.toFixed(3)}).`;
  }

  if (layerName === 'heat') {
    return `Diese Zelle weist ${classification(value)} thermische Belastung im stadtweiten Vergleich auf.`;
  }
  if (layerName === 'lst') {
    return `Die mittlere Landoberflächentemperatur beträgt ${value.toFixed(1)} °C. Sie ist nicht mit Luft- oder gefühlter Temperatur gleichzusetzen.`;
  }
  if (layerName === 'uhi') {
    return `Der Hitzeinsel-Wert beträgt ${value.toFixed(1)} °C. Positive Werte zeigen eine stärkere Erwärmung gegenüber dem ländlichen Referenzraum.`;
  }
  return `Der NDVI beträgt ${value.toFixed(3)}. Höhere Werte stehen für stärkere Vegetationsausprägung.`;
}

function renderInfo(props) {
  const displayPeriod = period === 'change' ? '18' : period;
  const qualityNote = props.interpolated
    ? '<p class="quality-note">Hinweis: Diese Zelle enthält räumlich interpolierte Werte.</p>'
    : '';

  infoCard.innerHTML = `
    <h2>Rasterzelle ${props.cell_id}</h2>
    <p class="muted">${props.district || 'Stuttgart'} · ${activeDistrict ? '125 × 125 m' : '250 × 250 m'}</p>
    <div class="info-grid">
      <div class="kpi"><span>${tooltip('Heat Score', 'heat')}</span><strong>${period === 'change' ? '–' : props[`heat_${displayPeriod}`]}</strong></div>
      <div class="kpi"><span>${tooltip('Oberfläche', 'lst')}</span><strong>${Number(props[`lst_${displayPeriod}`]).toFixed(1)} °C</strong></div>
      <div class="kpi"><span>${tooltip('Hitzeinsel', 'uhi')}</span><strong>${Number(props[`uhi_${displayPeriod}`]).toFixed(1)} °C</strong></div>
      <div class="kpi"><span>${tooltip('NDVI', 'ndvi')}</span><strong>${Number(props[`ndvi_${displayPeriod}`]).toFixed(3)}</strong></div>
    </div>
    <p>${explanation(props)}</p>
    ${qualityNote}
  `;
}

function renderDistrictSummary(name) {
  const summary = summaries.find(item => item.district === name);
  if (!summary) return;

  const current = period === '06' ? '06' : '18';
  districtCard.innerHTML = `
    <h2>${name}</h2>
    <p>
      <strong>${Number(summary[`lst_${current}`]).toFixed(1)} °C</strong> mittlere Oberfläche ·
      <strong>${Number(summary[`uhi_${current}`]).toFixed(1)} °C</strong> Hitzeinsel-Effekt ·
      Heat Score <strong>${Number(summary[`heat_${current}`]).toFixed(0)}</strong>
    </p>
    <p class="muted">
      Veränderung 2004–2008 → 2016–2020:
      Oberfläche ${summary.lst_change >= 0 ? '+' : ''}${Number(summary.lst_change).toFixed(1)} °C ·
      UHI ${summary.uhi_change >= 0 ? '+' : ''}${Number(summary.uhi_change).toFixed(1)} °C ·
      NDVI ${summary.ndvi_change >= 0 ? '+' : ''}${Number(summary.ndvi_change).toFixed(3)}
    </p>
  `;
}

function bindGrid(data) {
  return L.geoJSON(data, {
    style: featureStyle,
    onEachFeature: (feature, layer) => {
      layer.on('mouseover', () => {
        layer.setStyle({ weight: 1.7, color: '#fff', fillOpacity: .92 });
        renderInfo(feature.properties);
      });
      layer.on('mouseout', () => {
        const activeLayer = districtGridLayer || cityGridLayer;
        if (activeLayer) activeLayer.resetStyle(layer);
      });
      layer.on('click', () => renderInfo(feature.properties));
    }
  });
}

function updateControls() {
  const heatOption = layerSelect.querySelector('option[value="heat"]');
  heatOption.disabled = period === 'change';

  if (period === 'change' && layerName === 'heat') {
    layerName = 'lst';
    layerSelect.value = 'lst';
  }

  const activeLayer = districtGridLayer || cityGridLayer;
  if (activeLayer) activeLayer.setStyle(featureStyle);

  if (period === 'change') {
    legendLow.textContent = 'Abnahme';
    legendHigh.textContent = 'Zunahme';
    legendGradient.style.background = 'linear-gradient(90deg,#1e5aa8,#7fb8e8,#f4f1ea,#f08a74,#a41414)';
  } else if (layerName === 'green') {
    legendLow.textContent = 'wenig Vegetation';
    legendHigh.textContent = 'viel Vegetation';
    legendGradient.style.background = 'linear-gradient(90deg,#8c2d1f,#d98e32,#e7dc67,#57a957,#0b5d2a)';
  } else {
    legendLow.textContent = 'niedrig';
    legendHigh.textContent = 'hoch';
    legendGradient.style.background = 'linear-gradient(90deg,#176b54,#f0d84f,#f08a24,#e53920,#7f0000)';
  }

  if (activeDistrict) renderDistrictSummary(activeDistrict);
}

function styleDistrictBorders(selectedName = '') {
  if (!borderLayer) return;
  borderLayer.eachLayer(layer => {
    const selected = layer.feature.properties.district === selectedName;
    layer.setStyle({
      color: basemapSelect.value === 'satellite'
        ? (selected ? '#ffffff' : '#dddddd')
        : (selected ? '#111111' : '#454545'),
      weight: selected ? 3 : 1.25,
      opacity: selected ? 1 : .55
    });
  });
}

async function showCity() {
  activeDistrict = '';

  if (districtGridLayer) {
    map.removeLayer(districtGridLayer);
    districtGridLayer = null;
  }

  if (!cityGridLayer) cityGridLayer = bindGrid(cityData).addTo(map);

  resolutionNote.textContent = 'Auflösung: 250 × 250 m';
  districtCard.innerHTML = '<p class="muted">Gesamtes Stadtgebiet.</p>';
  infoCard.innerHTML = '<p class="muted">Fahre über eine Rasterzelle.</p>';
  styleDistrictBorders('');
  map.fitBounds(cityGridLayer.getBounds(), { padding: [35, 35] });
  updateControls();
}

async function showDistrict(name) {
  activeDistrict = name;
  districtCard.innerHTML = `<p class="muted">Lade Detailraster für ${name} …</p>`;

  const item = manifest.find(entry => entry.district === name);
  if (!item) throw new Error(`Keine Detaildatei für ${name} gefunden.`);

  const response = await fetch(item.file);
  if (!response.ok) throw new Error(`Detailraster konnte nicht geladen werden (${response.status}).`);
  const data = await response.json();

  if (cityGridLayer) {
    map.removeLayer(cityGridLayer);
    cityGridLayer = null;
  }
  if (districtGridLayer) map.removeLayer(districtGridLayer);

  districtGridLayer = bindGrid(data).addTo(map);
  resolutionNote.textContent =
    `Auflösung: 125 × 125 m · ${item.cells} Zellen · ${item.interpolated_cells} interpoliert`;

  renderDistrictSummary(name);
  infoCard.innerHTML = '<p class="muted">Fahre über eine Detailzelle.</p>';
  styleDistrictBorders(name);
  map.fitBounds(districtGridLayer.getBounds(), { padding: [70, 70] });
  updateControls();
}

Promise.all([
  fetch('data/stuttgart-grid-placeholder.geojson').then(r => r.json()),
  fetch('data/stuttgart-districts.geojson').then(r => r.json()),
  fetch('data/district-summary.json').then(r => r.json()),
  fetch('data/district-manifest.json').then(r => r.json())
]).then(([grid, borders, summary, districtManifest]) => {
  cityData = grid;
  summaries = summary;
  manifest = districtManifest;

  cityGridLayer = bindGrid(cityData).addTo(map);
  borderLayer = L.geoJSON(borders, {
    style: { color: '#454545', weight: 1.25, fillOpacity: 0 },
    interactive: false
  }).addTo(map);

  map.fitBounds(cityGridLayer.getBounds(), { padding: [35, 35] });
  updateControls();
}).catch(error => {
  console.error(error);
  infoCard.innerHTML = `<p><strong>Fehler:</strong> ${error.message}</p>`;
});

periodSelect.addEventListener('change', event => {
  period = event.target.value;
  updateControls();
});

layerSelect.addEventListener('change', event => {
  layerName = event.target.value;
  updateControls();
});

districtSelect.addEventListener('change', async event => {
  try {
    if (!event.target.value) await showCity();
    else await showDistrict(event.target.value);
  } catch (error) {
    console.error(error);
    districtCard.innerHTML = `<p><strong>Fehler:</strong> ${error.message}</p>`;
  }
});

basemapSelect.addEventListener('change', event => {
  if (event.target.value === 'satellite') {
    map.removeLayer(streetLayer);
    satelliteLayer.addTo(map);
  } else {
    map.removeLayer(satelliteLayer);
    streetLayer.addTo(map);
  }
  const activeLayer = districtGridLayer || cityGridLayer;
  if (activeLayer) activeLayer.bringToFront().setStyle(featureStyle);
  if (borderLayer) borderLayer.bringToFront();
  styleDistrictBorders(activeDistrict);
});

const dialog = document.getElementById('methodDialog');
document.getElementById('methodBtn').addEventListener('click', () => dialog.showModal());
document.getElementById('closeMethod').addEventListener('click', () => dialog.close());
