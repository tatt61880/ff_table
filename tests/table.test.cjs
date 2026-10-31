const assert = require('node:assert/strict');
const { before, after, beforeEach, afterEach, test } = require('node:test');
const { createServer } = require('node:http');
const { readFile } = require('node:fs/promises');
const { join } = require('node:path');
const { pathToFileURL } = require('node:url');
const playwright = require('playwright');

const root = join(__dirname, '..');
const assets = {
  '/': ['index.html', 'text/html'],
  '/src/main.js': ['src/main.js', 'application/javascript'],
  '/css/main.css': ['css/main.css', 'text/css'],
  '/images/favicon.png': ['images/favicon.png', 'image/png'],
};
const settingKey = 'ff-table-settings-v1';
let server;
let browser;
let context;
let page;
let baseURL;
let errors;
const cell = (row, column) => page.locator(`button[data-row="${row}"][data-column="${column}"]`);

before(async () => {
  server = createServer(async (request, response) => {
    const asset = assets[new URL(request.url, 'http://localhost').pathname];
    if (!asset) {
      response.writeHead(404).end();
      return;
    }
    try {
      response.writeHead(200, { 'Content-Type': asset[1] });
      response.end(await readFile(join(root, asset[0])));
    } catch {
      response.writeHead(500).end();
    }
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  baseURL = `http://127.0.0.1:${server.address().port}`;
  const engine = process.env.TEST_BROWSER || 'chromium';
  assert.ok(['chromium', 'firefox', 'webkit'].includes(engine));
  browser = await playwright[engine].launch({ headless: true, timeout: 15000 });
});

after(async () => {
  if (browser) await browser.close();
  if (server) await new Promise((resolve) => server.close(resolve));
});

beforeEach(async () => {
  context = await browser.newContext({ viewport: { width: 1280, height: 1100 } });
  page = await context.newPage();
  errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(baseURL);
});

afterEach(async () => {
  await context.close();
  assert.deepEqual(errors, [], 'No uncaught browser errors');
});

test('every product is correct in both bases, with and without zero', async () => {
  for (const base of [16, 10]) {
    await page.locator(`.base-options label:has(input[value="${base}"])`).click();
    for (const includeZero of [false, true]) {
      await page.locator('#include-zero').setChecked(includeZero);
      const values = await page.locator('.cell-button').evaluateAll((buttons) => buttons.map((button) => ({
        row: Number(button.dataset.row), column: Number(button.dataset.column), text: button.textContent,
      })));
      const count = includeZero ? 16 : 15;
      assert.equal(values.length, count * count);
      assert.equal(new Set(values.map(({ row, column }) => `${row},${column}`)).size, count * count);
      for (const { row, column, text } of values) {
        assert.ok(row >= (includeZero ? 0 : 1) && row <= 15);
        assert.ok(column >= (includeZero ? 0 : 1) && column <= 15);
        assert.equal(text, (row * column).toString(base).toUpperCase());
      }
      const headings = await page.locator('thead th').allTextContents();
      assert.equal(headings.length, count + 1);
      assert.equal(headings.at(-1), base === 16 ? 'F' : '15');
    }
  }
});

test('selection and hover link the row, column, and both equations', async () => {
  await cell(10, 11).click();
  assert.equal(await page.locator('#equation').textContent(), 'A × B = 6E');
  assert.equal(await page.locator('#comparison').textContent(), '10進数：10 × 11 = 110');
  assert.equal(await page.locator('th.is-highlighted').count(), 2);
  assert.equal(await page.locator('td.is-crosshair').count(), 29);
  await cell(15, 15).hover();
  assert.equal(await page.locator('#equation').textContent(), 'F × F = E1');
  assert.equal(await cell(10, 11).getAttribute('aria-pressed'), 'true');
  await page.locator('h1').hover();
  assert.equal(await page.locator('#equation').textContent(), 'A × B = 6E');
});

test('keyboard navigation has a single tab stop and clamps at table boundaries', async () => {
  await cell(1, 1).focus();
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowUp');
  assert.equal(await cell(1, 1).getAttribute('aria-pressed'), 'true');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowDown');
  assert.equal(await cell(2, 2).getAttribute('aria-pressed'), 'true');
  await page.keyboard.press('End');
  assert.equal(await cell(2, 15).getAttribute('aria-pressed'), 'true');
  await page.keyboard.press('Control+End');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowRight');
  assert.equal(await cell(15, 15).getAttribute('aria-pressed'), 'true');
  await page.keyboard.press('Control+Home');
  assert.equal(await cell(1, 1).getAttribute('aria-pressed'), 'true');
  assert.equal(await page.locator('.cell-button[tabindex="0"]').count(), 1);
  await page.keyboard.press('Tab');
  assert.equal(await page.evaluate(() => document.activeElement.tagName), 'SUMMARY');
});

test('practice hides visual and accessible answers, reveals only one, and resets on movement', async () => {
  await page.locator('#practice-mode').check();
  assert.ok((await page.locator('.cell-button').allTextContents()).every((text) => text === '?'));
  assert.ok((await page.locator('.cell-button').evaluateAll((buttons) => buttons.map((b) => b.getAttribute('aria-label')))).every((text) => text.endsWith('= ?')));
  await cell(10, 11).click();
  assert.equal(await page.locator('#equation').textContent(), 'A × B = ?');
  await cell(15, 15).hover();
  assert.equal(await page.locator('#equation').textContent(), 'A × B = ?');
  await page.locator('#reveal-answer').click();
  assert.equal(await page.locator('#equation').textContent(), 'A × B = 6E');
  assert.equal((await page.locator('.cell-button').allTextContents()).filter((text) => text !== '?').length, 1);
  await cell(10, 11).focus();
  await page.keyboard.press('ArrowRight');
  assert.equal(await page.locator('#equation').textContent(), 'A × C = ?');
  assert.equal(await cell(10, 11).textContent(), '?');
  await page.keyboard.press('Enter');
  assert.equal(await page.locator('#equation').textContent(), 'A × C = 78');
  await page.keyboard.press('Space');
  assert.equal(await page.locator('#equation').textContent(), 'A × C = ?');
  await page.locator('#practice-mode').uncheck();
  assert.equal(await cell(15, 15).textContent(), 'E1');
  assert.equal(await page.locator('#reveal-answer').isVisible(), false);
});

test('removing zero moves a zero selection to a valid cell', async () => {
  await page.locator('#include-zero').check();
  await cell(0, 0).click();
  assert.equal(await page.locator('#equation').textContent(), '0 × 0 = 0');
  await page.locator('#practice-mode').check();
  await page.locator('#reveal-answer').click();
  await page.locator('#include-zero').uncheck();
  assert.equal(await page.locator('#equation').textContent(), '1 × 1 = ?');
  assert.equal(await page.locator('.cell-button[tabindex="0"]').count(), 1);
});

test('preferences survive reload without carrying over a revealed answer', async () => {
  await page.locator('.base-options label:has(input[value="10"])').click();
  await page.locator('#include-zero').check();
  await page.locator('#practice-mode').check();
  await page.locator('#reveal-answer').click();
  await page.reload();
  assert.equal(await page.locator('input[value="10"]').isChecked(), true);
  assert.equal(await page.locator('#include-zero').isChecked(), true);
  assert.equal(await page.locator('#practice-mode').isChecked(), true);
  assert.equal(await page.locator('.cell-button').count(), 256);
  assert.equal(await page.locator('#equation').textContent(), '1 × 1 = ?');
});

test('invalid or unavailable localStorage cannot break the table', async () => {
  for (const saved of ['{invalid', 'null', '[]', '{"base":2,"includeZero":"yes","practice":1}']) {
    await page.evaluate(({ key, value }) => localStorage.setItem(key, value), { key: settingKey, value: saved });
    await page.reload();
    assert.equal(await page.locator('.cell-button').count(), 225);
    assert.equal(await cell(15, 15).textContent(), 'E1');
  }
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('Blocked', 'SecurityError'); } });
  });
  await page.reload();
  await page.locator('.base-options label:has(input[value="10"])').click();
  assert.equal(await cell(15, 15).textContent(), '225');
});

test('narrow layouts scroll the table, keep headers visible, and never overflow the page', async () => {
  for (const width of [320, 375, 390, 600, 768, 1280]) {
    await page.setViewportSize({ width, height: 844 });
    await page.locator('#practice-mode').uncheck();
    await page.locator('.base-options label:has(input[value="10"])').click();
    await page.locator('#include-zero').check();
    await page.locator('#practice-mode').check();
    await cell(15, 15).focus();
    await page.keyboard.press('Control+End');
    const dimensions = await page.evaluate(() => {
      const scroll = document.getElementById('table-scroll');
      const bounds = scroll.getBoundingClientRect();
      const rowHead = document.querySelector('tbody th').getBoundingClientRect();
      const columnHead = document.querySelector('thead th:last-child').getBoundingClientRect();
      const target = document.querySelector('button[data-row="15"][data-column="15"]').getBoundingClientRect();
      return {
        pageWidth: document.documentElement.scrollWidth, viewport: window.innerWidth,
        scrollWidth: scroll.scrollWidth, clientWidth: scroll.clientWidth,
        headerLeft: rowHead.left, headerTop: columnHead.top,
        left: bounds.left, top: bounds.top, right: bounds.right, bottom: bounds.bottom,
        targetRight: target.right, targetBottom: target.bottom,
      };
    });
    assert.ok(dimensions.pageWidth <= dimensions.viewport, `page overflow at ${width}px`);
    if (width < 700) assert.ok(dimensions.scrollWidth > dimensions.clientWidth);
    assert.ok(Math.abs(dimensions.headerLeft - dimensions.left) <= 2);
    assert.ok(Math.abs(dimensions.headerTop - dimensions.top) <= 2);
    assert.ok(dimensions.targetRight <= dimensions.right + 1);
    assert.ok(dimensions.targetBottom <= dimensions.bottom + 1);
    await page.locator('#reveal-answer').click();
    assert.equal(await page.locator('#equation').textContent(), '15 × 15 = 225');
  }
});

test('works when opened directly without a server or internet', async () => {
  await context.setOffline(true);
  await page.goto(pathToFileURL(join(root, 'index.html')).href);
  assert.equal(await cell(15, 15).textContent(), 'E1');
  await page.locator('#practice-mode').check();
  assert.equal(await cell(15, 15).textContent(), '?');
});

test('print layout includes the entire table without an inner scroll area', async () => {
  await page.emulateMedia({ media: 'print' });
  const dimensions = await page.locator('#table-scroll').evaluate((element) => ({
    height: element.clientHeight, content: element.scrollHeight,
    width: element.clientWidth, contentWidth: element.scrollWidth,
  }));
  assert.equal(dimensions.height, dimensions.content);
  assert.equal(dimensions.width, dimensions.contentWidth);
  assert.equal(await page.locator('.toolbar').isVisible(), false);
});
