---
name: add-post
description: 공지사항 또는 자료실에 글을 추가한다. "공지 올려줘", "자료실에 추가", "게시글 등록" 요청 시 사용.
---

# 게시글 추가

사용자가 알려 준 내용으로 공지사항(notice) 또는 자료실(archive) 글을 추가한다.

## 절차

1. **게시판·제목·날짜·본문·첨부**를 파악한다. 빠진 것은 기본값을 쓴다.
   - 게시판: 서식·지침·안내문 같은 "내려받을 자료"는 archive, 그 외 안내는 notice
   - 날짜: 오늘 (`date +%F`)
   - 작성자: `탄소예산지원부`
   - 첨부 파일이 `files/`에 아직 없으면 `--file "" --file-name "이름.pdf" --type PDF` 로 '준비 중' 처리
2. 스크립트로 등록한다.
   ```bash
   node scripts/new-post.mjs <notice|archive> "제목" --date YYYY-MM-DD [--file files/x.pdf] [--badge 서식] [--pin]
   ```
3. 생성된 `data/<board>/<id>.html` 본문을 사용자가 준 내용으로 채운다.
   - 순수 HTML 조각만: `<p> <ul> <ol> <h3> <table> <div class="quote">`
   - `<html> <head> <body> <script>` 금지
   - 다른 섹션 링크는 `index.html#files` 처럼 상대 경로
4. `node scripts/check.mjs` 를 실행해 오류 0건을 확인한다.
5. 결과를 요약한다: 게시판/id/제목, 본문 파일 경로, 첨부 상태(연결됨/준비 중).

## 첨부 파일을 함께 받은 경우
- `files/` 에 **영문·숫자·밑줄 이름**으로 저장한다 (예: `guide_2027_budget.pdf`). 한글·공백 파일명은 쓰지 않는다.
- 표시 이름(`--file-name`)에는 원래 한글 이름을 그대로 적는다.
- 같은 파일을 공지와 자료실 양쪽에 걸어도 된다 (현재 서식 제1호가 그렇게 되어 있음).

## 하지 말 것
- `index.html`, `view.html`, `assets/app.js` 수정
- `posts.js` 에 번호(`no`) 기재
- 기존 글의 id 변경 (외부에서 `view.html?b=notice&id=4` 링크를 쓰고 있을 수 있음)
