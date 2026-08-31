# tools/ — Test- und Audit-Skripte

Headless-Tests mit Playwright + Chromium (SwiftShader-WebGL). Einmalig:
`npm i playwright three@0.162.0` in diesem Ordner (das CDN three@0.162.0 ist aus
Containern oft nicht erreichbar, die Skripte biegen es auf `node_modules/three` um).
`executablePath` in den Skripten ggf. auf das lokale Chromium anpassen.

- `fulltest*.js <shapes> <baseUrl> [outDir]` — klickt auf jeder Form JEDE
  Bein-Karte, prüft Titel-Sync, Variant-ID, Preis-Badge, Konsole. Beispiel:
  `node tools/fulltest.js rectangle,oval http://localhost:3000`
- `overhang_audit.js <shapes> <baseUrl> [schwelle_cm]` — misst pro Bein × Größe
  die Bein-Vertices gegen die konvexe Hülle der Tischplatte (Überstand in cm).
  Beispiel: `node tools/overhang_audit.js round http://localhost:3000 0.5`
- (NL) `scrape_nl_products.py` — erzeugt `zw-products.json` aus dem NL-Shop.

Lokalen Server starten: `PORT=3000 node server.js`.
