#!/usr/bin/env node
/* 게시글 추가 — 본문 파일 생성 + posts.js 맨 앞에 항목 삽입.
   node scripts/new-post.mjs <notice|archive> "제목" [--id 5] [--date YYYY-MM-DD]
        [--writer 탄소예산지원부] [--pin] [--badge 서식]
        [--file files/x.pdf] [--file-name "표시이름"] [--type PDF] [--size 1.2MB]
   --file 을 생략하면 첨부 없음. 파일이 아직 없으면 --file "" --file-name "이름" --type PDF 로 '준비 중'. */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const board = args.shift();
const title = args.shift();
const opt = { writer: '탄소예산지원부', date: new Date().toISOString().slice(0, 10) };
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === '--pin') { opt.pin = true; continue; }
  if (a.startsWith('--')) { opt[a.slice(2).replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = args[++i]; }
}
const die = (m) => { console.error('오류:', m); process.exit(1); };
if (!['notice', 'archive'].includes(board) || !title) {
  die('사용법: node scripts/new-post.mjs <notice|archive> "제목" [옵션]');
}

const postsPath = path.join(ROOT, 'data/posts.js');
const src = fs.readFileSync(postsPath, 'utf8');
const sandbox = { window: {} };
vm.runInNewContext(src, sandbox);
const data = sandbox.window.POSTS;
const dir = data.boards[board].dir;

/* id: 지정 없으면 해당 게시판의 숫자 id 최댓값 + 1 */
let id = opt.id;
if (!id) {
  const nums = data.posts.filter((p) => p.board === board && /^\d+$/.test(p.id)).map((p) => +p.id);
  id = String((nums.length ? Math.max(...nums) : 0) + 1);
}
if (data.posts.some((p) => p.board === board && String(p.id) === String(id))) die(`${board}/${id} 는 이미 있음`);
if (!/^\d{4}-\d{2}-\d{2}$/.test(opt.date)) die(`date 형식 오류: ${opt.date}`);

const bodyPath = path.join(ROOT, dir, `${id}.html`);
if (fs.existsSync(bodyPath)) die(`본문 파일이 이미 있음: ${dir}/${id}.html`);

/* 첨부 */
const files = [];
if (opt.file !== undefined || opt.fileName) {
  const p = opt.file || '';
  if (p && !fs.existsSync(path.join(ROOT, p))) die(`첨부 파일 없음: ${p} (준비 중이면 --file "")`);
  const ext = (p || opt.fileName || '').split('.').pop().toUpperCase();
  const f = { name: opt.fileName || path.basename(p), path: p, type: opt.type || (p || opt.fileName ? ext : '') };
  if (opt.size) f.size = opt.size;
  else if (p) {
    const b = fs.statSync(path.join(ROOT, p)).size;
    f.size = b >= 1048576 ? (b / 1048576).toFixed(1) + 'MB' : Math.max(1, Math.round(b / 1024)) + 'KB';
  }
  files.push(f);
}

/* posts.js 텍스트 삽입 (주석·서식 보존을 위해 재직렬화하지 않음) */
const entry = { board, id, date: opt.date };
if (opt.pin) entry.pin = true;
entry.title = title;
entry.writer = opt.writer;
if (opt.badge) entry.badge = opt.badge;
entry.files = files;

const lines = ['    {'];
lines.push(`      "board": ${JSON.stringify(board)}, "id": ${JSON.stringify(id)}, "date": ${JSON.stringify(opt.date)}${opt.pin ? ', "pin": true' : ''},`);
lines.push(`      "title": ${JSON.stringify(title)},`);
lines.push(`      "writer": ${JSON.stringify(opt.writer)}${opt.badge ? `, "badge": ${JSON.stringify(opt.badge)}` : ''},`);
if (files.length) {
  lines.push('      "files": [');
  lines.push(files.map((f) => '        ' + JSON.stringify(f).replace(/,"/g, ', "').replace(/":/g, '": ').replace(/^\{/, '{ ').replace(/\}$/, ' }')).join(',\n'));
  lines.push('      ]');
} else lines.push('      "files": []');
lines.push('    },');

const marker = /("posts":\s*\[\s*\n)/;
if (!marker.test(src)) die('posts.js 에서 "posts": [ 위치를 찾지 못함');
fs.writeFileSync(postsPath, src.replace(marker, `$1${lines.join('\n')}\n`));

fs.mkdirSync(path.dirname(bodyPath), { recursive: true });
fs.writeFileSync(bodyPath, `<p>${title}</p>\n<!-- 본문을 작성하세요. <p> <ul> <h3> <table> <div class="quote"> 사용 가능 -->\n`);

console.log(`추가됨: ${board}/${id} "${title}"`);
console.log(`본문 작성: ${dir}/${id}.html`);
console.log('검증: node scripts/check.mjs');
