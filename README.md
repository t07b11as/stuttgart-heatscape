# Hotspot Stuttgart

Interaktive Datenstory und Kartenanwendung zur räumlichen Verteilung urbaner Hitze in Stuttgart.

## Projektstruktur

- `index.html` – Scrollstory und Einstieg
- `styles.css` – Gestaltung der Scrollstory
- `main.js` – Interaktionen und Kartenlogik der Scrollstory
- `explorer.html` – interaktiver Heat Explorer
- `explorer.css` – isolierte Gestaltung des Explorers
- `explorer-v5.js` – Logik des Explorers
- `data/` – GeoJSON- und JSON-Daten für Gesamtstadt, Bezirke und Detailraster

## Lokaler Start

Da die Anwendung Daten mit `fetch()` lädt, sollte sie über einen lokalen Webserver gestartet werden:

```bash
python3 -m http.server 8000
```

Anschließend im Browser öffnen:

```text
http://localhost:8000
```

## Datenbasis

Die Temperatur-, SUHI- und NDVI-Raster stammen aus dem Forschungsdatensatz der LMU München:

Seeberg et al. (2022): *Evaluating the potential of Landsat satellite data to monitor the effectiveness of measures to mitigate urban heat islands: A case study for Stuttgart (Germany).*  
Open Data LMU: https://data.ub.uni-muenchen.de/325/

Die amtlichen Stadtbezirksgrenzen stammen aus der Kleinräumigen Gliederung der Landeshauptstadt Stuttgart.

## Methodischer Hinweis

Die dargestellte LST ist eine satellitengestützte Landoberflächentemperatur und keine Lufttemperatur. Der Heat Score ist eine projektspezifische Vergleichskennzahl und kein amtlicher Hitze- oder Gesundheitsindex.
