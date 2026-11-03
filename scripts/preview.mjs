#!/usr/bin/env node
/* 로컬 서버를 띄워 index.html·view.html 을 데스크톱/모바일로 스크린샷.
   결과: .preview/*.png  (git 에 올리지 않음)
   필요: playwright (전역 또는 node_modules 에 설치되어 있어야 함) */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, '.preview');
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.svg': 'image/svg+xml' };

const server = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (p.endsWith('/')) p += 'index.html';
  const file = path.join(ROOT, p);
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end('404'); return; }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});

await new Promise((r) => server.listen(0, r));
const base = `http://localhost:${server.address().port}`;
let chromium;
try { ({ chromium } = createRequire(import.meta.url)('playwright')); }           // 프로젝트·전역(NODE_PATH) 순으로 탐색
catch { console.error('playwright 를 찾지 못함. `npm i -g playwright` 후 재시도'); server.close(); process.exit(1); }

fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();
const targets = [
  ['index', `${base}/index.html`],
  ['view-notice', `${base}/view.html?b=notice&id=p1`],
  ['view-archive', `${base}/view.html?b=archive&id=4`],
];
const sizes = { desktop: { width: 1366, height: 900 }, mobile: { width: 390, height: 844 } };
const consoleErrors = [];
for (const [sizeName, viewport] of Object.entries(sizes)) {
  const page = await browser.newPage({ viewport });
  page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) consoleErrors.push(`${sizeName}: ${m.text()}`); });
  page.on('response', (r) => {
    if (r.status() >= 400 && !/logo_keco\.png$/.test(r.url()))              // 로고는 없어도 텍스트로 대체되도록 설계됨
      consoleErrors.push(`${sizeName}: HTTP ${r.status()} ${r.url().replace(base + '/', '')}`);
  });
  page.on('pageerror', (e) => consoleErrors.push(`${sizeName}: ${e.message}`));
  for (const [name, url] of targets) {
    await page.goto(url, { waitUntil: 'networkidle' });
    const out = path.join(OUT, `${name}-${sizeName}.png`);
    await page.screenshot({ path: out, fullPage: true });
    console.log('저장:', path.relative(ROOT, out));
  }
  await page.close();
}
await browser.close();
server.close();
if (consoleErrors.length) { console.log('\n브라우저 콘솔 오류:'); consoleErrors.forEach((e) => console.log(' -', e)); process.exit(1); }
console.log('\n콘솔 오류 없음');
