// Size/price grid test: for each shape click every size button, read the
// selected base variant + displayed total, and compare with the shop's
// storefront JSON (variant price + selected addon prices).
// usage: node sizetest.js <base-url> <shop-domain> [shapes]
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { execFile, execFileSync } = require('child_process');
const THREE_DIR = path.join(__dirname, 'node_modules/three'); // npm i three@0.162.0 in tools/
const BASE = process.argv[2] || 'http://localhost:3211';
const SHOP = process.argv[3] || 'zazawoods.nl';
const shapes = (process.argv[4] || 'rectangle,oval,danish-oval,round,organic,bootsform,halfrond').split(',');

const VARPRICE = {};
for (const f of fs.readdirSync('/tmp').filter(f => f.startsWith(SHOP === 'zazawoods.nl' ? 'nl_p' : 'de_p') && f.endsWith('.json'))) {
  try { for (const p of JSON.parse(fs.readFileSync('/tmp/' + f)).products) for (const v of p.variants) VARPRICE[String(v.id)] = parseFloat(v.price); } catch (e) {}
}
const DUMP = {};
for (const f of fs.readdirSync('/tmp').filter(f => f.startsWith(SHOP === 'zazawoods.nl' ? 'nl_p' : 'de_p') && f.endsWith('.json'))) {
  try { for (const p of JSON.parse(fs.readFileSync('/tmp/' + f)).products) DUMP[p.handle] = p; } catch (e) {}
}
function shopJSON(handle) {
  // prefer the fresh catalog dump (storefront JSON gets bot-checked when hit repeatedly)
  if (DUMP[handle]) return DUMP[handle];
  const out = execFileSync('curl', ['-sS', '-A', 'Mozilla/5.0', `https://${SHOP}/products/${handle}.json`], { maxBuffer: 50e6 }).toString();
  return JSON.parse(out).product;
}

(async () => {
  const browser = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-certificate-errors']
  });
  let failures = 0, checks = 0;
  const cache = {};
  for (const shape of shapes) {
    const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
    const errors = [];
    page.on('pageerror', e => errors.push('PAGEERROR ' + e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    if (BASE.startsWith('https://')) {
      const host = new URL(BASE).host;
      await page.route(u => u.host === host, route => {
        execFile('curl', ['-sS', '-i', '--max-time', '120', route.request().url()],
          { encoding: 'buffer', maxBuffer: 100 * 1024 * 1024 }, (err, stdout) => {
            if (err) return route.fulfill({ status: 502, body: '' });
            let buf = stdout, idx;
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
    await page.waitForTimeout(3000);
    const handle = await page.evaluate(() => window._configurator.state.productHandle || null);
    const prodHandle = await page.evaluate(async () => {
      const m = await import('./js/config.js?v=' + document.querySelector('link[rel=modulepreload]').href.split('v=')[1]);
      return m.TABLE_SHAPES.find(s => s.id === window._configurator.state.shape).shopifyHandle;
    });
    const prod = cache[prodHandle] || (cache[prodHandle] = shopJSON(prodHandle));
    const vmap = {}; for (const v of prod.variants) vmap[String(v.id)] = v;
    console.log(`\n=== ${shape} (${prodHandle}, ${prod.variants.length} variants in shop)`);

    // enumerate size buttons: fixed grid (data-length) / length row (data-value)
    const btnSel = '#dim-fixed-grid .dim-btn, #dim-length-row .dim-btn, #dim-diameter-row .dim-btn';
    const n = await page.evaluate(sel => document.querySelectorAll(sel).length, btnSel);
    const seenVariants = new Set();
    for (let i = 0; i < n; i++) {
      const r = await page.evaluate(async ([sel, i]) => {
        const b = document.querySelectorAll(sel)[i]; b.click();
        await new Promise(res => setTimeout(res, 700));
        const c = window._configurator;
        return { label: b.textContent.trim(), length: c.state.length, width: c.state.width,
          base: c._selectedVariants?.base ? String(c._selectedVariants.base) : null,
          leg: c._selectedVariants?.leg || null, edge: c._selectedVariants?.edge || null, beh: c._selectedVariants?.behandlung || null,
          total: document.getElementById('total-price').textContent.trim() };
      }, [btnSel, i]);
      checks++;
      const v = r.base && vmap[r.base];
      if (!v) { console.log(`  FAIL size ${r.label} (${r.length}x${r.width}): base variant ${r.base} not in shop product`); failures++; continue; }
      seenVariants.add(r.base);
      // expected total = base + addon prices (addon variant prices from the shop catalog dump)
      let expected = parseFloat(v.price);
      const addonIds = [r.leg, r.edge, r.beh].filter(Boolean);
      const missing = [];
      for (const id of addonIds) { const ap = VARPRICE[String(id)]; if (ap == null) missing.push(id); else expected += ap; }
      const shown = parseInt(r.total.replace(/[^\d]/g, ''), 10);
      const delta = shown - Math.round(expected);
      const flag = (delta === 0 && !missing.length) ? 'ok ' : 'FAIL';
      if (flag === 'FAIL') failures++;
      if (missing.length) console.log('    addon variants not in catalog dump:', missing);
      console.log(`  ${flag} ${r.label.padEnd(10)} -> ${v.title.padEnd(32)} base=${r.base} shop=€${v.price} shown=€${shown} (addons +${delta})`);
    }
    // Every shop variant of this size grid should be reachable (except NL-only extras)
    const unreached = prod.variants.filter(v => !seenVariants.has(String(v.id))).map(v => v.title);
    if (unreached.length) console.log('  note: shop variants not offered in configurator:', unreached.join(' | '));
    const realErrors = errors.filter(e => !/ERR_CONNECTION|Failed to load resource/.test(e));
    if (realErrors.length) { console.log('  FAIL console errors:', realErrors.slice(0, 5)); failures++; }
    await page.close();
  }
  console.log(failures ? `\nFAILURES: ${failures} / ${checks}` : `\nALL PASS (${checks} size checks)`);
  await browser.close();
  process.exit(failures ? 1 : 0);
})();
