#!/usr/bin/env node
/* 웹 접근성 자동 검사 (axe-core, WCAG 2.1 AA 규칙).
   node scripts/a11y.mjs
   필요: playwright, axe-core (전역 또는 node_modules). axe 경로를 직접 주려면 AXE_PATH=/path/axe.min.js
   자동 검사는 KWCAG 항목의 일부만 잡습니다. 새 창 안내, 맥락 적절성 등은 수동 확인. */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png' };

let axePath = process.env.AXE_PATH;
if (!axePath) { try { axePath = require.resolve('axe-core/axe.min.js'); } catch { /* 아래에서 처리 */ } }
if (!axePath || !fs.existsSync(axePath)) { console.error('axe-core 를 찾지 못함. `npm i -g axe-core` 또는 AXE_PATH 지정'); process.exit(1); }
let chromium;
try { ({ chromium } = require('playwright')); } catch { console.error('playwright 를 찾지 못함'); process.exit(1); }

const server = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (p.endsWith('/')) p += 'index.html';
  const file = path.join(ROOT, p);
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(0, r));
const base = `http://localhost:${server.address().port}`;
const axeSrc = fs.readFileSync(axePath, 'utf8');

const targets = [
  `${base}/index.html`,
  `${base}/view.html?b=notice&id=p1`,
  `${base}/view.html?b=archive&id=4`,
  `${base}/view.html?b=notice&id=none`,
];
const browser = await chromium.launch();
let total = 0;
for (const viewport of [{ width: 1366, height: 900 }, { width: 390, height: 844 }]) {
  const page = await browser.newPage({ viewport });
  for (const url of targets) {
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.addScriptTag({ content: axeSrc });
    const result = await page.evaluate(() => axe.run(document, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'] },
    }));
    const label = `${url.replace(base + '/', '')} @${viewport.width}px`;
    if (!result.violations.length) { console.log(`OK    ${label}`); continue; }
    console.log(`FAIL  ${label}`);
    for (const v of result.violations) {
      total += v.nodes.length;
      console.log(`  [${v.impact}] ${v.id}: ${v.help}`);
      v.nodes.slice(0, 5).forEach((n) => console.log(`      - ${n.target.join(' ')}`));
      if (v.nodes.length > 5) console.log(`      … 외 ${v.nodes.length - 5}건`);
    }
  }
  await page.close();
}
await browser.close();
server.close();
console.log(`\n위반 요소 ${total}건`);
process.exit(total ? 1 : 0);
