// Serves render.html + three + textures + glb on :3299, shoots views into out/
const http = require('http'), fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const ROOT = '/home/claude/zazawoods-esstisch-konfigurator';
const MAP = { '/three/': '/home/claude/harness/node_modules/three/', '/draco/': ROOT + '/configurator/js/draco/', '/glb/': ROOT + '/glb files tables and legs/', '/tex/': ROOT + '/configurator/textures/oak/' };
const MIME = { '.js': 'application/javascript', '.html': 'text/html', '.jpg': 'image/jpeg', '.png': 'image/png', '.glb': 'model/gltf-binary', '.wasm': 'application/wasm' };
const srv = http.createServer((req, res) => {
  let url = decodeURIComponent(req.url.split('?')[0]); let f = null;
  if (url === '/' || url === '/render.html') f = path.join(__dirname, 'render.html');
  for (const k in MAP) if (url.startsWith(k)) f = path.join(MAP[k], url.slice(k.length));
  if (!f || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res);
}).listen(3299);
const SIZE = parseInt(process.argv[2] || '1600');
const VIEWS = JSON.parse(process.argv[3] || 'null') || [
  { n: 'cam1', az: 32, el: 14, dist: 3.1, fov: 30 },
  { n: 'cam2', az: 40, el: 32, dist: 3.0, fov: 30 },
  { n: 'cam3', az: 90, el: 12, dist: 3.1, fov: 30 },
  { n: 'cam4', az: -35, el: 18, dist: 3.1, fov: 30 },
  { n: 'cam5', az: 0, el: 8, dist: 3.2, fov: 30 },
  { n: 'cam6', az: 60, el: 45, dist: 3.0, fov: 30 },
];
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: SIZE, height: SIZE } });
  page.on('console', m => console.log('[page]', m.text())); page.on('pageerror', e => console.log('[pageerror]', e.message));
  await page.goto(`http://localhost:3299/render.html?size=${SIZE}`);
  for (let i = 0; i < 120; i++) { await page.waitForTimeout(1000); if (await page.evaluate(() => !!window.__ready).catch(() => false)) break; }
  console.log('dims', JSON.stringify(await page.evaluate(() => window.__dims)));
  fs.mkdirSync(path.join(__dirname, 'out'), { recursive: true });
  for (const v of VIEWS) {
    const data = await page.evaluate(v => window.__shoot(v.az, v.el, v.dist, v.fov, v.ty), v);
    fs.writeFileSync(path.join(__dirname, 'out', `${v.n}.png`), Buffer.from(data.split(',')[1], 'base64'));
    console.log('shot', v.n);
  }
  await browser.close(); srv.close();
})();
