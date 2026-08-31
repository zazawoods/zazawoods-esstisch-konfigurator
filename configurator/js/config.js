// Zaza Woods Esstisch-Konfigurator — Configuration Data

const BASE_PATH = '..';

// Single cache-bust across the whole app — bumped by the deploy script so all
// static assets (JS, images, GLBs) invalidate together. Never edit by hand.
export const BUILD_VERSION = 'e2b6a7c3';

export const TABLE_SHAPES = [
  {
    id: 'rectangle',
    name: 'Rechteck',
    shopifyHandle: 'rechteckiger-esstisch-milano-aus-massiver-eichenholz-mit-baumstammkanten',
    glbFile: `${BASE_PATH}/glb files tables and legs/rectangle.glb`,
    icon: `<img src="Swatches/Vorm/Rechteck_bw.png?v=${BUILD_VERSION}" alt="Rechteck"/>`,
    meshPrefix: ['rectangle', 'Rectangle'],
    defaultLength: 240,
    defaultWidth: 100,
    lengths: [180, 200, 220, 240, 260, 280, 300, 350, 400],
    widths: [100]
  },
  {
    id: 'oval',
    name: 'Oval',
    shopifyHandle: 'ovaler-esstisch-danilo-aus-massiver-eichenholz-mit-schweizer-kante',
    glbFile: `${BASE_PATH}/glb files tables and legs/Oval.glb`,
    icon: `<img src="Swatches/Vorm/Oval_bw.png?v=${BUILD_VERSION}" alt="Oval"/>`,
    meshPrefix: ['Oval'],
    defaultLength: 240,
    defaultWidth: 120,
    fixedDimensions: [
      [180, 90], [200, 100], [220, 100], [240, 120],
      [260, 120], [280, 120], [300, 120], [350, 120], [400, 120]
    ]
  },
  {
    id: 'danish-oval',
    name: 'Halboval',
    // Retied to the "Halbovaler Esstisch (White 5%)" Shopify product per user
    // request. Base variant IDs live in zw-products.json under this same key.
    shopifyHandle: 'ovaler-esstisch-white-5-aus-massivem-eichenholz',
    glbFile: `${BASE_PATH}/glb files tables and legs/DanishOval.glb`,
    icon: `<img src="Swatches/Vorm/DanishOval_bw.png?v=${BUILD_VERSION}" alt="Halboval"/>`,
    meshPrefix: ['Danish_Oval', 'Danish'],
    defaultLength: 240,
    defaultWidth: 120,
    // Exactly the 9 sizes sold on the ZW product page.
    fixedDimensions: [
      [180, 90], [200, 100], [220, 100], [240, 120],
      [260, 120], [280, 120], [300, 120], [350, 120], [400, 120]
    ]
  },
  {
    id: 'round',
    name: 'Rund',
    shopifyHandle: 'runder-esstisch-romano-aus-massiver-eichenholz',
    glbFile: `${BASE_PATH}/glb files tables and legs/Round.glb`,
    icon: `<img src="Swatches/Vorm/Rund_bw.png?v=${BUILD_VERSION}" alt="Rund"/>`,
    meshPrefix: ['Round'],
    excludeLegs: ['Rondo'],
    defaultLength: 140,
    defaultWidth: 140,
    lockAspect: true,
    lengths: [100, 110, 120, 130, 140, 150, 160, 170, 180]
  },
  {
    id: 'organic',
    name: 'Organisch',
    shopifyHandle: 'esstisch-milano-aus-massivem-eichenholz-mit-baumstammkanten-copy',
    glbFile: `${BASE_PATH}/glb files tables and legs/Organic.glb`,
    icon: `<img src="Swatches/Vorm/Organisch_bw.png?v=${BUILD_VERSION}" alt="Organisch"/>`,
    meshPrefix: ['Organic'],
    defaultLength: 240,
    defaultWidth: 120,
    fixedDimensions: [
      [200, 100], [220, 110], [240, 120],
      [260, 130], [280, 140], [300, 140]
    ]
  },
  {
    id: 'bootsform',
    name: 'Bootsform',
    shopifyHandle: 'bootsform-esstisch-sergio-aus-massivem-eichenholz',
    glbFile: `${BASE_PATH}/glb files tables and legs/Bootsform.glb`,
    icon: `<img src="Swatches/Vorm/Bootsform_bw.png?v=${BUILD_VERSION}" alt="Bootsform"/>`,
    meshPrefix: ['bootsform_', 'Bootsform_'],
    defaultLength: 240,
    defaultWidth: 110,
    // Match Shopify variants exactly — 350/400 sold at width 120, not 140.
    fixedDimensions: [
      [180, 100], [200, 100], [220, 100], [240, 110],
      [260, 120], [280, 120], [300, 120], [350, 120], [400, 120]
    ]
  },
  {
    id: 'halfrond',
    name: 'Halbrund',
    shopifyHandle: 'halbkreisform-esstisch-aus-massivem-eichenholz',
    glbFile: `${BASE_PATH}/glb files tables and legs/Halfrond.glb`,
    icon: `<img src="Swatches/Vorm/Halbrund_bw.png?v=${BUILD_VERSION}" alt="Halbrund"/>`,
    meshPrefix: ['Halfrond'],
    defaultLength: 240,
    defaultWidth: 100,
    lengths: [180, 200, 220, 240, 260, 280, 300, 350, 400],
    widths: [90, 100, 110]
  }
];

export const MATERIAL_TYPES = {
  oak: {
    id: 'oak',
    name: 'Eiche',
    thickness: 4,
    roughness: 0.72,
    metalness: 0.0,
    colors: [
      { id: 'natural',     name: 'Natural',     file: `${BASE_PATH}/configurator/textures/oak/1-oil-plus-2c-oak-natural.jpg`, swatchImg: `${BASE_PATH}/configurator/textures/oak-swatch/1-oil-plus-2c-oak-natural.jpg`,     swatch: '#c8a96e' },
      { id: 'cocoa',       name: 'Cocoa',       file: `${BASE_PATH}/configurator/textures/oak/2-oil-plus-2c-oak-cocoa.jpg`, swatchImg: `${BASE_PATH}/configurator/textures/oak-swatch/2-oil-plus-2c-oak-cocoa.jpg`,       swatch: '#6b4c3b' },
      { id: 'deep-black',  name: 'Deep Black',  file: `${BASE_PATH}/configurator/textures/oak/deep-black.jpg`, swatchImg: `${BASE_PATH}/configurator/textures/oak-swatch/deep-black.jpg`,                   swatch: '#1a1a1a' },
      { id: 'mist',        name: 'Mist',        file: `${BASE_PATH}/configurator/textures/oak/3-oil-plus-2c-oak-mist-5.jpg`, swatchImg: `${BASE_PATH}/configurator/textures/oak-swatch/3-oil-plus-2c-oak-mist-5.jpg`,      swatch: '#b5a899' },
      { id: 'vanilla',     name: 'Vanilla',     file: `${BASE_PATH}/configurator/textures/oak/4-oil-plus-2c-oak-vanilla.jpg`, swatchImg: `${BASE_PATH}/configurator/textures/oak-swatch/4-oil-plus-2c-oak-vanilla.jpg`,     swatch: '#d4c5a9' },
      { id: 'pure',        name: 'Pure',        file: `${BASE_PATH}/configurator/textures/oak/5-oil-plus-2c-oak-pure-copy.jpg`, swatchImg: `${BASE_PATH}/configurator/textures/oak-swatch/5-oil-plus-2c-oak-pure-copy.jpg`, swatch: '#dcc99d' },
      { id: 'macchiato',   name: 'Macchiato',   file: `${BASE_PATH}/configurator/textures/oak/7-oil-plus-2c-oak-macchiato.jpg`, swatchImg: `${BASE_PATH}/configurator/textures/oak-swatch/7-oil-plus-2c-oak-macchiato.jpg`,   swatch: '#8b6f52' },
      { id: 'charcoal',    name: 'Charcoal',    file: `${BASE_PATH}/configurator/textures/oak/10-oil-plus-2c-oak-charcoal.jpg`, swatchImg: `${BASE_PATH}/configurator/textures/oak-swatch/10-oil-plus-2c-oak-charcoal.jpg`,   swatch: '#3a3632' },
      { id: 'shell-grey',  name: 'Shell Grey',  file: `${BASE_PATH}/configurator/textures/oak/8-oil-plus-2c-oak-shell-grey.jpg`, swatchImg: `${BASE_PATH}/configurator/textures/oak-swatch/8-oil-plus-2c-oak-shell-grey.jpg`,  swatch: '#9e9589' },
      { id: 'walnut',      name: 'Walnut',      file: `${BASE_PATH}/configurator/textures/oak/9-oil-plus-2c-oak-walnut.jpg`, swatchImg: `${BASE_PATH}/configurator/textures/oak-swatch/9-oil-plus-2c-oak-walnut.jpg`,      swatch: '#5c4033' },
      { id: 'chocolate',   name: 'Chocolate',   file: `${BASE_PATH}/configurator/textures/oak/chocolate.jpg`, swatchImg: `${BASE_PATH}/configurator/textures/oak-swatch/chocolate.jpg`,                    swatch: '#6b5544' },
      { id: 'white5',      name: 'White 5%',    file: `${BASE_PATH}/configurator/textures/oak/white-5.jpg`, swatchImg: `${BASE_PATH}/configurator/textures/oak-swatch/white-5.jpg`,                      swatch: '#c8b48a' },
      { id: 'yakisugi',    name: 'Yakisugi',    file: `${BASE_PATH}/configurator/textures/oak/yakisugi.jpg`, swatchImg: `${BASE_PATH}/configurator/textures/oak-swatch/yakisugi.jpg`,                     swatch: '#1e1e1e', roughness: 0.92, bumpScale: 0.015 }
    ]
  },
  ceramic: {
    id: 'ceramic',
    name: 'Keramik',
    thickness: 2,
    thicknessOptions: [1.2, 2],
    roughness: 0.35,
    metalness: 0.05,
    colors: [
      { id: 'calacatta-black',    name: 'Calacatta Black (Satin)',    file: `${BASE_PATH}/configurator/textures/ceramic/calacatta-black-lux.jpg`,       swatch: '#1a1a1a', finish: 'satin', thicknesses: [1.2, 2] },
      { id: 'crema-marfil',       name: 'Crema Marfil (Satin)',       file: `${BASE_PATH}/configurator/textures/ceramic/crema-marfil-satin.jpg`,        swatch: '#e8d5b8', finish: 'satin', thicknesses: [1.2] },
      { id: 'elegant-black',      name: 'Elegant Black (Satin)',      file: `${BASE_PATH}/configurator/textures/ceramic/elegant-black-satin.jpg`,       swatch: '#2a2a2a', finish: 'satin', thicknesses: [1.2] },
      { id: 'emperador',          name: 'Emperador (Lux)',            file: `${BASE_PATH}/configurator/textures/ceramic/emperador-lux.jpg`,             swatch: '#5c3d2e', finish: 'lux', thicknesses: [1.2] },
      { id: 'fior-di-bosco',      name: 'Fior di Bosco (Satin)',      file: `${BASE_PATH}/configurator/textures/ceramic/fior-di-bosco-satin.jpg`,       swatch: '#6a6a68', finish: 'satin', landscape: true, thicknesses: [1.2] },
      { id: 'golden-white-lux',   name: 'Golden White (Lux)',         file: `${BASE_PATH}/configurator/textures/ceramic/golden-white-lux.jpg`,          swatch: '#f0e8d8', finish: 'lux', thicknesses: [1.2] },
      { id: 'golden-white-satin', name: 'Golden White (Satin)',       file: `${BASE_PATH}/configurator/textures/ceramic/golden-white-satin.jpg`,        swatch: '#ede5d5', finish: 'satin', thicknesses: [1.2] },
      { id: 'jade',               name: 'Jade (Lux)',                 file: `${BASE_PATH}/configurator/textures/ceramic/jade-lux.jpg`,                  swatch: '#8a9a7a', finish: 'lux', landscape: true, thicknesses: [1.2] },
      { id: 'onice-avorio',       name: 'Onice Avorio (Lux)',         file: `${BASE_PATH}/configurator/textures/ceramic/onice-avorio-lux.jpg`,          swatch: '#f5edd5', finish: 'lux', thicknesses: [1.2] },
      { id: 'onice-beige',        name: 'Onice Beige (Lux)',          file: `${BASE_PATH}/configurator/textures/ceramic/onice-beige-lux.jpg`,           swatch: '#d4c4a0', finish: 'lux', thicknesses: [1.2] },
      { id: 'onice-giada',        name: 'Onice Giada (Lux)',          file: `${BASE_PATH}/configurator/textures/ceramic/onice-giada-lux.jpg`,           swatch: '#4a7a5a', finish: 'lux', thicknesses: [1.2] },
      { id: 'onice-nero',         name: 'Onice Nero (Lux)',           file: `${BASE_PATH}/configurator/textures/ceramic/onice-nero-lux.jpg`,            swatch: '#1e1e1e', finish: 'lux', thicknesses: [1.2] },
      { id: 'patagonia',          name: 'Patagonia (Lux)',            file: `${BASE_PATH}/configurator/textures/ceramic/patagonia-lux.jpg`,             swatch: '#8a7060', finish: 'lux', thicknesses: [1.2] },
      { id: 'pulpis',             name: 'Pulpis (Lux)',               file: `${BASE_PATH}/configurator/textures/ceramic/pulpis-lux.webp`,               swatch: '#4a3a2e', finish: 'lux', landscape: true, thicknesses: [1.2] },
      { id: 'silver-root',        name: 'Silver Root Marble (Satin)', file: `${BASE_PATH}/configurator/textures/ceramic/silver-root-marble-satin.jpg`,  swatch: '#c0b8a8', finish: 'satin', landscape: true, thicknesses: [1.2] },
      { id: 'sodalite-blue',      name: 'Sodalite Blue (Lux)',        file: `${BASE_PATH}/configurator/textures/ceramic/sodalite-blue-lux.jpg`,         swatch: '#2a3a6a', finish: 'lux', thicknesses: [1.2] },
      { id: 'statuario',          name: 'Statuario (Satin)',          file: `${BASE_PATH}/configurator/textures/ceramic/statuario-satin.jpg`,           swatch: '#f5f2ed', finish: 'satin', thicknesses: [1.2, 2] },
      { id: 'tafu',               name: 'Tafu (Satin)',               file: `${BASE_PATH}/configurator/textures/ceramic/tafu-satin.jpg`,                swatch: '#d8cfc0', finish: 'satin', thicknesses: [1.2] },
      { id: 'taj-mahal',          name: 'Taj Mahal (Lux)',            file: `${BASE_PATH}/configurator/textures/ceramic/taj-mahal-lux.jpg`,             swatch: '#c8a870', finish: 'lux', thicknesses: [1.2, 2] },
      { id: 'travertino',         name: 'Travertino (Satin)',         file: `${BASE_PATH}/configurator/textures/ceramic/travertino-satin.webp`,         swatch: '#d5c8b0', finish: 'satin', landscape: true, thicknesses: [1.2, 2] },
      { id: 'verde-aver',         name: 'Verde Aver (Lux)',           file: `${BASE_PATH}/configurator/textures/ceramic/verde-aver-lux.jpg`,            swatch: '#3a5a3a', finish: 'lux', thicknesses: [1.2] }
    ]
  }
};

export const EDGE_OPTIONS = [
  { id: 'standaard', name: 'Gerade Kante',     description: 'Klassische gerade Kante' },
  { id: 'facet',     name: 'Schweizer Kante',  description: 'Charakteristische Schweizer Kante', onlyMaterial: ['oak'] },
  { id: 'boomstam',  name: 'Baumstammkante',   description: 'Natürliche Baumstammkante',         onlyMaterial: ['oak'], onlyShapes: ['rectangle'] }
];

export const POWDER_COAT_COLORS = [
  { id: 'black',        name: 'Schwarz',          swatch: '#1a1a1a' },
  { id: 'anthracite',   name: 'Anthrazit',      swatch: '#3d3d3d' },
  { id: 'bronze',       name: 'Bronze',          swatch: '#6b5a3e' },
  { id: 'champagne',    name: 'Champagner',      swatch: '#c9b98a' },
  { id: 'white',        name: 'Weiß',            swatch: '#f5f5f0' }
];

export const DEFAULT_STATE = {
  shape: 'rectangle',
  materialType: 'oak',
  color: 'natural',
  length: 240,
  width: 100,
  height: 76,
  edge: 'standaard',
  powderCoat: 'black',
  variant: 'a'
};
