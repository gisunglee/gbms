/* ══════════════════════════════════════════════════════════════════
   공통 스크립트 — index.html / view.html 이 함께 사용합니다.
   내용(글·연락처)은 data/ 폴더만 고치면 되고, 이 파일은 건드릴 일이
   거의 없습니다.
   ══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var BASE = { site: null, posts: null };

  /* 예전 링크(view.html?b=data&id=4) 호환용 */
  var ALIAS = { data: 'archive' };

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function fail(msg, err) {
    console.error('[GBMS]', msg, err || '');
    document.querySelectorAll('[data-board],#app').forEach(function (el) {
      el.innerHTML = '<div class="empty">자료를 불러오지 못했습니다.<br><small>' +
        esc(msg) + '</small></div>';
    });
  }

  function load() {
    BASE.site = window.SITE;
    BASE.posts = window.POSTS;
    if (!BASE.site || !BASE.posts) throw new Error('data/site.js · data/posts.js 를 읽지 못했습니다.');
  }

  /* ── 게시판별 글 목록: 최신순 정렬 + 고정글 위로 + 번호/NEW 자동 부여 ── */
  function postsOf(boardKey) {
    var newDays = BASE.posts.newDays || 14;
    var now = Date.now();

    var list = BASE.posts.posts
      .filter(function (p) { return p.board === boardKey; })
      .sort(function (a, b) { return a.date < b.date ? 1 : a.date > b.date ? -1 : 0; });

    var normal = list.filter(function (p) { return !p.pin; });
    var total = normal.length;
    normal.forEach(function (p, i) { p._no = total - i; });   // 오래된 글이 1번
    list.filter(function (p) { return p.pin; })
        .forEach(function (p) { p._no = '공지'; });

    list.forEach(function (p) {
      var days = (now - new Date(p.date + 'T00:00:00').getTime()) / 86400000;
      p._isNew = days >= 0 && days <= newDays;
    });

    return list.filter(function (p) { return p.pin; })
               .concat(normal);
  }

  function postUrl(p) { return 'view.html?b=' + p.board + '&id=' + encodeURIComponent(p.id); }

  function badges(p) {
    var h = '';
    if (p.pin) h += '<span class="badge badge-notice">필독</span>';
    if (p._isNew) h += '<span class="badge badge-new">NEW</span>';
    if (p.badge) h += '<span class="badge badge-file">' + esc(p.badge) + '</span>';
    return h;
  }

  /* ── index.html 게시판 표 ── */
  function renderBoard(el) {
    var key = el.getAttribute('data-board');
    var board = BASE.posts.boards[key];
    var list = postsOf(key);
    var isArchive = board.cols === 'archive';

    var head = isArchive
      ? '<tr><th scope="col" class="col-no">번호</th><th scope="col">자료명</th>' +
        '<th scope="col" class="col-type">형식</th><th scope="col" class="col-date">등록일</th>' +
        '<th scope="col" class="col-dl">다운로드</th></tr>'
      : '<tr><th scope="col" class="col-no">번호</th><th scope="col">제목</th>' +
        '<th scope="col" class="col-writer">작성자</th><th scope="col" class="col-date">등록일</th></tr>';

    var rows = list.map(function (p) {
      var f = (p.files && p.files[0]) || null;
      var subj = '<td class="subj">' + badges(p) +
                 '<a href="' + postUrl(p) + '">' + esc(p.title) + '</a></td>';

      if (isArchive) {
        var type = f ? f.type : '';
        var dl = f && f.path
          ? '<a class="dl" href="' + esc(f.path) + '" download>받기</a>'
          : '<span class="dl na">준비 중</span>';
        return '<tr' + (p.pin ? ' class="pin"' : '') + '>' +
               '<td class="col-no">' + esc(p._no) + '</td>' + subj +
               '<td class="col-type"><span class="ext ' + esc(String(type).toLowerCase()) + '">' +
               esc(type) + '</span></td>' +
               '<td class="col-date">' + esc(p.date) + '</td>' +
               '<td class="col-dl">' + dl + '</td></tr>';
      }
      return '<tr' + (p.pin ? ' class="pin"' : '') + '>' +
             '<td class="col-no">' + esc(p._no) + '</td>' + subj +
             '<td class="col-writer">' + esc(p.writer) + '</td>' +
             '<td class="col-date">' + esc(p.date) + '</td></tr>';
    }).join('');

    el.innerHTML =
      '<div class="board-top"><p class="cnt">전체 <b>' + list.length + '</b>건</p></div>' +
      '<div class="tbl-wrap"><table>' +
        '<caption class="sr-only">' + esc(board.label) + ' 목록</caption>' +
        '<thead>' + head + '</thead><tbody>' + rows + '</tbody></table></div>';
  }

  /* ── view.html 상세 ── */
  function renderPost() {
    var app = document.getElementById('app');
    var q = new URLSearchParams(location.search);
    var raw = q.get('b') || 'notice';
    var key = BASE.posts.boards[raw] ? raw : (ALIAS[raw] || 'notice');
    var board = BASE.posts.boards[key];
    var list = postsOf(key);
    var idx = list.findIndex(function (p) { return String(p.id) === String(q.get('id')); });
    var backHref = 'index.html#' + board.anchor;

    document.getElementById('crumbBoard').textContent = board.label;
    document.getElementById('boardTitle').textContent = board.label;

    if (idx === -1) {
      app.innerHTML = '<div class="post-box"><div class="empty">요청하신 게시글을 찾을 수 없습니다.' +
        '<p><a class="btn-solid" href="' + backHref + '">목록으로</a></p></div></div>';
      return;
    }

    var p = list[idx];
    document.title = p.title + ' | ' + board.label;

    var files = (p.files && p.files.length)
      ? p.files.map(function (f) {
          var meta = [f.type, f.size].filter(Boolean).join(' · ');
          return f.path
            ? '<li>' + icon() + '<a href="' + esc(f.path) + '" download>' + esc(f.name) + '</a>' +
              (meta ? ' <span class="size">(' + esc(meta) + ')</span>' : '') + '</li>'
            : '<li>' + icon() + '<span class="off">' + esc(f.name) + '</span>' +
              ' <span class="size">(' + esc(meta) + ' · 준비 중)</span></li>';
        }).join('')
      : '<li class="off">첨부파일이 없습니다.</li>';

    var prev = list[idx - 1], next = list[idx + 1];
    var nav = function (item) {
      return item
        ? '<a href="' + postUrl(item) + '">' + esc(item.title) + '</a>'
        : '<span class="off">해당 글 이 없습니다.</span>';
    };

    app.innerHTML =
      '<article class="post-box">' +
        '<div class="post-title"><h2>' + badges(p) + esc(p.title) + '</h2></div>' +
        '<div class="post-meta">' +
          '<span><b>번호</b>' + esc(p._no) + '</span>' +
          '<span><b>작성자</b>' + esc(p.writer) + '</span>' +
          '<span><b>등록일</b>' + esc(p.date) + '</span>' +
        '</div>' +
        '<div class="post-body" id="postBody"><p class="off">본문을 불러오는 중입니다…</p></div>' +
        '<div class="post-files"><h3>첨부파일</h3><ul>' + files + '</ul></div>' +
        '<nav class="post-nav" aria-label="이전·뒲음 글">' +
          '<div><span class="lbl">이전 글</span>' + nav(prev) + '</div>' +
          '<div><span class="lbl">다음 글</span>' + nav(next) + '</div>' +
        '</nav>' +
      '</article>' +
      '<div class="post-actions">' +
        '<a class="btn-line" href="' + backHref + '">목록으로</a>' +
      '</div>';

    fetch(board.dir + '/' + p.id + '.html')
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.text(); })
      .then(function (html) { document.getElementById('postBody').innerHTML = html; })
      .catch(function (e) {
        document.getElementById('postBody').innerHTML =
          '<p class="off">본문(' + esc(board.dir + '/' + p.id + '.html') + ')을 불러오지 못했습니다.' + (location.protocol === 'file:' ? '<br>파일을 직접 열면(file://) 본문을 읽을 수 없습니다. 왹분서(GitHub Pages 등)에서 확인해 주세요.' : '') + '</p>';
        console.error('[GBMS] body load failed', e);
      });
  }

  function icon() {
    return '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
      '<path d="M21 11.5V17a5 5 0 0 1-10 0V7a3.5 3.5 0 1 1 7 0v9.5a2 2 0 1 1-4 0V8" ' +
      'fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
  }

  /* ── 사이트 공통 정보 주입: <span data-site="tel"> 처럼 쓸면 채워집니다 ── */
  function fillSite() {
    document.querySelectorAll('[data-site]').forEach(function (el) {
      var v = BASE.site[el.getAttribute('data-site')];
      if (v == null) return;
      if (el.tagName === 'A' && el.hasAttribute('data-site-href')) el.href = v;
      else el.textContent = v;
    });
    document.querySelectorAll('[data-site-href]').forEach(function (el) {
      var k = el.getAttribute('data-site-href');
      var v = BASE.site[k];
      if (v) el.setAttribute('href', k === 'email' ? 'mailto:' + v : v);
    });
  }

  /* ── 스크롤에 따라 GNB 현재 위치 표시 ── */
  var observer;
  function navSpyInit() {
    var links = Array.prototype.slice.call(document.querySelectorAll('.gnb a[href^="#"]'));
    if (!links.length || !('IntersectionObserver' in window)) return;
    var map = {};
    links.forEach(function (a) {
      var el = document.querySelector(a.getAttribute('href'));
      if (el) map[el.id] = a;
    });
    observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        links.forEach(function (a) { a.removeAttribute('aria-current'); });
        if (map[en.target.id]) map[en.target.id].setAttribute('aria-current', 'true');
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(map).forEach(function (id) { observer.observe(document.getElementById(id)); });
  }

  document.addEventListener('DOMContentLoaded', function () {
    try {
      load();
      fillSite();
      document.querySelectorAll('[data-board]').forEach(renderBoard);
      if (document.getElementById('app')) renderPost();
      navSpyInit();
    } catch (e) {
      fail(e.message, e);
    }
  });
})();
