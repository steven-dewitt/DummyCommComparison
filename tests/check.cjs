// End-to-end check of Comm_Comparison.html in headless Chromium.
// usage: node tests/check.cjs <sample.xlsx> <sample634.csv>
//   (make them with: python tests/make_sample.py sample.xlsx sample634.csv)
const path = require('path');
const assert = require('assert/strict');
const { chromium } = require('playwright');

(async () => {
  const [data, csv634] = process.argv.slice(2);
  const html = path.join(__dirname, '..', 'Comm_Comparison.html');
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ acceptDownloads: true, viewport: { width: 1400, height: 900 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto('file://' + html);
  await page.setInputFiles('#file', data);
  await page.waitForSelector('#layout:not([hidden])');

  const tabs = () => page.$$eval('#tabs .tab', (t) => t.map((x) => x.textContent));
  const slots = () => page.$$eval('[data-input]', (e) => e.map((x) => x.value));
  const summary = () => page.$$eval('#summary > .scroll tr', (rows) => rows.map((r) => Array.from(r.children).map((c) => c.textContent.trim())));
  const vals = (id) => page.$$eval(`[data-chart="${id}"] text.val, [data-chart="${id}"] text.na`, (t) => t.map((x) => x.textContent));
  const col = (n) => page.$$eval('#list tbody tr', (rows, n) => rows.map((r) => r.children[n].firstChild.textContent), n);

  // Both data sheets are read; placeholder rows ("Not Tested", "Format Line") are not tests;
  // the Control sheet with the same headings is ignored.
  assert.deepEqual(await tabs(), ['2344 tests', '6346 tests']);
  assert.match(await page.textContent('#status'), /Grade_234_TestData/);
  assert.equal(await page.textContent('#reportTitle'), '234 Dummy Comm Testing');

  // Starts with the tests chosen on 234Comparison (99999 isn't in the data, so that slot is empty).
  assert.deepEqual(await slots(), ['26001', '', '26002', '', '']);
  assert.deepEqual(await summary(), [
    ['Set #', '26001', '26002'], ['Grade', '234', '234'], ['Lot', '501', '502'], ['Bake', '7001', 'L7002'],
    ['LSO Number', '2026001', ''], ['Comments', '', ''],
  ]);
  assert.deepEqual(await page.$$eval('.chart h3', (h) => h.map((x) => x.textContent)), ['Ring Temp °C', 'Brush Life (Hrs/in)', 'Coef. Of Friction']);
  assert.deepEqual(await vals('ringTemp'), ['73', '75']);
  assert.deepEqual(await vals('life'), ['2,481', '12,295']);
  assert.deepEqual(await vals('cof'), ['0.065', '0.075']); // =AVERAGE(0.07,0.08) with no cached value

  // Typing a test, a blank result and an unknown test.
  await page.fill('[data-input="1"]', '26003');
  await page.press('[data-input="1"]', 'Enter');
  assert.deepEqual(await vals('ringTemp'), ['73', 'n/a', '75']);
  assert.equal(await page.textContent('[data-slot="1"] .sub'), 'Lot 503 · 2026-03-05');
  await page.fill('[data-input="3"]', '12345');
  await page.press('[data-input="3"]', 'Enter');
  assert.equal(await page.textContent('[data-slot="3"] .sub'), 'Test not found');

  // The list starts newest first; sort buttons, a second click reverses.
  assert.deepEqual(await col(0), ['26002 (2)', '26003', '26002', '26001']);
  await page.click('[data-sort="test"]');
  assert.deepEqual(await col(0), ['26001', '26002', '26002 (2)', '26003']);
  await page.click('[data-sort="test"]');
  assert.deepEqual(await col(0), ['26003', '26002 (2)', '26002', '26001']);
  await page.click('[data-sort="bake"]');
  assert.deepEqual(await col(2), ['7001', '7003', 'L7002', 'L7002']);
  await page.fill('#filter', 'rerun');
  assert.deepEqual(await col(0), ['26002 (2)']);

  // Clicking a test in the list fills the highlighted slot; the duplicate run is selectable.
  await page.click('[data-slot="4"]');
  await page.click('#list tr[data-label="26002 (2)"]');
  assert.equal(await page.inputValue('[data-input="4"]'), '26002 (2)');
  assert.match(await page.textContent('#notices'), /26002 appears more than once/);
  assert.deepEqual(await vals('life'), ['2,481', 'n/a', '12,295', '4,257']);

  // 634 keeps its own selection, charts and list.
  await page.click('[data-grade="634"]');
  assert.equal(await page.textContent('#reportTitle'), '634 Dummy Comm Testing');
  assert.deepEqual(await slots(), ['702', 'Trial', '', '', '']);
  assert.deepEqual((await summary()).slice(0, 5), [
    ['Test # (Lot)', '702', 'Trial'], ['Set #', '15008', '17112'], ['Bake', '4431', 'TG761'], ['LSO', '2014606', '2017250'],
    ['Testing status', 'Complete', 'Complete'],
  ]);
  assert.deepEqual(await page.$$eval('.chart h3', (h) => h.map((x) => x.textContent)),
    ['Average Brush Life (hrs/in)', 'Coefficient of Friction', 'Contact Voltage Drop (Volts)']);
  await page.fill('[data-input="2"]', '703');
  await page.press('[data-input="2"]', 'Enter');
  assert.deepEqual(await vals('lifeAvg'), ['8,711', '2,211', 'n/a']);
  assert.deepEqual(await vals('cof'), ['0.1600', '0.3970', 'n/a']);
  assert.deepEqual(await vals('cvd'), ['4.04', '2.40', 'n/a']);
  assert.deepEqual(await col(0), ['Trial', 'Trial (2)', '667-A2', '701', '702', '703']);
  await page.click('[data-sort="status"]');
  assert.deepEqual((await col(4)).slice(-1), ['Failed']);
  assert.match(page.url(), /#grade=634&tests=702,Trial,703$/);

  // Selection and data survive a reload, for both grades.
  await page.reload();
  await page.waitForSelector('#layout:not([hidden])');
  assert.equal(await page.textContent('#reportTitle'), '634 Dummy Comm Testing');
  assert.deepEqual(await slots(), ['702', 'Trial', '703', '', '']);
  await page.click('[data-grade="234"]');
  assert.deepEqual(await slots(), ['26001', '26003', '26002', '', '26002 (2)']);

  const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#exportCsv')]);
  assert.equal(dl.suggestedFilename(), '234_Comparison_26001_26003_26002_26002_2_.csv');

  // A CSV of one data sheet replaces that grade only.
  await page.setInputFiles('#file', csv634);
  await page.waitForFunction(() => document.querySelector('#tabs').textContent.includes('7 tests'));
  assert.deepEqual(await tabs(), ['2344 tests', '6347 tests']);
  assert.equal(await page.textContent('#reportTitle'), '634 Dummy Comm Testing');
  assert.deepEqual(await slots(), ['702', 'Trial', '703', '', '']);
  await page.click('[data-sort="date"]'); // CSV dates are text: they still sort as dates
  assert.deepEqual(await col(0), ['Trial', 'Trial (2)', '704', '667-A2', '701', '702', '703']);
  assert.equal(await page.$eval('#list tr[data-label="704"] td:nth-child(4)', (td) => td.textContent), '2016-07-01');

  // Forget saved data returns to the start screen.
  await page.click('#forget');
  assert.equal(await page.isVisible('#drop'), true);

  assert.deepEqual(errors, []);
  console.log('All checks passed');
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
