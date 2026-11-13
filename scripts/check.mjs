#!/usr/bin/env node
/* 사이트 데이터 검증 — 의존성 없음. `node scripts/check.mjs`
   오류(ERROR)가 하나라도 있으면 exit 1. 경고(WARN)는 통과. */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];
const warns = [];
const err = (m) => errors.push(m);
const warn = (m) => warns.push(m);

/* window.X = {...} 형태의 데이터 파일을 브라우저 없이 읽는다 */
function loadGlobal(rel, key) {
  const src = fs.readFileSync(path.join(ROOT, rel), 'utf8');
  const sandbox = { window: {} };
  try { vm.runInNewContext(src, sandbox, { filename: rel }); }
  catch (e) { err(`${rel}: 문법 오류 — ${e.message}`); return null; }
  if (!sandbox.window[key]) err(`${rel}: window.${key} 가 정의되지 않음`);
  return sandbox.window[key];
}

/* 대소문자까지 정확히 일치하는 파일만 존재로 인정 (GitHub Pages = Linux) */
function existsExact(rel) {
  const parts = rel.split('/').filter(Boolean);
  let cur = ROOT;
  for (const p of parts) {
    if (!fs.existsSync(cur)) return false;
    if (!fs.readdirSync(cur).includes(p)) return false;
    cur = path.join(cur, p);
  }
  return fs.existsSync(cur);
}

const site = loadGlobal('data/site.js', 'SITE');
const data = loadGlobal('data/posts.js', 'POSTS');

/* ── site.js ── */
if (site) {
  for (const k of ['name', 'org', 'tel', 'email', 'formPath', 'docTo', 'docTitle']) {
    if (!site[k]) err(`site.js: "${k}" 값이 비어 있음`);
  }
  if (site.formPath && !existsExact(site.formPath)) err(`site.js: formPath "${site.formPath}" 파일 없음`);
  if (/example\./i.test(site.email || '')) warn(`site.js: email 이 아직 예시 주소(${site.email}) — 운영 개시 전 교체`);
  if (site.draftNotice) warn('site.js: draftNotice(시안 안내 문구)가 남아 있음 — 운영 개시 시 비우기');
}

/* ── posts.js ── */
if (data) {
  const boards = data.boards || {};
  const posts = Array.isArray(data.posts) ? data.posts : (err('posts.js: posts 가 배열이 아님'), []);
  const seen = new Map();
  const usedBodies = new Set();

  posts.forEach((p, i) => {
    const tag = `posts[${i}] (${p.board}/${p.id})`;
    const board = boards[p.board];
    if (!board) { err(`${tag}: 알 수 없는 board "${p.board}"`); return; }
    if (p.id == null || String(p.id) === '') err(`${tag}: id 없음`);
    const key = `${p.board}/${p.id}`;
    if (seen.has(key)) err(`${tag}: id 중복 (posts[${seen.get(key)}] 와 동일)`);
    seen.set(key, i);

    if (!/^\d{4}-\d{2}-\d{2}$/.test(p.date || '')) err(`${tag}: date 형식 오류 "${p.date}" (YYYY-MM-DD)`);
    else if (Number.isNaN(Date.parse(p.date + 'T00:00:00'))) err(`${tag}: 존재하지 않는 날짜 "${p.date}"`);
    if (!p.title) err(`${tag}: title 없음`);
    if (!p.writer) err(`${tag}: writer 없음`);
    if (!Array.isArray(p.files)) err(`${tag}: files 는 배열이어야 함 (없으면 [])`);
    if ('no' in p || '_no' in p) warn(`${tag}: 번호는 자동 계산 — "no" 필드 제거`);

    const body = `${board.dir}/${p.id}.html`;
    usedBodies.add(body);
    if (!existsExact(body)) err(`${tag}: 본문 파일 없음 → ${body}`);
    else {
      const html = fs.readFileSync(path.join(ROOT, body), 'utf8');
      if (/<(html|head|body|script)\b/i.test(html)) err(`${body}: <html>/<head>/<body>/<script> 태그 금지 — 본문 조각만`);
      if (!html.trim()) warn(`${body}: 본문이 비어 있음`);
    }

    (p.files || []).forEach((f, j) => {
      const ft = `${tag} files[${j}]`;
      if (!f.name) err(`${ft}: name 없음`);
      if (f.path) {
        if (!existsExact(f.path)) err(`${ft}: 첨부 파일 없음 → ${f.path} (대소문자 확인)`);
        if (!f.type) warn(`${ft}: type 없음 (PDF, HWPX 등)`);
        if (/[\s#%?]/.test(f.path)) warn(`${ft}: 경로에 공백·특수문자 — 영문 파일명 권장`);
        if (f.path.startsWith('/') || /^https?:/.test(f.path)) warn(`${ft}: 상대 경로(files/...)를 권장`);
      } else if (f.path !== '') {
        err(`${ft}: path 는 문자열이어야 함 (준비 중이면 "")`);
      }
    });
  });

  /* 고아 본문 파일 */
  for (const b of Object.values(boards)) {
    const dir = path.join(ROOT, b.dir);
    if (!fs.existsSync(dir)) { err(`boards: 폴더 없음 ${b.dir}`); continue; }
    for (const f of fs.readdirSync(dir)) {
      if (f.endsWith('.html') && !usedBodies.has(`${b.dir}/${f}`)) warn(`${b.dir}/${f}: posts.js 에 없는 본문 파일 (삭제된 글?)`);
    }
  }

  /* 정렬 안내: 맨 앞이 최신이어야 보기 편함 (렌더링은 자동 정렬) */
  const dates = posts.map((p) => p.date).filter(Boolean);
  for (let i = 1; i < dates.length; i++) {
    if (dates[i] > dates[i - 1]) { warn('posts.js: 최신 글이 배열 맨 앞에 오도록 정렬 권장 (화면은 자동 정렬됨)'); break; }
  }
}

/* ── HTML 이 참조하는 로컬 자원 ── */
for (const page of ['index.html', 'view.html']) {
  const html = fs.readFileSync(path.join(ROOT, page), 'utf8');
  const re = /(?:^|[\s])(?:href|src)="([^"#?:]+)"/g;
  let m;
  while ((m = re.exec(html))) {
    const ref = m[1];
    if (ref === 'files/logo_keco.png') continue;           // 없으면 텍스트로 대체되도록 설계됨
    if (!existsExact(ref)) err(`${page}: 참조 경로 없음 → ${ref}`);
  }
}

/* ── 결과 ── */
for (const w of warns) console.log(`WARN  ${w}`);
for (const e of errors) console.log(`ERROR ${e}`);
console.log(`\n검사 완료: 오류 ${errors.length}건, 경고 ${warns.length}건`);
process.exit(errors.length ? 1 : 0);
