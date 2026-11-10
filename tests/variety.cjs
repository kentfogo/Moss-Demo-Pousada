// Design variety: every direction and every layout renders, fonts load, contrast holds; saves a contact sheet.
// Run: node tests/variety.cjs   (writes screenshots/variety/*.png and screenshots/variety-sheet.png)
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const ROOT = path.resolve(__dirname, '..');
const URL = 'file://' + path.join(ROOT, 'moss-builder.html') + '?speed=0.02';
const OUT = path.join(ROOT, 'screenshots', 'variety');
const results = [];
const check = (name, ok, detail = '') => { results.push(!!ok); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`); };

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(URL);
  await page.evaluate(() => window.moss.app.send('A seaside pousada in Trancoso with nine rooms'));
  await page.evaluate(() => window.moss.app.whenIdle());
  // add the new section types so they're in every screenshot's page too
  await page.evaluate(() => {
    const st = window.moss.pageModel.get(); const home = st.pages[0];
    ['steps', 'gallery', 'callStrip'].forEach((type, i) => home.sections.splice(2 + i, 0, { id: 'x' + type, type, data: MossSite.NEW_TYPES[type].defaults(st.business.copy) }));
    window.moss.renderer.render({ flip: false });
  });

  const ids = await page.evaluate(() => MossSite.DIRECTIONS.map((d) => d.id));
  check('at least 8 art directions', ids.length >= 8, ids.join(', '));

  // every layout of every type renders in every direction
  const matrix = await page.evaluate(() => {
    const st = window.moss.pageModel.get(); const home = st.pages[0]; const bad = [];
    let count = 0;
    MossSite.DIRECTIONS.forEach((d) => {
      st.design = MossSite.fromDirection(d.id);
      Object.entries(MossSite.VARIANTS).forEach(([type, list]) => {
        const sec = home.sections.find((x) => x.type === type); if (!sec) return;
        list.forEach((v) => { count++; if (!window.moss.renderer.validate(type, Object.assign({}, sec.data, { variant: v }))) bad.push(`${d.id}/${type}:${v}`); });
      });
      Object.keys(MossSite.NEW_TYPES).forEach((type) => { count++; if (!window.moss.renderer.validate(type, MossSite.NEW_TYPES[type].defaults(st.business.copy))) bad.push(`${d.id}/${type}`); });
    });
    return { count, bad };
  });
  check('every direction × layout renders', matrix.bad.length === 0 && matrix.count > 150, `${matrix.count} combinations; failures: ${matrix.bad.slice(0, 5).join(', ')}`);

  // contrast: library and a deliberately bad custom palette
  const contrast = await page.evaluate(() => {
    const low = [];
    MossSite.DIRECTIONS.forEach((d) => { const c = MossSite.fromDirection(d.id).colors; [['ink', 4.5], ['muted', 4.5], ['accent', 3]].forEach(([k, min]) => { const r = MossSite.ratio(c[k], c.bg); if (r < min) low.push(`${d.id}.${k}=${r.toFixed(2)}`); }); });
    const fixed = MossSite.sanitizeDesign({ direction: 'swiss', colors: { bg: '#ffffff', ink: '#eeeeee', muted: '#f3f3f3', accent: '#fff6a0' } }, null).colors;
    return { low, fixed: { ink: MossSite.ratio(fixed.ink, fixed.bg), muted: MossSite.ratio(fixed.muted, fixed.bg), accent: MossSite.ratio(fixed.accent, fixed.bg) } };
  });
  check('all directions pass contrast (text ≥ 4.5, accent ≥ 3)', contrast.low.length === 0, contrast.low.join(', '));
  check('contrast guard repairs an unreadable custom palette', contrast.fixed.ink >= 4.5 && contrast.fixed.muted >= 4.5 && contrast.fixed.accent >= 3, JSON.stringify(contrast.fixed));
  const junk = await page.evaluate(() => { const d = MossSite.sanitizeDesign({ direction: 'nope', colors: { bg: 'red; background:url(x)' }, type: { display: 'Comic Sans' }, shape: { button: 'blink' } }, null); return { dir: d.direction, bg: d.colors.bg, display: d.type.display, button: d.shape.button }; });
  check('invalid tokens fall back safely', junk.dir === 'hospitality' && /^#[0-9a-f]{6}$/.test(junk.bg) && junk.display === 'Instrument Serif' && junk.button === 'pill', JSON.stringify(junk));

  // screenshot each direction, in its own default layouts
  for (const id of ids) {
    await page.evaluate((d) => { const st = window.moss.pageModel.get(); st.design = MossSite.fromDirection(d); window.moss.renderer.render({ flip: false }); const pv = document.querySelector('#pageView'); pv.style.scrollBehavior = 'auto'; pv.scrollTop = 0; }, id);
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(400);
    const box = await page.locator('#frame').boundingBox();
    await page.screenshot({ path: path.join(OUT, `${id}.png`), clip: { x: box.x, y: box.y, width: box.width, height: Math.min(box.height, 900 - box.y) } });
  }
  const fontsOk = await page.evaluate(() => MossSite.DIRECTIONS.every((d) => document.fonts.check(`20px "${d.type.display}"`)));
  check('direction display fonts load from /fonts', fontsOk);
  check('no console/page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  await browser.close();

  // contact sheet (3 columns)
  const { execFileSync } = require('child_process');
  try {
    execFileSync('python3', ['-I', '-c', `
import sys, glob, os
from PIL import Image, ImageDraw
files = [os.path.join(sys.argv[1], f + '.png') for f in sys.argv[3].split(',')]
ims = [Image.open(f).convert('RGB') for f in files]
w = 560; ims = [im.resize((w, int(im.height * w / im.width))) for im in ims]
h = max(im.height for im in ims) + 30; cols = 3; rows = (len(ims) + cols - 1) // cols
sheet = Image.new('RGB', (cols * (w + 20) + 20, rows * (h + 20) + 20), (238, 238, 234))
d = ImageDraw.Draw(sheet)
for i, (im, f) in enumerate(zip(ims, files)):
    x = 20 + (i % cols) * (w + 20); y = 20 + (i // cols) * (h + 20)
    sheet.paste(im, (x, y + 26)); d.text((x, y + 6), os.path.basename(f)[:-4], fill=(40, 40, 40))
sheet.save(sys.argv[2])
`, OUT, path.join(ROOT, 'screenshots', 'variety-sheet.png'), ids.join(',')]);
    console.log('contact sheet: screenshots/variety-sheet.png');
  } catch (e) { console.log('contact sheet skipped:', e.message); }

  const failed = results.filter((x) => !x).length;
  console.log(`\n${results.length - failed}/${results.length} passed`);
  process.exit(failed ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
