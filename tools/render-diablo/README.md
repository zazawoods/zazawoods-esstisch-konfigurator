# Produktrender „Konische Holzsäule aus Stäbchenholz, Eiche" (intern: Diablo)

Erzeugt die 6 Produktfotos (`configurator/Swatches/Product renders/Konische Holzsaeule
Staebchenholz Eiche {1..6}.jpg`) und daraus das Karten-Swatch
(`configurator/Swatches/Onderstel/Konische Holzsäule aus Stäbchenholz, Eiche.png`, 400 px,
= Ansicht 1, 72 % Center-Crop) im Stil der Bogade-Renders von Runde/Ovale Holzsäule.

- `render.html`: three.js-Szene. Misst das Konfigurator-GLB (`external-legs/Konische
  Holzsaeule.glb`, Boden 89×64, oben ~69×50, 72 cm) und baut daraus einen parametrischen
  **gerillten** (Stäbchenholz) elliptischen Kegelstumpf (96 Stäbe), Eiche-Natural-Textur
  aus `configurator/textures/oak/`, schwarze Montageplatte, weißer Studioboden mit weichem
  Schatten, RoomEnvironment.
- `shoot.js <size> '[views…]'`: startet einen Mini-Static-Server (:3299), rendert headless
  (swiftshader) und schreibt `out/<name>.png`. Standard-Ansichten: cam1 (32°/14°) … cam6.
  Pfade zu three (`harness/node_modules/three`) und Repo oben im Skript anpassen.

Hinweis: Das Konfigurator-GLB selbst ist glatt (Column-in-Middle-Mesh aus rectangle.glb,
keine Rillen) — nur die Produktfotos/Swatch zeigen Stäbchenholz.
