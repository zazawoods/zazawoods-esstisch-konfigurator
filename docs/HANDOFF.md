# Zaza Woods — Esstisch-Konfigurator · Technische Übergabe

> Stand: nach dem ersten kompletten Esstisch-Rewrite (Commit `04ebe53`).
> Dieses Dokument MUSS nach jeder substantiellen Code-Änderung aktualisiert werden.

## Was das ist

3D-Konfigurator für Esstische auf zazawoods.de.

- **Repo**: <https://github.com/zazawoods/zazawoods-esstisch-konfigurator>
- **Railway-Service**: `zazawoods-esstisch-konfigurator`
- **Public URL**: <https://zazawoods-esstisch-konfigurator-production.up.railway.app>
- **Auto-Deploy**: jeder Push nach `main` → Railway baut & deployt.

Eigenständig vom Picknick-Konfigurator
(<https://github.com/zazawoods/zazawoods-picknick-konfigurator>, der den
Picknicktisch und den Gartentisch bedient). Die beiden teilen sich nur
das visuelle Design — keine geteilten Code-Abhängigkeiten.

## Domänen-Logik (was wird konfiguriert)

Vier Achsen, alle unabhängig:

| Achse           | Anzahl | Quelle (catalog.json) |
|-----------------|--------|------------------------|
| **Form**        | 9      | `shapes[]`             |
| **Gestell**     | 38     | `legs[]`               |
| **Länge**       | je Form (4–9) | `shapes[].lengths[]` |
| **Holzfinish**  | 14     | `finishes[]`           |

Theoretisch ergibt das ~38 000 Kombinationen. In der Praxis sind nicht alle
Gestelle in jedem Form-GLB physisch enthalten (siehe Abschnitt "Geometrie").

### `catalog.json` (Single Source of Truth)

Liegt im Repo-Root. Beim Page-Load via `fetch('catalog.json')` geladen.
Schema:

```json
{
  "shapes":   [{ "key", "name", "file", "lengths": [180,200,…] }],
  "legs":     [{ "key", "name", "file", "nodeMatch" }],
  "finishes": [{ "key", "name", "file" }]
}
```

- `shape.file` → `assets/shapes/<file>` (GLB)
- `leg.file` → `assets/legs/<file>` (GLB, derzeit ungenutzt — siehe unten)
- `leg.nodeMatch` → Substring, mit dem die Mesh-Namen im Form-GLB
  durchsucht werden, um nur dieses Gestell sichtbar zu machen.
- `finish.file` → `assets/textures/<file>` (JPG, Tile-fähig).

Aktuelle Werte:
- 9 Formen: rectangle, oval, danishOval, verbaan, boogvorm, halfrond,
  kiezel, organic, round
- 38 Gestelle: x_modern, x_shape, v_shape, a_shape, u_shape, butterfly,
  spider, conisch, blok, base, hapa, matrix, japandi, diagonal_pole,
  pilaar, pillars, klassiek, schuin, schuin25, thore, triple, walrus,
  stative, vn, flat_v, flach_stahl, hairpin, demi_lune, gerond, cris_cross,
  halve_plus, tapse_spin, twist, vierpoot, kolom_oval, kolom_plus,
  kolom_rod, 4legs_pole
- 14 Finishes: 10 aus der OIL_PLUS_2C_OAK-Serie (Natural, Cocoa, Mist 5,
  Vanilla, Pure, Golden Hour, Macchiato, Shell Grey, Walnut, Charcoal)
  + 4 Spezial (Chocolate, Deep Black, White 5%, Yakisugi)

## Repo-Struktur

```
.
├── index.html              ← der gesamte Konfigurator (single page, 734 LOC)
├── catalog.json            ← Katalog-Daten
├── server.js               ← Express-Server (von Picknick übernommen, AR-Upload-Endpoints)
├── package.json
├── railway.json            ← Railway-Build-Hint
├── ar.html                 ← QR-Redirect-Seite (für Desktop-AR-Flow, noch nicht aktiv)
├── ar-generator.html       ← Pre-baking-Tool für AR-GLBs (von Picknick, derzeit nicht aktiv)
├── assets/
│   ├── shapes/             ← 9 GLB-Dateien, eine pro Form (~12 MB / Datei)
│   ├── legs/               ← 38 GLB-Dateien (Standalone-Gestelle, derzeit ungenutzt)
│   └── textures/           ← 14 JPG-Holzfinishes (~1.5 MB / Datei)
└── docs/
    └── HANDOFF.md          ← DAS HIER
```

**Gesamtgröße ~135 MB.** GitHub-Limit pro Datei ist 100 MB — größte
Datei ist ~12 MB (Form-GLBs), passt. Repo-Total ist groß, aber Railway
buildet schnell durch.

## Architektur — `index.html` in 734 Zeilen

Single-File-Aufbau, weil das den Deployment- und Embed-Pfad
maximal einfach hält.

```
Zeile  ~ 1 –   10   <head>, viewport, Switzer-Font-Preconnect
Zeile  ~11 – 343   inline-CSS  (verbatim vom Picknick-Konfigurator)
Zeile ~344 – 415   <body>: Viewer + Aside (Panel) + AR-Modal
Zeile ~416 – 425   importmap (three@0.160 + addons)
Zeile ~426 – 734   <script type="module"> mit der gesamten App-Logik
```

### JS-Module — Sektionen (in Reihenfolge im Datei)

1. **Renderer/Scene-Setup**
   - WebGLRenderer, sRGB, ACES, DPR ≤ 2, preserveDrawingBuffer (für Save)
   - PMREMGenerator + RoomEnvironment → realistic wood reflections
   - Boden-Disc + Ambient + Directional Light

2. **Camera + Controls**
   - Perspective 35°, near 0.1, far 100
   - 4 Breakpoints für initiale Kamera-Position (mobil → 4K)
   - OrbitControls mit Damping, `enableZoom = false` (wir nutzen eigenen Zoom)
   - Smooth-Wheel-Zoom (exponential lerp, `ZOOM_LERP = 0.18`)
   - 2-Finger-Pinch-Zoom für Touch (Capture-Phase, `stopPropagation`,
     damit OrbitControls den Pan nicht stört)

3. **Catalog & State**
   - `CATALOG` (gefüllt von `loadCatalog()` aus `catalog.json`)
   - `state = { shape, leg, length, finish }`
   - `currentRoot` = aktiv eingebundene Form-Scene (THREE-Object3D)
   - `shapeCache` = `{ key → loaded scene }` (LRU-frei, derzeit unlimited)
   - `textureCache` = `{ key → THREE.Texture }`

4. **Loader**
   - `loadShape(key)` → fetcht Form-GLB, cached. Zeigt Loader-Bar.
   - `setActiveShape(key)` → ersetzt `currentRoot`, normalisiert,
     ruft `applyState()` auf.
   - `normalizeShape(root)` → erkennt Einheiten anhand `bbox.y`:
     - `> 500` → Millimeter → `scale = 0.001`
     - `> 5`  → Zentimeter → `scale = 0.01`
     - sonst → Meter, kein Scale
     Hintergrund: 8 Form-GLBs sind in mm, **Round.glb** ist in cm,
     **die Standalone-Legs** wären in Metern. Heuristik kompensiert das.

5. **Visibility-Filter (`applyState`)**
   - Jedes Form-GLB enthält die Platte **und alle Gestell-Varianten
     bereits vorpositioniert** (Mesh-Knoten heißen
     z. B. `Verbaan_X_Modern_LEG_90_100_110_240`).
   - Pro Mesh: Name zu lowercase, prüfe ob Name `leg.nodeMatch`
     enthält → Gestell-Familie. Extrahiere Längen-Suffix (`_240` oder
     `_240.001`) → Längen-Filter.
   - **Tischplatten** (Name enthält `table_top`/`tabletop`) werden
     immer gezeigt, gefiltert nur nach Länge.
   - **Gestelle** werden gezeigt nur wenn beide Bedingungen erfüllt.
   - **Fallback**: wenn nach diesem Filter 0 Meshes übrig sind
     (Längen-Tag fehlt im File), zeige alle Meshes mit passender
     `nodeMatch` an, ignoriere Länge.

6. **Recenter**
   - Nach jeder Sichtbarkeitsänderung: Box3 über sichtbare Meshes,
     verschiebe `currentRoot` so dass X/Z-Mitte auf 0 und Y-min auf 0.

7. **Finish-System (`ensureTexture` + `applyFinish`)**
   - `ensureTexture(key)` → lädt aus `assets/textures/`, cached.
   - `applyFinish()` → iteriert über sichtbare Meshes, identifiziert
     "holzige" Materialien (`m.map` vorhanden ODER `m.color` warm),
     setzt `m.map = tex` und `m.color = white`.
   - **Achtung**: Materialien aus dem GLB werden ÜBERSCHRIEBEN.
     Das Original `m.map` geht verloren — kein Issue, weil die
     UV-Tiling-Skala in den Source-Materialien gleich ist.

8. **Übersicht**
   - `updateOverzicht()` füllt 6 DOM-Spans aus state.

9. **Chip-Builder**
   - `chip(label, isOn, onClick)` → erzeugt einen Button.
   - `buildShapeChips()`, `buildLegChips()`, `buildLengthChips()`,
     `buildFinishChips()` rendern die Panel-Sektionen.
   - Bei Form-Wechsel wird `state.length` auf nächste passende
     Länge gesnappt (falls die aktuelle Länge im neuen Form nicht
     existiert) und die Length-Chips neu gerendert.

10. **Animation Loop** + **Init** + **Accordion-Toggle** (Klick auf
    `.acc-head` schaltet `.open`).

### Was NICHT (mehr) drin ist (vs. Picknick)

- Backrest- und Bench-Sektionen (nur Picknick-relevant)
- W/X/U-Set-Modell (nur Picknick-relevant)
- Shopify-Variant-Mapping, Preise, Add-to-Cart
- Wizard-Onboarding (kann nachträglich hinzugefügt werden)
- AR (zurückgesetzt, kommt im nächsten Commit zurück)
- Save / Share / Dimensions-Buttons (Icons sind im UI, Logik fehlt noch)

## Was als Nächstes geplant ist (Roadmap)

- [ ] AR-Export wieder einbauen (`buildExportScene` adaptieren, Y=0-bake
      Strategie übernehmen, single-flight, model-ready promise)
- [ ] Shape ↔ Leg-Kompatibilitätsmatrix in `catalog.json` (welche
      Gestelle existieren in welchem Form-GLB)
- [ ] Standalone-Legs (`assets/legs/*.glb`) integrieren, wenn ein
      gewünschtes Gestell nicht im aktuellen Form-GLB gebacken ist
- [ ] Save / Share / Dimensions Buttons
- [ ] Wizard-Onboarding (4 Schritte: Form → Gestell → Länge → Finish)
- [ ] Embed-Snippet + Shopify-Liquid-Section (`konfigurator-embed.liquid`
      und `selbst-erstellen-button.liquid` analog zu Picknick)
- [ ] Mobile-Polish (iOS Safe-Area auf Panel-Foot, Camera-Justierung)
- [ ] DRACO-Kompression der Form-GLBs (12 MB → ~1.5 MB)

## Bekannte Schwachstellen / TODO

- **Material-Heuristik**: `applyFinish` erkennt Holz "weichlich" anhand
  Map-Existenz oder Farbe. Wenn ein GLB einen schwarzen Stahl-Beleg mit
  Map hat, würde er fälschlich Holz-Textur bekommen. Lösung: explizite
  Material-Name-Blacklist (`stahl`, `metal`, `steel`, `iron`).
- **Visibility-Filter**: derzeit greift der Längen-Tag nicht auf allen
  Files (manche haben `_240`, andere `_240.001`, der Regex behandelt
  beides, aber Files ohne Tag fallen durchs Raster). Fallback ist drin,
  zeigt dann alle passenden Gestelle — ggf. mehrfach übereinander.
- **Performance**: 12 MB GLBs blockieren ~1-3 s auf 4G. Lazy-Load
  hilft, aber DRACO/Meshopt-Compression wäre der nächste Win.

## Entwicklung & Deployment

### Setup

```bash
git clone https://github.com/zazawoods/zazawoods-esstisch-konfigurator.git
cd zazawoods-esstisch-konfigurator
npm install
npm start  # → http://localhost:3000
```

### Commit & Deploy

```bash
git add ...
git commit -m "..."
git push origin main
```

Railway baut automatisch und tauscht das Production-Image binnen
~60-90 s aus. Status: <https://railway.com/project/ad56d8b8-…>

### Diese Datei AKTUELL halten

Wenn du, KI von morgen, irgendwas an `index.html`, `catalog.json`,
`server.js` oder Asset-Pipeline änderst:
1. Mach die Änderung.
2. **Update diesen HANDOFF.md** (welche Sektion betroffen, was sich
   verhalten ändert).
3. Beide zusammen committen.
4. Push zur main.

Inkonsistente Doku = später viel verlorene Zeit.

## Quick-Reference

| Aufgabe                          | Datei                | Zeile (ca.) |
|----------------------------------|---------------------|-------------|
| Neue Form hinzufügen             | `catalog.json`      | `shapes[]`  |
| Neues Gestell hinzufügen         | `catalog.json`      | `legs[]`    |
| Neuen Finish hinzufügen          | `catalog.json` + Textur in `assets/textures/` | – |
| Mesh-Filter justieren            | `index.html`        | `applyState()` |
| Skalen-Erkennung anpassen        | `index.html`        | `normalizeShape()` |
| Materialerkennung verbessern     | `index.html`        | `applyFinish()` |
| Kamera-Position für Breakpoint   | `index.html`        | Block ab "PerspectiveCamera" |
| Panel-Sektionen umbenennen       | `index.html`        | `<aside class="panel">` |
| Server-Endpoints (AR-Upload)     | `server.js`         | – |

---

## Update — Commit `54ccb03`+ (Mesh-Filter überarbeitet)

Vorheriger Filter benutzte `nodeMatch` als naive Substring-Suche. Das
führte zu zwei Bugs:

1. **Duplikate**: bei Spider-Legs gab es zwei Mesh-Varianten in den
   GLBs — `Konische_spider_-_WOOD_…` (Holz-Material) und
   `Konische_Spider_…` (Metall). Substring "konische" matchte beide
   → Doppelgänger-Beine.
2. **Unerwünschte Co-Treffer**: `nodeMatch: "Schuin"` matchte BEIDE
   `Schuin_-_WOOD` (klassisch) und `Schuin_25_-_WOOD` (Schuin 2.5 Voet).

Neue Architektur:

- **`extractLegSeg(name)`**: normalisiert einen Mesh-Namen in eine
  vergleichbare Leg-Segment-Form (lowercase, ohne Shape-Prefix,
  Längen-Suffix, `_-_WOOD`-Decorator, mesh-split-Indizes).
- **`legCfg.nodeMatches`**: ist jetzt ein Array exakter Segment-Strings.
  Das Mesh wird angezeigt, wenn `extractLegSeg(name)` einen der
  Werte exakt trifft.
- **Wood-Dedup**: existieren für die ausgewählte Leg Mesh-Varianten mit
  und ohne `_-_WOOD`-Suffix, wird nur die nicht-Wood-Variante gezeigt.

`catalog.json` wurde von den **realen** Mesh-Namen aller 9 Shape-GLBs
neu aufgebaut. **40 Gestelle** (vorher 38) — die zusätzlichen sind
`fluted`, `double_fluted`, `column_middle`, `half_spider`. Entfernt:
`u_shape` (gab es im 3D-Material nie).


---

## Update — Commit `fa03ecf`+ (Preis & CTA wieder eingebaut)

Panel-Foot wurde 1:1 vom Picknick-Konfigurator übernommen:
**ÜBERSICHT** (2 Zeilen Zusammenfassung) → **total-row** mit
"Gesamtbetrag: (inkl. kostenlose Lieferung)" + Euro-Wert →
**CTA-Button** "Anfrage senden".

### Preis-Formel

```
price = shape.basePrice
      + (state.length - 200) × shape.pricePerCm
      + leg.surcharge?
      + finish.surcharge?
```

- `shape.basePrice` und `shape.pricePerCm` sind PFLICHT in `catalog.json`
- `leg.surcharge` und `finish.surcharge` sind OPTIONAL
- Baseline-Länge: 200 cm

Aktuelle Werte (alle in EUR, Platzhalter — vom Kunden tunen lassen):

| Form         | base | /cm |
|--------------|------|-----|
| rectangle    | 1200 | 5.0 |
| oval         | 1300 | 5.0 |
| danishOval   | 1400 | 5.5 |
| verbaan      | 1300 | 5.0 |
| boogvorm     | 1500 | 6.0 |
| halfrond     | 1350 | 5.5 |
| kiezel       | 1500 | 6.0 |
| organic      | 1700 | 7.0 |
| round        | 1100 | 8.0 |

Leg-Aufschläge: Spider 200 · Halb-Spider 150 · Hapa 300 · Base 400 ·
Walrus 200 · Pillars 250 · Pilaar 200 · Matrix 250 · Butterfly 150 ·
Kolom Plus 200 · Kolom Rod 200 · Kolom Oval 250 · Fluted 350 · Double Fluted 450

Finish-Aufschläge: Yakisugi 150 · Deep Black 100 · Chocolate 80 · White 5% 80

### CTA-Button "Anfrage senden"

Da Shopify noch nicht verdrahtet ist, öffnet der CTA einen
`mailto:info@zazawoods.de` mit vorausgefülltem Subject + Body
(Form, Gestell, Länge, Finish, Preis, Deep-Link zur Konfiguration).

---

## Update — Commit `017e63d`+ (Finish-Chips mit Holz-Vorschau)

Holzfinish-Chips zeigen jetzt einen runden **Swatch** mit der echten
JPG-Textur aus `assets/textures/<file>` — analog zum Material-Picker im
Picknick-Konfigurator.

- Neue CSS-Variante `.chip-finish` + `.swatch` (kreisrunder
  Hintergrund mit `background-image`).
- `buildFinishChips()` rendert `<button class="chip chip-finish">
  <span class="swatch" style="background-image: url(...)"></span>
  <span>Label</span></button>`.
- Bei `.on`-Zustand bekommt der Swatch einen 2-px-Brand-Ring per
  `box-shadow: inset 0 0 0 2px var(--brand)`.

---

## Update — Commit `5c41eba`+ (Holzfinish auf Tischplatte tatsächlich sichtbar)

Vorher waren Tischplatten visuell grau — die GLBs der Tischplatten
exportieren KEINE UV-Koordinaten (`uvCount = 0`). Ohne UVs kann
Three.js eine Textur überhaupt nicht auf die Geometrie projizieren,
also blieb das Material grau, egal welcher Finish gewählt war.

Fix in zwei Teilen:

1. **`ensurePlanarUVs(root)`** — wird einmal pro geladenes Shape-GLB
   in `setActiveShape()` aufgerufen. Iteriert alle Meshes; wenn UV
   fehlt, generiert eine planare XZ-Top-Down-Projektion über die
   lokale Bounding-Box. Wood-Texturen werden so von oben auf die
   Tischplatte projiziert — wie es ein Hobler in der Werkstatt machen
   würde.

2. **`applyFinish()`** überarbeitet:
   - **Tischplatten werden IMMER als Holz behandelt** (Bypass der
     Color-Heuristik), Namen-Match `/table_top|tabletop/`.
   - **Material-Name-Blacklist**: enthält der Material-Name `metal`,
     `steel`, `stahl`, `chrom` oder `iron`, wird die Textur nicht
     angewandt (verhindert versehentliches "Holz auf Stahl-Spider").
   - **Per-Mesh-geklontes Texture-Objekt** (`tex.clone()`) damit
     `tex.repeat` individuell gesetzt werden kann. Wir zielen auf
     ~1 Holzmaserung-Kachel pro Meter → realistisches Aussehen statt
     stark gestreckter Maserung.
   - **`metalness = 0`, `roughness = 0.7`** wird zwangsgesetzt, damit
     Tischplatten nicht aussehen wie poliertes Metall.

Folge: ALLE Tischplatten zeigen jetzt die gewählte Holzfinish-Textur,
die Maserung wird realistisch gekachelt, der gewählte Finish ist
unmittelbar im Vorschau-3D-Modell sichtbar.

---

## Update — Commit `402dc47`+ (UI 1:1 mit Picknick / Bogade)

Letzte sichtbare Unterschiede zum Picknick-Konfigurator beseitigt:

- **CTA-Text**: "Anfrage senden" → **"In den Warenkorb legen"** (gleicher
  Wortlaut wie auf zazawoods.de und im Picknick-Konfigurator).
- **Übersicht-Format**: jetzt im Picknick-Stil
  - Zeile 1: `<Form> · Eichenholz · <Finish>`
  - Zeile 2: `<L> × <B> × <H> cm` (z. B. `260 × 100 × 76 cm`)
- **`catalog.json` erweitert**: jede Shape hat jetzt `width` und `height`
  (in cm) für die Anzeige in der Übersicht.

Die CSS, Akkordeon-Struktur, Chip-Stile, Panel-Breite und Farben waren
schon vorher identisch zum Picknick (verbatim CSS-Kopie). Nur Texte und
Übersicht-Formatierung waren noch unterschiedlich.

---

## Update — Commit `88c2540`+ (Holzmaserung tatsächlich sichtbar)

User-Bericht: Tischplatte sieht "wie gestrichener Kunststoff" aus —
flat-coloured, no grain visible. Live-Inspektion via `window.__zw`:

- `hasMap: true`, `hasUV: true`, `metalness: 0`, `roughness: 0.7` ✓
- 5.1 % der Canvas-Pixel sind holz-toned (Bereich x:188-523, y:153-330) ✓
- Aber das Holz erscheint als FLAT BROWN — keine Maserung.

Ursache: **`tex.repeat = (260, 90)`**. Der Künstler hat die Geometrie
in **Zentimeter-Einheiten** gespeichert, aber dem Szenen-Graph einen
Scale von 0.01 gegeben, sodass die Welt-Bbox stimmt (~2.4 m). Mein
`tex.repeat`-Code benutzte aber die LOKAL-Bbox (cm-Zahlen) und
multiplizierte mit `currentRoot.scale.x`. Resultat: 260 Wiederholungen
auf 2.4 m → GPU-Mipmap nimmt das kleinste Level → Mittelwert der
Textur = flacher brauner Farbton.

Fix: berechne die **Welt-Bbox** des Meshes via
`Box3().setFromObject(mesh)`. Damit ist `sx` direkt in Metern, egal
welche Skalen das Parent-Hierarchie hat. Repeat = (1, 1) bis (3, 2) je
nach Tisch-Größe — Maserung wird klar erkennbar.

---

## Update — Commit `68d3be8`+ (Holzmaserung um 90° gedreht)

Per User-Wunsch wird die Holz-Textur jetzt um 90° gedreht:
- `tex.center.set(0.5, 0.5)` (drehen um Mittelpunkt der Textur)
- `tex.rotation = Math.PI / 2`
- `tex.repeat.set(szw, sxw)` (U/V vertauscht — passt zur Rotation)

Effekt: die Holzmaserung läuft jetzt entlang der KURZEN Achse der
Tischplatte (Breite) statt entlang der Länge.
