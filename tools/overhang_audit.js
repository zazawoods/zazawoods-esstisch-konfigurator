// Overhang audit: for each shape, each leg card, each size button: sample leg vertices (world XZ)
// and test against the convex hull of the tabletop vertices. Reports max overhang in cm.
// usage: node overhang_audit.js <shapes> <base> [threshold_cm]
const { chromium } = require('playwright');
const fs = require('fs'); const path = require('path');
const THREE_DIR = path.join(__dirname, 'node_modules/three'); // npm i three@0.162.0 in tools/
const BASE = process.argv[3] || 'http://localhost:3211';
const THRESH = parseFloat(process.argv[4] || '0.5');
(async () => {
  const shapes = (process.argv[2] || 'rectangle,oval,danish-oval,round,bootsform').split(',');
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
  let issues = 0;
  for (const shape of shapes) {
    const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
    await page.route(/cdn\.jsdelivr\.net\/npm\/three@0\.162\.0\/(.*)/, route => { const rel = route.request().url().match(/three@0\.162\.0\/([^?]*)/)[1]; const f = path.join(THREE_DIR, rel); if (fs.existsSync(f)) route.fulfill({ path: f, contentType: 'application/javascript' }); else route.fulfill({ status: 404, body: '' }); });
    await page.goto(`${BASE}/configurator/?shape=${shape}`);
    for (let i = 0; i < 40; i++) { await page.waitForTimeout(3000); const ok = await page.evaluate(() => document.querySelector('#loader')?.classList.contains('hidden') && !!window._configurator).catch(() => false); if (ok) break; }
    await page.waitForTimeout(6000);
    const res = await page.evaluate(async (THRESH) => {
      const sleep = ms => new Promise(r => setTimeout(r, ms));
      const c = window._configurator;
      const worldPts = (objs, target) => {
        const pts = [];
        const vis = (o) => { for (let p = o; p; p = p.parent) { if (!p.visible) return false; } return true; };
        for (const o of objs) o.traverse(m => {
          if (!m.isMesh || !vis(m)) return;
          const pos = m.geometry.attributes.position; if (!pos) return;
          m.updateWorldMatrix(true, false); const e = m.matrixWorld.elements;
          const n = pos.count; const stride = Math.max(1, Math.floor(n / target));
          for (let i = 0; i < n; i += stride) {
            const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
            pts.push([e[0]*x+e[4]*y+e[8]*z+e[12], e[2]*x+e[6]*y+e[10]*z+e[14]]);
          }
        });
        return pts;
      };
      const hull = (pts) => {
        const P = [...new Map(pts.map(p => [p[0].toFixed(4)+','+p[1].toFixed(4), p])).values()].sort((a,b)=>a[0]-b[0]||a[1]-b[1]);
        if (P.length < 3) return P;
        const cross = (o,a,b) => (a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0]);
        const lower=[]; for (const p of P){ while(lower.length>=2 && cross(lower[lower.length-2],lower[lower.length-1],p)<=0) lower.pop(); lower.push(p);}
        const upper=[]; for (let i=P.length-1;i>=0;i--){ const p=P[i]; while(upper.length>=2 && cross(upper[upper.length-2],upper[upper.length-1],p)<=0) upper.pop(); upper.push(p);}
        upper.pop(); lower.pop(); return lower.concat(upper);
      };
      // signed distance outside hull (positive = outside), orientation-agnostic
      const outsideDist = (h, p) => {
        let maxOut = -Infinity;
        for (let i = 0; i < h.length; i++) {
          const a = h[i], b = h[(i+1)%h.length];
          const ex = b[0]-a[0], ez = b[1]-a[1]; const len = Math.hypot(ex, ez) || 1;
          // outward normal for CCW hull: (ez, -ex)
          const d = ((p[0]-a[0])*ez - (p[1]-a[1])*ex) / len;
          if (d > maxOut) maxOut = d;
        }
        return maxOut; // <=0 inside
      };
      const dimBtns = () => [...document.querySelectorAll('#dim-length-row button, #dim-fixed-grid button, #dim-diameter-row button')].filter(b => b.offsetParent !== null);
      const out = [];
      const titles = [...document.querySelectorAll('.leg-option')].map(b => b.querySelector('.leg-name')?.textContent.trim());
      for (const title of titles) {
        let btn = [...document.querySelectorAll('.leg-option')].find(b => b.querySelector('.leg-name')?.textContent.trim() === title);
        if (!btn) { out.push({ title, size: '-', over: NaN, note: 'card gone' }); continue; }
        btn.click(); await sleep(1800);
        const n = dimBtns().length;
        for (let i = 0; i < Math.max(n, 1); i++) {
          const db = dimBtns()[i]; if (db) { db.click(); await sleep(1300); }
          const effVisible = (o) => { for (let p = o; p; p = p.parent) { if (!p.visible) return false; } return true; };
          const allLegObjs = c.legObjects.map(l => l.object);
          const legs = allLegObjs.filter(o => effVisible(o));
          const tops = []; c.scene.traverse(o => { if (o.isMesh && effVisible(o) && !allLegObjs.some(L => L === o || L.getObjectById(o.id))) { o.geometry.computeBoundingBox(); const bb = o.geometry.boundingBox; o.updateWorldMatrix(true, false); const y = bb.min.y * o.matrixWorld.elements[5] + o.matrixWorld.elements[13]; if (y > 0.5 && (bb.max.x - bb.min.x) > 0.3) tops.push(o); } });
          if (!tops.length || !legs.length) { out.push({ title, size: db ? db.textContent.trim() : '-', over: NaN, note: 'no tops/legs' }); continue; }
          const h = hull(worldPts(tops, 200000));
          const lp = worldPts(legs, 3000);
          let worst = -Infinity; for (const p of lp) { const d = outsideDist(h, p); if (d > worst) worst = d; }
          out.push({ title, size: db ? db.textContent.trim() : '-', over: +(worst*100).toFixed(1), sync: c.state.zwLegName ? true : false, hidden: !(document.querySelector('.leg-option.active')?.offsetParent) });
        }
      }
      return out;
    }, THRESH);
    console.log(`=== ${shape}`);
    const bad = res.filter(r => r.over > THRESH);
    for (const r of bad) { issues++; console.log(`  OVER ${r.over}cm  ${r.title} @ ${r.size}`); }
    const ok = res.length - bad.length;
    console.log(`  ${ok}/${res.length} combos ok (max margin ok: ${Math.max(...res.filter(r=>r.over<=THRESH).map(r=>r.over)).toFixed(1)}cm)`);
    fs.writeFileSync(path.join(__dirname, `out/overhang_${shape}.json`), JSON.stringify(res, null, 1));
    await page.close();
  }
  console.log(issues ? `\nISSUES: ${issues}` : '\nALL OK');
  await browser.close();
})();
