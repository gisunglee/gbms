---
name: preview
description: 페이지를 로컬에서 렌더링해 데스크톱·모바일 스크린샷을 찍고 확인한다. "어떻게 보이는지", "미리보기", "스크린샷" 요청 시 사용.
---

# 미리보기

1. `node scripts/preview.mjs` 실행 (내장 정적 서버 + Playwright. 설치 불필요).
2. `.preview/index-desktop.png`, `.preview/index-mobile.png`, `.preview/view-notice-*.png` 를 Read 로 열어 확인한다.
3. 특정 글을 보려면 스크립트의 `targets` 배열에 `view.html?b=<board>&id=<id>` 를 임시로 추가하거나,
   `python3 -m http.server 8000` 을 띄우고 Playwright 로 직접 접근한다.
4. 확인한 내용(레이아웃 깨짐, 잘린 글자, 빈 표 등)을 간단히 보고한다. 스크린샷 파일은 git 에 올리지 않는다.
