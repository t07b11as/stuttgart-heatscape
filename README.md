# Stuttgart Heatscape MVP

Erster lauffähiger Prototyp für das INME-Projekt.

## Enthalten
- `index.html`: Scrollstory mit sticky Karte
- `explorer.html`: Heat Explorer mit Leaflet-Karte
- `data/stuttgart-grid-placeholder.geojson`: Platzhalter-Raster für Stuttgart
- `styles.css`, `main.js`, `explorer.js`

## Wichtig
Die aktuellen Werte sind bewusst Platzhalterdaten.
Sie zeigen nur die Interaktion und technische Struktur.
Im nächsten Schritt werden echte Datenquellen integriert:
- Landsat Land Surface Temperature
- UHI / SUHI
- NDVI
- Versiegelungsdaten
- Stadtklimadaten Stuttgart

## Starten
Ordner lokal öffnen und über einen kleinen Server starten, z.B.:

python3 -m http.server 8000

Dann öffnen:
http://localhost:8000
