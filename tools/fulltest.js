// Full grid test: for each shape, click every leg card, verify variant + price + no console errors.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const THREE_DIR = path.join(__dirname, 'node_modules/three'); // npm i three@0.162.0 in tools/

const NEW_LEGS = {
  'Aeris Tischgestell':            { variantId: '53598108975370', price: 19500 },
  'Butterfly Tischgestell (Satz)': { variantId: '53598132175114', price: 17500 },
  'Vario Tischgestell':            { variantId: '53598115856650', price: 24500 },
  'Doppel V-Tischgestell':         { variantId: '53598118412554', price: 22500 },
  'Felix Tischgestell':            { variantId: '53598124540170', price: 22000 },
  'Konische Holzsäule aus Stäbchenholz, Eiche': { variantId: '53602745778442', price: 52000 },
};

const BASE = process.argv[3] || 'http://localhost:3210';
const SHOT_DIR = process.argv[4] || 'out/fulltest';

(async () => {
  const shapes = (process.argv[2] || 'rectangle,oval,danish-oval,round,organic,bootsform,halfrond').split(',');
  fs.mkdirSync(SHOT_DIR, { recursive: true });
  const browser = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-certificate-errors']
  });
  let failures = 0;
  for (const shape of shapes) {
    const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
    const errors = [];
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    page.on('pageerror', e => errors.push('PAGEERROR ' + e.message));
    // Prod host unreachable from Chromium directly — fetch via curl (uses egress proxy).
    const { execFile } = require('child_process');
    if (BASE.startsWith('https://')) {
      const host = new URL(BASE).host;
      await page.route(u => u.host === host, route => {
        execFile('curl', ['-sS', '-i', '--max-time', '120', route.request().url()],
          { encoding: 'buffer', maxBuffer: 100 * 1024 * 1024 }, (err, stdout) => {
            if (err) return route.fulfill({ status: 502, body: '' });
            // split headers/body on first \r\n\r\n (skip 1xx blocks)
            let buf = stdout;
            let idx;
            while (true) {
              idx = buf.indexOf('\r\n\r\n');
              const head = buf.slice(0, idx).toString('latin1');
              if (/^HTTP\/\d(\.\d)? 1\d\d/.test(head) || /Connection Established/i.test(head)) { buf = buf.slice(idx + 4); continue; }
              break;
            }
            const head = buf.slice(0, idx).toString('latin1');
            const body = buf.slice(idx + 4);
            const status = parseInt(head.match(/^HTTP\/\d(?:\.\d)? (\d+)/)[1], 10);
            const ctm = head.match(/^content-type:\s*(.+)$/im);
            route.fulfill({ status, contentType: ctm ? ctm[1].trim() : 'application/octet-stream', body });
          });
      });
    }
    await page.route(/cdn\.jsdelivr\.net\/npm\/three@0\.162\.0\/(.*)/, route => {
      const rel = route.request().url().match(/three@0\.162\.0\/([^?]*)/)[1];
      const f = path.join(THREE_DIR, rel);
      if (fs.existsSync(f)) route.fulfill({ path: f, contentType: 'application/javascript' });
      else route.fulfill({ status: 404, body: '' });
    });
    await page.goto(`${BASE}/configurator/?shape=${shape}`, { timeout: 90000 });
    await page.waitForFunction(() => document.querySelector('#loader')?.classList.contains('hidden'), null, { timeout: 120000 });
    await page.waitForTimeout(5000); // let external legs land

    const cards = await page.evaluate(() =>
      [...document.querySelectorAll('#leg-grid .leg-option, .leg-grid .leg-option, .leg-option')].map(b => ({
        title: b.querySelector('.leg-name')?.textContent.trim(),
        noModel: b.classList.contains('no-model'),
        price: b.querySelector('.leg-price')?.textContent.trim() || ''
      }))
    );
    console.log(`\n=== ${shape}: ${cards.length} cards`);
    const noModel = cards.filter(c => c.noModel);
    if (noModel.length) { console.log('  FAIL no-model cards:', noModel.map(c => c.title)); failures++; }

    for (let i = 0; i < cards.length; i++) {
      const r = await page.evaluate(async (i) => {
        const btns = [...document.querySelectorAll('.leg-option')];
        const b = btns[i];
        const title = b.querySelector('.leg-name')?.textContent.trim();
        b.click();
        await new Promise(res => setTimeout(res, 900));
        const c = window._configurator;
        return { title, zw: c.state.zwLegName, leg: c._selectedVariants?.leg || null,
                 visible: c.legObjects.filter(l => l.object.visible).map(l => l.displayName) };
      }, i);
      const exp = NEW_LEGS[r.title];
      if (r.zw !== r.title) { console.log(`  FAIL click "${r.title}" -> zwLegName "${r.zw}"`); failures++; continue; }
      if (exp) {
        const ok = String(r.leg) === exp.variantId;
        const priceOk = cards[i].price === `+€${exp.price / 100}`;
        console.log(`  ${ok && priceOk ? 'OK ' : 'FAIL'} ${r.title}: variant=${r.leg} badge="${cards[i].price}" visible=${r.visible.join('|')}`);
        if (!ok || !priceOk) failures++;
        const data = await page.evaluate(() => { const c = window._configurator; c.renderer.render(c.scene, c.camera); return c.renderer.domElement.toDataURL('image/png'); });
        fs.writeFileSync(path.join(SHOT_DIR, `${shape}__${r.title.replace(/[^\w\- ()]/g, '_')}.png`), Buffer.from(data.split(',')[1], 'base64'));
      }
    }
    const realErrors = errors.filter(e => !/ERR_CONNECTION_RESET|ERR_CONNECTION_REFUSED|Failed to load resource/.test(e));
    if (realErrors.length) { console.log('  FAIL console errors:', realErrors.slice(0, 5)); failures++; }
    else console.log(`  console clean (${errors.length} ignorable network msgs)`);
    await page.close();
  }
  console.log(failures ? `\nFAILURES: ${failures}` : '\nALL PASS');
  await browser.close();
  process.exit(failures ? 1 : 0);
})();
