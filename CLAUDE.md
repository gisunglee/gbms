# GBMS 접속 안내 페이지 — 작업 가이드

온실가스감축인지 운영시스템(GBMS) SSL VPN 접속 신청 안내용 **정적 사이트**입니다.
GitHub Pages(`main` 브랜치 루트)로 배포되며 빌드 과정이 없습니다. 빌드 도구·npm 의존성을 추가하지 마세요.
배포 주소: https://gisunglee.github.io/gbms/

## 구조 한눈에

| 경로 | 역할 | 고칠 일 |
|---|---|---|
| `index.html` | 메인 안내 페이지. 게시판 표는 비어 있고 JS가 채움 | 안내 문구·FAQ 수정 시 |
| `view.html` | 게시글 상세 틀 | 거의 없음 |
| `style.css` | 공용 스타일. 색은 `:root` 변수만 | 디자인 변경 시 |
| `assets/app.js` | 게시판 렌더링·사이트 정보 주입 | 기능 변경 시만 |
| `data/site.js` | 기관명·전화·이메일·서식 경로 (`window.SITE`) | 연락처 변경 시 |
| `data/posts.js` | 게시글 목록 (`window.POSTS`) | 글 추가·삭제 시 |
| `data/notice/<id>.html` | 공지사항 본문 조각 (html/head 없음) | 글 추가 시 |
| `data/archive/<id>.html` | 자료실 본문 조각 | 글 추가 시 |
| `files/` | 첨부파일 실물 | 자료 추가 시 |
| `scripts/` | 관리 스크립트 (Node 18+, 의존성 없음) | |
| `docs/BACKLOG.md` | 개선 과제 목록 | 과제 추가·완료 시 |

## 반드시 지킬 규칙

1. **콘텐츠는 `data/`만 수정** — 글 추가·연락처 변경에 `index.html`·`view.html`·`app.js`를 건드리지 않는다.
2. **본문 조각은 순수 HTML 조각** — `<html>`, `<head>`, `<body>`, `<script>` 금지. `<p> <ul> <h3> <table> <div class="quote">`만 사용.
3. **번호·NEW 배지·전체 건수는 자동** — `posts.js`에 번호를 적지 않는다. 최신 글이 배열 맨 앞.
4. **경로는 대소문자 구분** — `files/` 소문자, 첨부 파일명은 가급적 영문·숫자·밑줄 (`form01_vpn_apply.hwpx` 식).
5. **첨부 `path`가 `""`이면 '준비 중'** — 파일이 아직 없으면 빈 문자열로 둔다. 존재하지 않는 경로를 적지 않는다.
6. **변경 후 반드시 `node scripts/check.mjs`** — 끊어진 경로·중복 id·날짜 오류를 잡는다. 통과해야 커밋.
7. **커밋 메시지는 한 줄 요약** — 예: `공지: 2027년 작성지침 설명회 안내 추가`.

## 자주 하는 작업

### 공지/자료 추가
```bash
node scripts/new-post.mjs notice "글 제목" --date 2026-11-03 --writer 탄소예산지원부
node scripts/new-post.mjs archive "자료명" --file files/guide.pdf --badge 서식
```
→ 본문 파일 생성 + `posts.js` 맨 앞에 항목 삽입. 생성된 본문 파일을 열어 내용을 채운다.
스킬 `/add-post` 를 쓰면 대화로 진행할 수 있다.

### 검증
```bash
node scripts/check.mjs          # 오류가 있으면 exit 1
```

### 로컬 미리보기·스크린샷
```bash
python3 -m http.server 8000     # http://localhost:8000
node scripts/preview.mjs        # .preview/ 에 데스크톱·모바일 스크린샷 저장
```
`file://`로 직접 열면 상세 본문만 안 보인다 (fetch 제약). 정상이다.

### 접근성 검사
```bash
node scripts/a11y.mjs           # axe-core 필요. 없으면 npm i -g axe-core 또는 AXE_PATH=경로
```

### 연락처·이메일 변경
`data/site.js` 한 곳만. 키 이름을 바꾸면 `index.html`·`view.html`의 `data-site="..."`도 같이 바꿔야 한다.

## 데이터 스키마 (posts.js)

```js
{
  "board": "notice" | "archive",   // 필수
  "id": "5",                        // 게시판 안에서 유일. 본문 파일명과 동일
  "date": "YYYY-MM-DD",             // 필수. 정렬·NEW 배지 기준
  "title": "…",                     // 필수
  "writer": "탄소예산지원부",          // 필수
  "pin": true,                      // 선택. 번호 대신 '공지', 맨 위 고정
  "badge": "서식",                   // 선택. 제목 앞 초록 배지
  "files": [                        // 필수 (없으면 [])
    { "name": "표시 이름", "path": "files/x.pdf" | "", "type": "PDF", "size": "1.2MB" }
  ]
}
```

## 배포·확인

- `main`에 push하면 https://gisunglee.github.io/gbms/ 에 수 분 내 반영. 안 바뀌어 보이면 Ctrl+F5.
- PR을 올리면 `.github/workflows/check.yml`이 `check.mjs`를 자동 실행한다.
- 운영 개시 전 확정할 항목은 `docs/BACKLOG.md` "운영 개시 전 필수" 절 참고 (이메일 주소, 시안 문구 제거 등).
