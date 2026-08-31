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
- `sizetest.js <baseUrl> <shopDomain> [shapes]` — klickt auf jeder Form JEDE
  Größe, prüft dass die gewählte Basis-Variante im Shop existiert und der
  angezeigte Gesamtpreis = Shop-Preis (+ Addon-Preise) ist. Liest den Katalog
  aus `/tmp/de_p*.json` bzw. `/tmp/nl_p*.json` (= `https://<shop>/products.json?limit=250&page=N`,
  vorher herunterladen — das Storefront-JSON blockt wiederholte Direktaufrufe).
  Beispiel: `node tools/sizetest.js http://localhost:3000 zazawoods.de`
- (NL) `scrape_nl_products.py` — erzeugt `zw-products.json` aus dem NL-Shop.

Lokalen Server starten: `PORT=3000 node server.js`.
