/* 게시글 목록 — 글 추가는 아래 posts 배열 맨 앞에 한 줄 넣고,
   data/<게시판폴더>/<id>.html 에 본문 파일을 만들면 끝입니다.
   번호·NEW 배지·전체 건수는 자동 계산됩니다. */
window.POSTS = {
  "_안내": [
    "글을 추가하려면: ① data/<게시판폴더>/<id>.html 에 본문을 만들고 ② 아래 posts 배열 맨 앞에 한 줄 추가합니다.",
    "번호(No)와 NEW 배지는 자동 계산되므로 적지 않습니다. 최신 글을 배열 맨 앞에 두세요.",
    "files 의 path 가 \"\" 이면 '준비 중'으로 표시되고 다운로드 링크가 걸리지 않습니다.",
    "pin: true 인 글은 번호 대신 '공지'로 표시되고 목록 맨 위에 고정됩니다."
  ],

  "newDays": 14,

  "boards": {
    "notice":  { "label": "공지사항", "dir": "data/notice",  "anchor": "notice", "cols": "notice" },
    "archive": { "label": "자료실",   "dir": "data/archive", "anchor": "files",  "cols": "archive" }
  },

  "posts": [
    {
      "board": "notice", "id": "4", "date": "2026-09-07",
      "title": "접속 신청서 서식(서식 제1호) 개정 안내 – 접속 PC 정보·소속기관 확인란 추가",
      "writer": "탄소예산지원부",
      "files": [
        { "name": "[서식 제1호] 온실가스감축인지 운영시스템 SSL VPN 접속 신청서.hwpx",
          "path": "files/form01_vpn_apply.hwpx", "type": "HWPX" }
      ]
    },
    {
      "board": "archive", "id": "4", "date": "2026-09-07",
      "title": "[서식 제1호] 온실가스감축인지 운영시스템 SSL VPN 접속 신청서",
      "writer": "탄소예산지원부", "badge": "서식",
      "files": [
        { "name": "[서식 제1호] 온실가스감축인지 운영시스템 SSL VPN 접속 신청서.hwpx",
          "path": "files/form01_vpn_apply.hwpx", "type": "HWPX" }
      ]
    },
    {
      "board": "notice", "id": "p1", "date": "2026-09-01", "pin": true,
      "title": "산하기관·기술자문위원 SSL VPN 접속 신청 안내 (상시 접수)",
      "writer": "탄소예산지원부",
      "files": [
        { "name": "[서식 제1호] 온실가스감축인지 운영시스템 SSL VPN 접속 신청서.hwpx",
          "path": "files/form01_vpn_apply.hwpx", "type": "HWPX" }
      ]
    },
    {
      "board": "archive", "id": "3", "date": "2026-09-01",
      "title": "SSL VPN 접속 신청 안내문 (신청 절차 요약)",
      "writer": "탄소예산지원부",
      "files": [
        { "name": "SSL VPN 접속 신청 안내문.pdf", "path": "", "type": "PDF" }
      ]
    },
    {
      "board": "notice", "id": "3", "date": "2026-08-20",
      "title": "담당자 변경 시 접속 계정 처리 안내",
      "writer": "탄소예산지원부",
      "files": []
    },
    {
      "board": "archive", "id": "2", "date": "2026-05-04",
      "title": "2027년 온실가스감축인지 예산서 및 기금운용계획서 작성지침",
      "writer": "탄소예산지원부",
      "files": [
        { "name": "2027년 온실가스감축인지 예산서 및 기금운용계획서 작성지침.pdf", "path": "", "type": "PDF" }
      ]
    },
    {
      "board": "archive", "id": "1", "date": "2026-04-28",
      "title": "2025년 온실가스감축인지 결산서 및 기금결산서 작성지침",
      "writer": "탄소예산지원부",
      "files": [
        { "name": "2025년 온실가스감축인지 결산서 및 기금결산서 작성지침.pdf", "path": "", "type": "PDF" }
      ]
    },
    {
      "board": "notice", "id": "1", "date": "2026-04-28",
      "title": "온실가스감축인지 운영시스템 접속 안내 페이지 개설",
      "writer": "탄소예산지원부",
      "files": []
    }
  ]
};
