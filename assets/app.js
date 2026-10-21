/* Nam Thiên Nhất Trụ · Số 01 — trình đọc tạp chí lật trang */
(() => {
  'use strict';

  const N = 28;                       // single pages: cover, TOC, folios 01–25, back cover
  const RATIO = 0.75;                 // page width / height
  const RM = matchMedia('(prefers-reduced-motion: reduce)');
  const FINE = matchMedia('(hover: hover) and (pointer: fine)');

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const pad2 = (n) => String(n).padStart(2, '0');
  const src = (dir, i) => `${dir}/p${pad2(i + 1)}.webp`;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  document.documentElement.classList.add('js');

  const stage = $('#stage');
  const desk = $('#desk');
  const bookEl = $('#book');
  const heroCopy = $('#heroCopy');
  const range = $('#range');
  const whereLabel = $('#whereLabel');
  const live = $('#live');

  /* ---------- the magazine's own structure ---------- */

  const TOC = [
    { t: 'Đôi dòng lịch sử', f: 2 },
    { t: 'Qua cổng tam quan', f: 4, s: 1 },
    { t: 'Lặng giữa phố đông', f: 6, s: 2 },
    { t: 'Hồ Long Nhãn', f: 8, s: 3 },
    { t: 'Bảo tháp Nam Thiên', f: 10, s: 4 },
    { t: 'Bia đá', f: 12, s: 5 },
    { t: 'Những chi tiết nhỏ', f: 14, s: 6 },
    { t: 'Tượng & phù điêu', f: 16, s: 7 },
    { t: 'Chánh điện', f: 18, s: 8 },
    { t: 'Người trẻ đến chùa', f: 20, s: 9 },
    { t: 'Cẩm nang đi chùa', f: 22 },
    { t: 'Nhóm thực hiện', f: 24 },
  ];
  // Folio printed on page index i (0-based). Cover and TOC are uncounted.
  const folioOf = (i) => (i >= 2 && i <= N - 2 ? i - 1 : null);
  const indexOfFolio = (f) => f + 1;
  const pageName = (i) =>
    i === 0 ? 'bìa' : i === 1 ? 'mục lục' : i === N - 1 ? 'bìa sau' : `tr. ${pad2(folioOf(i))}`;
  const chapterOf = (i) => {
    const f = folioOf(i);
    if (f === null) return null;
    let hit = null;
    for (const c of TOC) if (c.f <= f) hit = c;
    return hit;
  };
  const altOf = (i) => {
    if (i === 0) return 'Bìa trước tạp chí Nam Thiên Nhất Trụ, số 01';
    if (i === 1) return 'Trang mục lục: chín chặng dạo quanh chùa';
    if (i === N - 1) return 'Bìa sau tạp chí';
    const c = chapterOf(i);
    return `Trang ${pad2(folioOf(i))}${c ? ', ' + c.t : ''}`;
  };
  const slugOf = (i) =>
    i === 1 ? 'muc-luc' : i === N - 1 ? 'bia-sau' : i === 0 ? '' : `trang-${pad2(folioOf(i))}`;
  const indexOfSlug = (h) => {
    if (h === 'muc-luc') return 1;
    if (h === 'bia-sau') return N - 1;
    const m = /^trang-(\d{1,2})$/.exec(h);
    if (m) return clamp(indexOfFolio(parseInt(m[1], 10)), 2, N - 2);
    return 0;
  };

  /* ---------- pages ---------- */

  const imgs = [];
  for (let i = 0; i < N; i++) {
    const page = document.createElement('div');
    page.className = 'page';
    page.dataset.density = 'soft';
    const img = document.createElement('img');
    img.alt = altOf(i);
    img.width = 1200;
    img.height = 1600;
    img.decoding = 'async';
    img.draggable = false;
    img.addEventListener('load', () => img.classList.add('is-loaded'), { once: true });
    page.appendChild(img);
    bookEl.appendChild(page);
    imgs.push(img);
  }
  function want(i) {
    const img = imgs[i];
    if (img && !img.getAttribute('src')) {
      if (i === 0) img.fetchPriority = 'high';
      img.src = src('pages', i);
      // decode ahead so a page's first appearance mid-turn doesn't stall the animation
      if (img.decode) img.decode().catch(() => {});
    }
  }
  function preloadAround(i) {
    for (let k = i - 2; k <= i + 5; k++) if (k >= 0 && k < N) want(k);
  }

  /* ---------- layout: fit the issue to the desk ---------- */

  let pf = null;
  let geo = { portrait: true, pw: 300, ph: 400 };
  const TARGET_FLIP = () => (RM.matches ? 420 : 780);

  function layout() {
    const W = desk.clientWidth;
    const H = desk.clientHeight;
    if (!W || !H) return;
    const g = W < 720 ? 16 : clamp(W * 0.04, 24, 64);
    const vpad = W < 720 ? 22 : 30;
    const availW = W - 2 * g;
    const availH = H - 2 * vpad;
    const landH = Math.min(availH, availW / 2 / RATIO);
    const portH = Math.min(availH, availW / RATIO);
    const portrait = portH > landH * 1.25 || W < 560;
    const ph = Math.floor(portrait ? portH : landH);
    const pw = Math.floor(ph * RATIO);
    const bw = portrait ? pw : pw * 2;
    const bx = Math.round((W - bw) / 2);
    const by = Math.round((H - ph) / 2);
    const hero = !portrait && W >= 900 && ph >= 380;
    const cx = portrait ? bx : hero ? bx + pw : bx + pw / 2;

    const st = stage.style;
    st.setProperty('--bx', bx + 'px');
    st.setProperty('--by', by + 'px');
    st.setProperty('--bw', bw + 'px');
    st.setProperty('--bh', ph + 'px');
    st.setProperty('--pw', pw + 'px');
    st.setProperty('--cx', cx + 'px');
    st.setProperty('--closed-x', (portrait || hero ? 0 : -pw / 2) + 'px');
    st.setProperty('--back-x', (portrait ? 0 : pw / 2) + 'px');
    st.setProperty('--back-shift', (portrait ? 0 : bx + pw / 2 - cx) + 'px');
    st.setProperty('--gutter-x', g + 'px');
    st.setProperty('--hero-w', Math.max(0, bx + pw - 56 - g) + 'px');
    stage.classList.toggle('is-portrait', portrait);
    stage.classList.toggle('is-landscape', !portrait);
    stage.classList.toggle('has-hero', hero);
    stage.classList.toggle('is-short', ph < 300);

    bookEl.style.width = bw + 'px';
    bookEl.style.height = ph + 'px';
    geo = { portrait, pw, ph };

    if (pf) {
      const s = pf.getSettings();
      s.minWidth = portrait ? bw / 2 + 1 : 1;
      // StPageFlip shortens the animation for small books; keep the feel constant.
      s.flippingTime = Math.round((TARGET_FLIP() * 1000) / clamp(2 * pw, 200, 1000));
      pf.update();
      syncUI();
    }
  }

  /* ---------- page-turn sound ---------- */

  const sound = (() => {
    const FILES = [
      { u: 'assets/sound/lat-1.wav', slap: 0.329 },
      { u: 'assets/sound/lat-2.wav', slap: 0.609 },
      { u: 'assets/sound/lat-3.wav', slap: 0.229 },
    ];
    let ctx = null;
    let bufs = [];
    let lastAt = 0;
    let lastK = -1;
    let waiting = 0;
    let on = true;
    try { on = localStorage.getItem('ntnt-sound') !== 'off'; } catch (e) { /* private mode */ }

    // Fetch the bytes early; decoding needs an AudioContext, which needs a gesture.
    const raw = Promise.all(FILES.map((f) => fetch(f.u).then((r) => r.arrayBuffer()))).catch(() => []);
    function decode(ab) {
      return new Promise((res, rej) => ctx.decodeAudioData(ab.slice(0), res, rej));
    }
    function ensure() {
      if (!ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return null;
        ctx = new AC();
        raw
          .then((abs) => Promise.all(abs.map(decode)))
          .then((b) => {
            bufs = b;
            // a flip that happened while decoding still gets its sound
            if (waiting && performance.now() - waiting < 450) play(false);
            waiting = 0;
          })
          .catch(() => { bufs = []; });
      }
      if (ctx.state === 'suspended') ctx.resume();
      return ctx;
    }
    function play(landingOnly) {
      if (!on) return;
      const c = ensure();
      if (!c) return;
      if (!bufs.length) { if (!landingOnly) waiting = performance.now(); return; }
      let k = Math.floor(Math.random() * bufs.length);
      if (k === lastK) k = (k + 1) % bufs.length;
      lastK = k;
      const s = c.createBufferSource();
      s.buffer = bufs[k];
      s.playbackRate.value = 0.95 + Math.random() * 0.1;
      const g = c.createGain();
      g.gain.value = landingOnly ? 0.7 : 0.9;
      s.connect(g);
      g.connect(c.destination);
      if (landingOnly) {
        s.start(0, Math.max(0, FILES[k].slap - 0.08));
      } else {
        // land the paper slap close to where the page lies down
        const delay = clamp((TARGET_FLIP() * 0.62) / 1000 - FILES[k].slap, 0, 0.2);
        s.start(c.currentTime + delay);
      }
      lastAt = performance.now();
    }
    // Audio may only start after a gesture; prepare on the first one.
    const unlock = () => ensure();
    ['pointerdown', 'keydown', 'touchend'].forEach((t) =>
      window.addEventListener(t, unlock, { once: true, passive: true }));

    return {
      flip: () => play(false),
      land: () => { if (performance.now() - lastAt > 900) play(true); },
      get on() { return on; },
      set on(v) {
        on = v;
        try { localStorage.setItem('ntnt-sound', v ? 'on' : 'off'); } catch (e) { /* ignore */ }
        if (v) ensure();
      },
    };
  })();

  /* ---------- reading state ---------- */

  let current = 0;

  function setMode(m) {
    if (stage.dataset.mode !== m) stage.dataset.mode = m;
  }
  function restingMode(i) {
    if (i === 0) return 'closed';
    if (i === N - 1) return 'back';
    return 'open';
  }
  function visiblePages() {
    if (geo.portrait || current === 0 || current === N - 1) return [current];
    const left = current % 2 === 1 ? current : current - 1;
    return [left, left + 1];
  }
  function spreadIndex(i) {
    return geo.portrait ? i : i === 0 ? 0 : Math.floor((i + 1) / 2);
  }
  function pageOfSpread(s) {
    return geo.portrait ? s : s === 0 ? 0 : s * 2 - 1;
  }
  function spreadName(pages) {
    if (pages.length === 1) return pageName(pages[0]);
    if (pages[0] === 1) return 'mục lục';
    return `tr. ${pad2(folioOf(pages[0]))}–${pad2(folioOf(pages[1]))}`;
  }

  function syncUI() {
    const vis = visiblePages();
    const name = spreadName(vis);
    whereLabel.textContent = name;
    const max = geo.portrait ? N - 1 : Math.ceil((N - 1) / 2);
    range.max = String(max);
    range.value = String(spreadIndex(current));
    range.style.setProperty('--p', (spreadIndex(current) / max) * 100 + '%');
    $$('[data-act="prev"], [data-act="first"]').forEach((b) => { b.disabled = current === 0; });
    $$('[data-act="next"], [data-act="last"]').forEach((b) => { b.disabled = current === N - 1; });
    $$('.spread-btn').forEach((b) => {
      const pages = b.dataset.pages.split(',').map(Number);
      b.setAttribute('aria-current', pages.some((p) => vis.includes(p)) ? 'true' : 'false');
    });
    return name;
  }

  function onPageChanged() {
    const name = syncUI();
    live.textContent = `Đang xem ${name}`;
    preloadAround(current);
    const slug = slugOf(current);
    try {
      history.replaceState(null, '', slug ? '#' + slug : location.pathname + location.search);
    } catch (e) { /* file:// in some browsers */ }
  }

  /* ---------- StPageFlip ---------- */

  const hashStart = indexOfSlug(decodeURIComponent(location.hash.slice(1)));

  function initBook() {
    if (!window.St || !window.St.PageFlip) {
      stage.classList.add('is-ready');
      return;
    }
    current = hashStart;
    preloadAround(current);
    want(0);
    layout();
    pf = new window.St.PageFlip(bookEl, {
      width: 450,
      height: 600,
      size: 'stretch',
      minWidth: geo.portrait ? geo.pw / 2 + 1 : 1,
      maxWidth: 4000,
      minHeight: 100,
      maxHeight: 4000,
      autoSize: false,
      showCover: true,
      usePortrait: true,
      drawShadow: true,
      maxShadowOpacity: 0.42,
      flippingTime: Math.round((TARGET_FLIP() * 1000) / clamp(2 * geo.pw, 200, 1000)),
      mobileScrollSupport: true,
      swipeDistance: 30,
      showPageCorners: true,
      startPage: current,
    });
    pf.loadFromHTML($$('.page', bookEl));

    // StPageFlip times a turn from the last animation frame. If that frame was long
    // ago (a busy main thread, e.g. audio starting up), the turn jumps ahead; start
    // the clock on the first frame the turn is actually drawn.
    const render = pf.getRender();
    const startAnimation = render.startAnimation.bind(render);
    const drawFrame = render.render.bind(render);
    let clockPending = false;
    render.startAnimation = (frames, duration, done) => {
      startAnimation(frames, duration, done);
      clockPending = true;
    };
    render.render = (t) => {
      const a = render.animation;
      // after a long task the frame timestamp is the stale vsync time, so use the real clock
      if (clockPending && a) a.startedAt = Math.max(t, performance.now() - 16);
      clockPending = false;
      // a stale timestamp would give a negative frame index; hold on frame 0 instead
      drawFrame(a ? Math.max(t, a.startedAt) : t);
    };

    pf.on('changeState', (e) => {
      const s = e.data;
      if ((s === 'flipping' || s === 'user_fold') && stage.dataset.mode !== 'open') setMode('open');
      if (s === 'flipping') sound.flip();
      if (s === 'read') setMode(restingMode(current));
    });
    pf.on('flip', (e) => {
      current = e.data;
      onPageChanged();
      sound.land();
    });
    pf.on('changeOrientation', () => { syncUI(); });

    layout();
    setMode(restingMode(current));
    onPageChanged();

    requestAnimationFrame(() => {
      stage.classList.add('is-ready');
      if (current === 0 && !RM.matches) {
        stage.classList.add('is-intro');
        setTimeout(() => stage.classList.remove('is-intro'), 1900);
      }
    });
  }

  function flipTo(i) {
    if (!pf) return;
    i = clamp(i, 0, N - 1);
    if (visiblePages().includes(i)) return;
    if (pf.getState() !== 'read') { pf.turnToPage(i); current = i; onPageChanged(); setMode(restingMode(i)); return; }
    pf.flip(i);
  }
  function openIssue() {
    if (!pf || current !== 0) return;
    setMode('open');
    pf.flipNext();
  }

  /* Jump from anywhere on the page: bring the issue into view first. */
  function goto(i) {
    const rect = stage.getBoundingClientRect();
    if (Math.abs(rect.top) < 4) { flipTo(i); return; }
    const behavior = RM.matches ? 'auto' : 'smooth';
    window.scrollTo({ top: 0, behavior });
    let done = false;
    const go = () => { if (!done) { done = true; flipTo(i); } };
    if ('onscrollend' in window && behavior === 'smooth') {
      window.addEventListener('scrollend', go, { once: true });
      setTimeout(go, 1200);
    } else {
      setTimeout(go, behavior === 'smooth' ? 650 : 0);
    }
  }

  /* ---------- toolbar ---------- */

  const soundBtn = $('#soundBtn');
  const fullBtn = $('#fullBtn');
  function paintSound() {
    soundBtn.setAttribute('aria-pressed', String(sound.on));
    $('use', soundBtn).setAttribute('href', sound.on ? '#i-sound' : '#i-mute');
    soundBtn.setAttribute('aria-label', sound.on ? 'Tắt âm thanh lật trang' : 'Bật âm thanh lật trang');
  }
  paintSound();

  const canFull = !!(document.fullscreenEnabled || document.webkitFullscreenEnabled);
  if (!canFull) document.documentElement.classList.add('no-fullscreen');
  function toggleFull() {
    const fsEl = document.fullscreenElement || document.webkitFullscreenElement;
    if (fsEl) (document.exitFullscreen || document.webkitExitFullscreen).call(document);
    else (stage.requestFullscreen || stage.webkitRequestFullscreen).call(stage);
  }
  ['fullscreenchange', 'webkitfullscreenchange'].forEach((t) =>
    document.addEventListener(t, () => {
      const on = !!(document.fullscreenElement || document.webkitFullscreenElement);
      $('use', fullBtn).setAttribute('href', on ? '#i-unfull' : '#i-full');
      fullBtn.setAttribute('aria-label', on ? 'Thoát toàn màn hình' : 'Toàn màn hình');
      requestAnimationFrame(layout);
    }));

  const ACTS = {
    first: () => flipTo(0),
    prev: () => { if (pf && current > 0) pf.flipPrev(); },
    next: () => { if (!pf) return; if (current === 0) openIssue(); else pf.flipNext(); },
    last: () => flipTo(N - 1),
    grid: () => openGrid(),
    search: () => openSearch(),
    zoom: () => openZoom(),
    sound: () => { sound.on = !sound.on; paintSound(); },
    full: () => toggleFull(),
  };
  $('#toolbar').addEventListener('click', (e) => {
    const b = e.target.closest('[data-act]');
    if (b && !b.disabled) ACTS[b.dataset.act]();
  });

  range.addEventListener('input', () => {
    const p = pageOfSpread(+range.value);
    const pages = geo.portrait || p === 0 || p === N - 1 ? [p] : [p, p + 1];
    whereLabel.textContent = spreadName(pages);
    range.style.setProperty('--p', (+range.value / +range.max) * 100 + '%');
  });
  range.addEventListener('change', () => flipTo(pageOfSpread(+range.value)));

  document.addEventListener('click', (e) => {
    const go = e.target.closest('[data-goto]');
    if (go) {
      e.preventDefault();
      const d = go.closest('dialog');
      if (d) closeDialog(d);
      goto(+go.dataset.goto);
      return;
    }
    if (e.target.closest('[data-open]')) openIssue();
  });

  // Swiping the closed cover opens it too.
  (() => {
    const hit = $('.cover-hit');
    let x0 = null;
    hit.addEventListener('pointerdown', (e) => { x0 = e.clientX; });
    hit.addEventListener('pointerup', (e) => {
      if (x0 !== null && x0 - e.clientX > 30) openIssue();
      x0 = null;
    });
  })();

  document.addEventListener('keydown', (e) => {
    if (document.querySelector('dialog[open]')) return;
    const t = e.target;
    if (t && (t.matches('input, textarea, select') || t.isContentEditable)) return;
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const stageInView = stage.getBoundingClientRect().bottom > innerHeight * 0.5;
    if (!stageInView) return;
    const k = e.key;
    if (k === 'ArrowRight' || k === 'PageDown') { e.preventDefault(); ACTS.next(); }
    else if (k === 'ArrowLeft' || k === 'PageUp') { e.preventDefault(); ACTS.prev(); }
    else if (k === 'Home') { e.preventDefault(); ACTS.first(); }
    else if (k === 'End') { e.preventDefault(); ACTS.last(); }
  });

  /* ---------- share ---------- */

  const toastEl = $('#toast');
  let toastT = 0;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('is-on');
    clearTimeout(toastT);
    toastT = setTimeout(() => toastEl.classList.remove('is-on'), 2400);
  }
  $('#shareBtn').addEventListener('click', async () => {
    const url = location.href.split('#')[0];
    const data = { title: 'Nam Thiên Nhất Trụ · Số 01', text: 'Tạp chí điện tử Nam Thiên Nhất Trụ, số 01', url };
    if (navigator.share) {
      try { await navigator.share(data); } catch (e) { /* dismissed */ }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      toast('Đã chép link tạp chí');
    } catch (e) {
      toast(url);
    }
  });
  $('#toTop').addEventListener('click', () => window.scrollTo({ top: 0, behavior: RM.matches ? 'auto' : 'smooth' }));
  $('.mark').addEventListener('click', (e) => { e.preventDefault(); });

  /* ---------- dialogs ---------- */

  function openDialog(d) {
    d.classList.remove('is-closing');
    if (!d.open) d.showModal();
  }
  function closeDialog(d) {
    if (!d.open || d.classList.contains('is-closing')) return;
    if (RM.matches) { d.close(); return; }
    d.classList.add('is-closing');
    let finished = false;
    const end = () => {
      if (finished) return;
      finished = true;
      d.classList.remove('is-closing');
      d.close();
    };
    d.addEventListener('animationend', end, { once: true });
    setTimeout(end, 320);
  }
  $$('dialog').forEach((d) => {
    d.addEventListener('cancel', (e) => { e.preventDefault(); closeDialog(d); });
    d.addEventListener('click', (e) => {
      if (e.target === d && !d.classList.contains('zoom')) closeDialog(d);
      if (e.target.closest('[data-close]')) closeDialog(d);
    });
  });

  /* thumbnails */
  const gridSheet = $('#gridSheet');
  const grid = $('#grid');
  (function buildGrid() {
    const spreads = [[0]];
    for (let i = 1; i < N - 1; i += 2) spreads.push([i, i + 1]);
    spreads.push([N - 1]);
    const frag = document.createDocumentFragment();
    spreads.forEach((pages) => {
      const li = document.createElement('li');
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'spread-btn';
      b.dataset.pages = pages.join(',');
      b.dataset.goto = String(pages[0]);
      const box = document.createElement('span');
      box.className = 'spread-pages' + (pages.length === 1 ? ' is-single ' + (pages[0] === 0 ? 'is-right' : 'is-left') : '');
      pages.forEach((p) => {
        const im = document.createElement('img');
        im.src = src('thumbs', p);
        im.alt = '';
        im.loading = 'lazy';
        im.width = 300;
        im.height = 400;
        box.appendChild(im);
      });
      const lab = document.createElement('span');
      lab.className = 'spread-label';
      lab.textContent = spreadName(pages);
      b.setAttribute('aria-label', `Đến ${lab.textContent}`);
      b.append(box, lab);
      li.appendChild(b);
      frag.appendChild(li);
    });
    grid.appendChild(frag);
  })();
  function openGrid() {
    syncUI();
    openDialog(gridSheet);
    const cur = $('.spread-btn[aria-current="true"]', grid);
    if (cur) cur.scrollIntoView({ block: 'center' });
  }

  /* search */
  const searchSheet = $('#searchSheet');
  const q = $('#q');
  const results = $('#results');
  const count = $('#searchCount');
  const fold = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();
  const esc = (s) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const index = (window.MAG_TEXT || []).map((raw) => {
    const orig = raw.normalize('NFC');
    let folded = '';
    const map = [];
    for (let k = 0; k < orig.length; k++) {
      const f = fold(orig[k]);
      for (let j = 0; j < f.length; j++) { folded += f[j]; map.push(k); }
    }
    return { orig, folded, map };
  });
  function runSearch() {
    const term = fold(q.value.trim().replace(/\s+/g, ' '));
    results.innerHTML = '';
    if (term.length < 2) { count.textContent = ''; return; }
    let pagesHit = 0;
    const frag = document.createDocumentFragment();
    index.forEach((p, i) => {
      const at = p.folded.indexOf(term);
      if (at < 0) return;
      pagesHit++;
      let hits = 0;
      for (let k = at; k >= 0; k = p.folded.indexOf(term, k + term.length)) hits++;
      const s = p.map[at];
      const e = p.map[at + term.length - 1] + 1;
      const a = Math.max(0, s - 70);
      const b = Math.min(p.orig.length, e + 90);
      const snip = (a > 0 ? '… ' : '') + esc(p.orig.slice(a, s)) + '<mark>' + esc(p.orig.slice(s, e)) + '</mark>' + esc(p.orig.slice(e, b)) + (b < p.orig.length ? ' …' : '');
      const c = chapterOf(i);
      const li = document.createElement('li');
      li.innerHTML =
        `<button type="button" class="result" data-goto="${i}">` +
        `<img src="${src('thumbs', i)}" alt="" width="300" height="400" loading="lazy">` +
        `<span><span class="result-where">${esc(pageName(i))}${c ? ' · ' + esc(c.t) : ''}${hits > 1 ? ` · ${hits} chỗ` : ''}</span>` +
        `<span class="result-snip">${snip}</span></span></button>`;
      frag.appendChild(li);
    });
    results.appendChild(frag);
    count.textContent = pagesHit
      ? `Thấy ở ${pagesHit} trang`
      : `Không thấy “${q.value.trim()}” trong tạp chí. Thử từ khác, ví dụ: tam quan.`;
  }
  let searchT = 0;
  q.addEventListener('input', () => { clearTimeout(searchT); searchT = setTimeout(runSearch, 120); });
  function openSearch() {
    openDialog(searchSheet);
    setTimeout(() => q.focus(), 60);
  }

  /* zoom */
  const zoomView = $('#zoomView');
  const zScroll = $('#zoomScroll');
  const zCanvas = $('#zoomCanvas');
  const zLevel = $('#zoomLevel');
  const STEPS = [1, 1.5, 2, 3, 4];
  let z = 1;
  let base = 0;

  function zoomBase(n) {
    const vw = zScroll.clientWidth || innerWidth;
    const vh = zScroll.clientHeight || innerHeight;
    return Math.min(vw - 24, (vh - 120) * RATIO * n);
  }
  function setZoom(nz, px, py) {
    nz = clamp(nz, 1, 4);
    const r = zScroll.getBoundingClientRect();
    const cx = px === undefined ? r.width / 2 : px - r.left;
    const cy = py === undefined ? r.height / 2 : py - r.top;
    const k = nz / z;
    const sl = zScroll.scrollLeft;
    const stp = zScroll.scrollTop;
    z = nz;
    zCanvas.style.width = Math.round(base * z) + 'px';
    zLevel.textContent = Math.round(z * 100) + '%';
    zScroll.scrollLeft = (sl + cx) * k - cx;
    zScroll.scrollTop = (stp + cy) * k - cy;
  }
  function openZoom() {
    const pages = visiblePages();
    zCanvas.innerHTML = '';
    zCanvas.style.setProperty('--n', pages.length);
    pages.forEach((p) => {
      const im = document.createElement('img');
      im.alt = altOf(p);
      im.width = 1200;
      im.height = 1600;
      im.draggable = false;
      im.src = src('pages', p);
      const hd = new Image();
      hd.onload = () => { im.src = hd.src; };
      hd.src = src('hd', p);
      zCanvas.appendChild(im);
    });
    openDialog(zoomView);
    z = 1;
    base = zoomBase(pages.length);
    zCanvas.style.width = Math.round(base) + 'px';
    zLevel.textContent = '100%';
    zScroll.scrollTo(0, 0);
    const hint = $('.zoom-hint', zoomView);
    hint.style.animation = 'none';
    void hint.offsetWidth;
    hint.style.animation = '';
  }
  zoomView.addEventListener('click', (e) => {
    const b = e.target.closest('[data-z]');
    if (!b) return;
    const dir = +b.dataset.z;
    const next = dir > 0 ? STEPS.find((s) => s > z + 0.01) : [...STEPS].reverse().find((s) => s < z - 0.01);
    setZoom(next || z);
  });
  zScroll.addEventListener('dblclick', (e) => setZoom(z > 1.2 ? 1 : 2.5, e.clientX, e.clientY));
  addEventListener('resize', () => {
    if (!zoomView.open) return;
    base = zoomBase(+zCanvas.style.getPropertyValue('--n') || 1);
    zCanvas.style.width = Math.round(base * z) + 'px';
  });

  // pinch and double-tap on touch screens
  (() => {
    let d0 = 0;
    let z0 = 1;
    let lastTap = 0;
    let tapX = 0;
    let tapY = 0;
    const dist = (t) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
    zScroll.addEventListener('touchstart', (e) => {
      if (e.touches.length === 2) { d0 = dist(e.touches); z0 = z; }
    }, { passive: true });
    zScroll.addEventListener('touchmove', (e) => {
      if (e.touches.length !== 2 || !d0) return;
      e.preventDefault();
      const mx = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      const my = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      setZoom(z0 * (dist(e.touches) / d0), mx, my);
    }, { passive: false });
    zScroll.addEventListener('touchend', (e) => {
      if (e.touches.length < 2) d0 = 0;
      if (e.changedTouches.length !== 1 || e.touches.length) return;
      const t = e.changedTouches[0];
      const now = Date.now();
      if (now - lastTap < 300 && Math.hypot(t.clientX - tapX, t.clientY - tapY) < 30) {
        e.preventDefault();
        setZoom(z > 1.2 ? 1 : 2.5, t.clientX, t.clientY);
        lastTap = 0;
      } else {
        lastTap = now; tapX = t.clientX; tapY = t.clientY;
      }
    });
  })();

  // drag to pan with a mouse
  (() => {
    let drag = null;
    zScroll.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      drag = { x: e.clientX, y: e.clientY, l: zScroll.scrollLeft, t: zScroll.scrollTop };
      zScroll.classList.add('is-dragging');
    });
    addEventListener('pointermove', (e) => {
      if (!drag) return;
      zScroll.scrollLeft = drag.l - (e.clientX - drag.x);
      zScroll.scrollTop = drag.t - (e.clientY - drag.y);
    });
    addEventListener('pointerup', () => { drag = null; zScroll.classList.remove('is-dragging'); });
  })();

  /* ---------- contents list below the issue ---------- */

  const tocList = $('#tocList');
  TOC.forEach((c, n) => {
    const i = indexOfFolio(c.f);
    const li = document.createElement('li');
    li.innerHTML =
      `<button type="button" class="toc-row" data-goto="${i}" style="--i:${n}">` +
      `<img class="toc-thumb" src="${src('thumbs', i)}" alt="" width="300" height="400" loading="lazy">` +
      `<span class="toc-text"><span class="toc-stop">${c.s ? 'chặng ' + pad2(c.s) : ''}</span>` +
      `<span class="toc-title">${esc(c.t)}<svg viewBox="0 0 120 12" preserveAspectRatio="none" aria-hidden="true"><path pathLength="1" d="M2 7.5c20-3 40-4.2 60-3.8 19 .4 37 1.9 55 3.9"/></svg></span></span>` +
      `<span class="toc-folio">tr. ${pad2(c.f)}</span></button>`;
    tocList.appendChild(li);
  });

  // a page peeks out beside the cursor while browsing the list
  (() => {
    const peek = $('#tocPeek');
    const im = document.createElement('img');
    im.alt = '';
    peek.appendChild(im);
    let tx = -999, ty = -999, x = -999, y = -999, raf = 0, rot = 4;
    const tick = () => {
      x += (tx - x) * 0.18;
      y += (ty - y) * 0.18;
      peek.style.setProperty('--px', x.toFixed(1) + 'px');
      peek.style.setProperty('--py', y.toFixed(1) + 'px');
      peek.style.setProperty('--pr', rot.toFixed(2) + 'deg');
      raf = Math.abs(tx - x) + Math.abs(ty - y) > 0.5 ? requestAnimationFrame(tick) : 0;
    };
    tocList.addEventListener('pointermove', (e) => {
      if (!FINE.matches || innerWidth < 720) return;
      const row = e.target.closest('.toc-row');
      if (!row) { peek.classList.remove('is-on'); return; }
      const want = src('thumbs', +row.dataset.goto);
      if (!im.src.endsWith(want)) im.src = want;
      // ride in a column beside the page numbers so the titles stay readable
      tx = tocList.getBoundingClientRect().right - 300;
      ty = clamp(e.clientY - 112, 12, innerHeight - 236);
      rot = clamp((e.movementY || 0) * 0.6 + 4, -3, 10);
      if (x < -900) { x = tx; y = ty; }
      peek.classList.add('is-on');
      if (!raf) raf = requestAnimationFrame(tick);
    });
    tocList.addEventListener('pointerleave', () => peek.classList.remove('is-on'));
  })();

  /* ---------- small reveals below the fold ---------- */

  if ('IntersectionObserver' in window) {
    const reveal = (cls, opts) => new IntersectionObserver((entries, io) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        en.target.classList.add(cls);
        io.unobserve(en.target);
      });
    }, opts);
    const markers = reveal('is-drawn', { threshold: 0.6 });
    $$('.marker').forEach((el) => markers.observe(el));
    reveal('in-view', { threshold: 0, rootMargin: '0px 0px -12% 0px' }).observe(tocList);
  } else {
    $$('.marker').forEach((el) => el.classList.add('is-drawn'));
    tocList.classList.add('in-view');
  }

  $$('.sticker').forEach((s, n) => s.style.setProperty('--i', n));
  $$('.display .line > span').forEach((s, n) => s.style.setProperty('--i', n));
  [$('.lede'), $('.hero-copy .pill-lg'), $('.info')].forEach((el, n) => el && el.style.setProperty('--i', n));

  /* ---------- go ---------- */

  let rafL = 0;
  const relayout = () => { cancelAnimationFrame(rafL); rafL = requestAnimationFrame(layout); };
  if ('ResizeObserver' in window) new ResizeObserver(relayout).observe(desk);
  else addEventListener('resize', relayout);

  initBook();
})();
