# zazawoods-esstisch-konfigurator-de  `[DE]`

3D-Esstisch-Konfigurator für den **deutschen** Shop **zazawoods.de** (Shopify-Store
`zazawood.myshopify.com`, Admin: admin.shopify.com/store/zazawood).
Der NL-Klon für zazawoods.nl lebt in `zazawoods/zazawoods-eettafel-configurator-nl`
(eigenes Railway-Projekt `zazawoods-configurator-nl`) — dieses Repo bleibt
ausschließlich DE. Engine-Änderungen hier machen und in den NL-Klon portieren
(dort nur `locale.js`, `config.js`, `index.html`, Produktdaten anders).

**Wer hier arbeitet (Mensch oder KI-Agent): erst diese Datei + das neueste
`HANDOFF/HANDOFF_*.md` lesen.**

## Deployment (Produktion)

- **GitHub:** `zazawoods/zazawoods-esstisch-konfigurator-de`, Branch `main` ist die Wahrheit.
- **Railway:** Projekt `zazawoods-konfigurator-de`, Service `zazawoods-esstisch-konfigurator-de`.
  Jeder Push auf `main` deployt automatisch (~60–90 s).
- **Prod-URL:** https://zazawoods-esstisch-konfigurator-production.up.railway.app
  (Domain absichtlich unverändert gelassen — sie ist im Shopify-Theme von
  zazawoods.de eingebettet, siehe `docs/*.liquid`.)
- `BUILD_VERSION` steht in **6 Stellen** und muss bei JEDEM Deploy zusammen
  geändert werden (neues 8-hex, global ersetzen — am einfachsten
  `grep -rn "<alte-version>" configurator/` und alle Treffer ersetzen):
  `js/config.js:7`, `index.html` (styles.css?v=, modulepreload config.js?v=,
  app.js?v=), `app.js` (import config.js?v= und import shopify.js?v=).
  Das Inline-Prefetch-Skript in `index.html` liest die Version aus dem
  modulepreload-Link und braucht keine eigene Änderung.

## Architektur (Kurzfassung)

- Statisches Frontend (`configurator/`), Express-Server (`server.js`), three.js 0.162
  vom CDN (importmap in `index.html`), Draco-Decoder lokal (`configurator/js/draco/`).
- **Beine** sind Meshes IN den Form-GLBs (`glb files tables and legs/*.glb`) —
  Discovery in `app.js → discoverModelParts`, Anzeigenamen über `nameMap`.
  Zusätzliche Standalone-Beine liegen in `external-legs/` und sind in
  `EXTERNAL_LEG_FILES` registriert (Titel → Datei). Externe Beine, die aus
  UNSEREN GLBs extrahiert wurden, brauchen KEINE 90°-Rotation → siehe
  `isX_alignedSat` in app.js.
- **Grid** = Union aller `addons.Tischgestell` aus `zw-products.json` (statisch
  im Repo, aus dem Shop generiert) + `CATALOG_ONLY_LEGS` (app.js). Karte-Titel
  → 3D-Modell über `ZW_LEG_MODEL_MAP`. Ausschlüsse: `LEG_TITLE_EXCLUDE`,
  per-Form/Größe: `HIDE_LEGS_BY_SHAPE_LENGTH`, Round hat eine Whitelist
  (`isRoundOnly`).
- **Preis/Warenkorb:** `updatePrice()` löst Titel → Variant/Preis über das
  Produkt der aktuellen Form auf, mit Fallback auf CATALOG_ONLY_LEGS und
  UNION-Fallback über alle Formen (Audit-Fix 2026-08-30 — ohne ihn blockierte
  der Warenkorb auf Oval). Warenkorb = Shopify-Permalink `zazawoods.de/cart/…`.
- **Swatches** der Beinkarten: `configurator/Swatches/Onderstel/<Titel>.png`
  (Holz, farbig) bzw. `<Titel>_bw.png` (Metall, s/w-Foto), ≤400 px.

## Mobile-Performance (eingebaut 2026-08-30)

1. Google-Fonts-CSS lädt non-blocking (media=print-Swap) — ein blockierendes
   Stylesheet verzögert sonst auch die Modul-Skripte.
2. `index.html` startet einen **GLB-Prefetch** der Start-Form parallel zum
   JS-Boot (`window.__glbPrefetch`), `loadGLTF()` konsumiert ihn.
3. Externe Bein-GLBs (18 Stück) laden beim Kaltstart **verzögert/gestaffelt**
   (`_deferredExtLoads`), außer dem per URL gewählten Bein.
4. Nach dem ersten Load werden die GLBs der übrigen Formen im Leerlauf in den
   HTTP-Cache geholt (`_warmOtherShapes`, Dateien sind immutable/1 Jahr).
5. `modelCache` hält geparste GLTFs pro Form; Pixel-Ratio ist auf 2 gekappt.

## Testen (Pflicht vor jedem Deploy)

Headless Chromium (swiftshader) + Playwright; das CDN three@0.162.0 ist aus
Containern oft nicht erreichbar → Routen auf lokale npm-Dateien umbiegen.
Rezept: `/configurator/?shape=X` laden, warten bis `#loader` die Klasse
`hidden` hat, ALLE `.leg-option`-Karten klicken, prüfen: `state.zwLegName`
synchron, `_selectedVariants.leg` = korrekte Variant-ID, Preis-Badge, Konsole
leer; Screenshot über `renderer.domElement.toDataURL`. Alle 7 Formen fahren.
Für Überstand-Audits: Bein-Vertices gegen die konvexe Hülle der Platte messen
(Vorlage: Session-Skripte `fulltest.js` / Audit vom 2026-08-30 im HANDOFF).

## Shopify-Konventionen (DE)

- Addon-Beine = Typ `Tischgestell`, Tags `addon, legs`, **„Continue selling
  when out of stock" = ON**, Preis = Aufpreis; Neuanlage per **Duplizieren von
  „Thorn Tischgestelle (Satz)"** (Produkt 10159918514442). Duplikate erben die
  Collection „Tischgestell addons list" (Widget der Tischseiten).
- Login-Hinweis: im Browser können zwei Shopify-Konten stecken — immer
  **Nisar Derbaj (info@zazawoods.nl)** wählen, nie info@tablekings.de.
