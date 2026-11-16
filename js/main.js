/* =========================================================
   Dog Cleaning Services — interactions & animation
   ========================================================= */
(function () {
  'use strict';

  var d = document;
  var root = d.documentElement;
  var body = d.body;
  var reduced = root.classList.contains('reduced');
  var G = window.gsap;
  var ST = window.ScrollTrigger;
  var hasG = !!(G && ST);
  var fine = window.matchMedia && matchMedia('(hover: hover) and (pointer: fine)').matches;
  var DPR = Math.min(window.devicePixelRatio || 1, 2);
  var lenis = null;

  if (hasG) G.registerPlugin(ST);

  function $(s, c) { return (c || d).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); }
  function rand(a, b) { return a + Math.random() * (b - a); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function onVisible(el, cb) {
    if (!('IntersectionObserver' in window)) { cb(true); return; }
    new IntersectionObserver(function (es) { es.forEach(function (e) { cb(e.isIntersecting); }); }, { rootMargin: '100px' }).observe(el);
  }

  var yearEl = $('.year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* -------------------------------------------------------
     Smooth scrolling
     ------------------------------------------------------- */
  if (!reduced && window.Lenis) {
    lenis = new window.Lenis({ lerp: 0.1, wheelMultiplier: 1, smoothWheel: true });
    if (hasG) {
      lenis.on('scroll', ST.update);
      G.ticker.add(function (t) { lenis.raf(t * 1000); });
      G.ticker.lagSmoothing(0);
    } else {
      (function raf(t) { lenis.raf(t); requestAnimationFrame(raf); })(0);
    }
  }

  function scrollToTarget(target) {
    var navH = 70;
    if (lenis) {
      lenis.scrollTo(target, { offset: target === 0 ? 0 : -navH + 10, duration: 1.4 });
    } else if (target === 0) {
      window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
    } else {
      var y = target.getBoundingClientRect().top + window.pageYOffset - navH + 10;
      window.scrollTo({ top: y, behavior: reduced ? 'auto' : 'smooth' });
    }
  }

  d.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a) return;
    var id = a.getAttribute('href');
    if (id.length < 2) return;
    var el = $(id);
    if (!el) return;
    e.preventDefault();
    closeMenu();
    scrollToTarget(id === '#home' || id === '#top' ? 0 : el);
    if (history.replaceState) history.replaceState(null, '', id);
  });

  /* -------------------------------------------------------
     Nav: scrolled state, hide on scroll down, active link
     ------------------------------------------------------- */
  var nav = $('.nav');
  var progress = $('.progress span');
  var lastY = window.pageYOffset;
  var scrollVel = 0;

  function onScroll() {
    var y = window.pageYOffset;
    var max = d.documentElement.scrollHeight - window.innerHeight;
    scrollVel = y - lastY;
    if (nav) {
      nav.classList.toggle('is-scrolled', y > 40);
      if (!menuOpen) {
        if (y > 400 && scrollVel > 4) nav.classList.add('is-hidden');
        else if (scrollVel < -4 || y < 400) nav.classList.remove('is-hidden');
      }
    }
    if (progress) progress.style.transform = 'scaleX(' + (max > 0 ? y / max : 0) + ')';
    lastY = y;
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  var navLinks = $$('.nav__links a');
  if ('IntersectionObserver' in window && navLinks.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        navLinks.forEach(function (l) { l.classList.toggle('is-active', l.getAttribute('href') === '#' + e.target.id); });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    navLinks.forEach(function (l) { var s = $(l.getAttribute('href')); if (s) io.observe(s); });
  }

  /* -------------------------------------------------------
     Mobile menu
     ------------------------------------------------------- */
  var burger = $('.burger');
  var mmenu = $('#mobile-menu');
  var menuOpen = false;
  var menuTimer;

  function openMenu() {
    if (!mmenu || menuOpen) return;
    menuOpen = true;
    clearTimeout(menuTimer);
    mmenu.hidden = false;
    void mmenu.offsetWidth;
    mmenu.classList.add('is-open');
    burger.setAttribute('aria-expanded', 'true');
    burger.setAttribute('aria-label', 'Close menu');
    nav.classList.remove('is-hidden');
    if (lenis) lenis.stop();
    body.style.overflow = 'hidden';
  }
  function closeMenu() {
    if (!mmenu || !menuOpen) return;
    menuOpen = false;
    mmenu.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Open menu');
    if (lenis) lenis.start();
    body.style.overflow = '';
    menuTimer = setTimeout(function () { mmenu.hidden = true; }, 700);
  }
  if (burger) burger.addEventListener('click', function () { menuOpen ? closeMenu() : openMenu(); });
  d.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });
  window.addEventListener('resize', function () { if (window.innerWidth > 1180) closeMenu(); });

  /* -------------------------------------------------------
     Text splitting helpers
     ------------------------------------------------------- */
  function splitWords(el) {
    var walker = d.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
    var nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(function (node) {
      var parts = node.textContent.split(/(\s+)/);
      var frag = d.createDocumentFragment();
      parts.forEach(function (p) {
        if (!p) return;
        if (/^\s+$/.test(p)) { frag.appendChild(d.createTextNode(' ')); return; }
        var w = d.createElement('span'); w.className = 'w';
        var i = d.createElement('span'); i.textContent = p;
        w.appendChild(i); frag.appendChild(w);
      });
      node.parentNode.replaceChild(frag, node);
    });
    return $$('.w > span', el);
  }

  function splitPlainWords(el) {
    var words = el.textContent.trim().split(/\s+/);
    el.textContent = '';
    return words.map(function (w, i) {
      var s = d.createElement('span'); s.className = 'word'; s.textContent = w;
      el.appendChild(s);
      if (i < words.length - 1) el.appendChild(d.createTextNode(' '));
      return s;
    });
  }

  /* -------------------------------------------------------
     Soap bubbles canvas (hero + contact)
     ------------------------------------------------------- */
  function Bubbles(canvas, opts) {
    var ctx = canvas.getContext('2d');
    var W = 0, H = 0, bubbles = [], parts = [], running = false, visible = false;
    var mouse = { x: -999, y: -999 };
    var hues = ['47,214,232', '124,184,255', '255,95,162', '255,210,63'];
    var self = this;

    function make(atBottom, x, y, r) {
      r = r || rand(opts.min, opts.max);
      return {
        x: x != null ? x : rand(0, W), y: y != null ? y : (atBottom ? H + r + rand(0, 200) : rand(0, H)),
        r: r, vy: rand(0.25, 0.9) * (opts.speed || 1), vx: rand(-0.2, 0.2), ph: rand(0, Math.PI * 2),
        hue: hues[(Math.random() * hues.length) | 0], s: x != null ? 0 : 1
      };
    }
    function resize() {
      var r = canvas.getBoundingClientRect();
      W = r.width; H = r.height;
      canvas.width = W * DPR; canvas.height = H * DPR;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      var n = Math.round(opts.count * clamp(W / 1400, 0.45, 1));
      while (bubbles.length < n) bubbles.push(make(false));
      bubbles.length = n;
    }
    function drawBubble(b) {
      var r = b.r * b.s;
      if (r < 0.5) return;
      var wob = Math.sin(b.ph) * 0.05;
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.scale(1 + wob, 1 - wob);
      var g = ctx.createRadialGradient(-r * 0.3, -r * 0.35, r * 0.1, 0, 0, r);
      g.addColorStop(0, 'rgba(255,255,255,0.05)');
      g.addColorStop(0.75, 'rgba(' + b.hue + ',0.08)');
      g.addColorStop(1, 'rgba(' + b.hue + ',0.4)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
      var lg = ctx.createLinearGradient(-r, -r, r, r);
      lg.addColorStop(0, 'rgba(47,214,232,0.75)');
      lg.addColorStop(0.5, 'rgba(255,95,162,0.55)');
      lg.addColorStop(1, 'rgba(255,210,63,0.7)');
      ctx.strokeStyle = lg; ctx.lineWidth = Math.max(1, r * 0.04);
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.beginPath(); ctx.ellipse(-r * 0.4, -r * 0.42, r * 0.2, r * 0.1, -0.7, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(r * 0.45, r * 0.4, r * 0.05, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    function pop(b) {
      var n = Math.round(10 + b.r / 3);
      for (var i = 0; i < n; i++) {
        var a = (i / n) * Math.PI * 2 + rand(-0.2, 0.2), sp = rand(1.5, 4.5);
        parts.push({ x: b.x + Math.cos(a) * b.r, y: b.y + Math.sin(a) * b.r, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 1, r: rand(1.2, 3), hue: b.hue });
      }
      parts.push({ ring: true, x: b.x, y: b.y, r: b.r, life: 1, hue: b.hue });
    }
    function tick() {
      if (!running) return;
      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < bubbles.length; i++) {
        var b = bubbles[i];
        b.ph += 0.03;
        b.y -= b.vy;
        b.x += b.vx + Math.sin(b.ph * 0.6) * 0.35;
        if (b.s < 1) b.s = Math.min(1, b.s + 0.06);
        var dx = b.x - mouse.x, dy = b.y - mouse.y, dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < b.r + 90 && dist > 0) { var f = (b.r + 90 - dist) / 90; b.x += (dx / dist) * f * 2.4; b.y += (dy / dist) * f * 2.4; }
        if (b.y < -b.r - 20) bubbles[i] = make(true);
        drawBubble(b);
      }
      for (var j = parts.length - 1; j >= 0; j--) {
        var p = parts[j];
        if (p.ring) {
          p.r += 3; p.life -= 0.06;
          ctx.strokeStyle = 'rgba(' + p.hue + ',' + Math.max(0, p.life) + ')'; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.stroke();
        } else {
          p.x += p.vx; p.y += p.vy; p.vy += 0.12; p.vx *= 0.98; p.life -= 0.025;
          ctx.fillStyle = 'rgba(' + p.hue + ',' + Math.max(0, p.life) + ')';
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r * p.life + 0.3, 0, Math.PI * 2); ctx.fill();
        }
        if (p.life <= 0) parts.splice(j, 1);
      }
      requestAnimationFrame(tick);
    }
    function setRun(v) { visible = v; if (v && !running && !d.hidden) { running = true; requestAnimationFrame(tick); } else if (!v) running = false; }

    this.hit = function (x, y) {
      for (var i = bubbles.length - 1; i >= 0; i--) {
        var b = bubbles[i], dx = x - b.x, dy = y - b.y;
        if (dx * dx + dy * dy < (b.r + 8) * (b.r + 8)) { pop(b); bubbles[i] = make(true); return true; }
      }
      return false;
    };
    this.spawn = function (x, y) {
      for (var k = 0; k < 3; k++) bubbles.push(make(false, x + rand(-30, 30), y + rand(-20, 20), rand(opts.min, opts.max * 0.7)));
      if (bubbles.length > opts.count * 1.8) bubbles.splice(0, 3);
    };
    this.mouse = function (x, y) { mouse.x = x; mouse.y = y; };

    resize();
    if ('ResizeObserver' in window) new ResizeObserver(resize).observe(canvas);
    else window.addEventListener('resize', resize);
    onVisible(canvas, setRun);
    d.addEventListener('visibilitychange', function () { setRun(visible && !d.hidden); });
    return self;
  }

  var hero = $('.hero');
  var heroCanvas = $('.hero__bubbles');
  if (heroCanvas && !reduced) {
    var heroB = new Bubbles(heroCanvas, { count: 22, min: 14, max: 64, speed: 1 });
    var hint = $('.hero__hint');
    hero.addEventListener('pointermove', function (e) {
      var r = heroCanvas.getBoundingClientRect();
      heroB.mouse(e.clientX - r.left, e.clientY - r.top);
    });
    hero.addEventListener('pointerleave', function () { heroB.mouse(-999, -999); });
    hero.addEventListener('pointerdown', function (e) {
      if (e.target.closest('a, button')) return;
      var r = heroCanvas.getBoundingClientRect();
      var x = e.clientX - r.left, y = e.clientY - r.top;
      if (!heroB.hit(x, y)) heroB.spawn(x, y);
      if (hint) { hint.style.transition = 'opacity .6s'; hint.style.opacity = '0'; }
    });
  }
  var contactCanvas = $('.contact__bubbles');
  if (contactCanvas && !reduced) new Bubbles(contactCanvas, { count: 16, min: 10, max: 46, speed: 0.6 });

  /* -------------------------------------------------------
     Custom cursor + bubble trail
     ------------------------------------------------------- */
  var cursor = $('.cursor');
  if (cursor && fine && !reduced) {
    body.classList.add('has-cursor');
    var dot = $('.cursor__dot', cursor), ring = $('.cursor__ring', cursor);
    var mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my, lastTrail = 0, live = 0;
    var hoverSel = 'a, button, .card, .bub, .acc__btn, select, label, .gcol img, .hero__bubbles';
    d.addEventListener('pointermove', function (e) {
      mx = e.clientX; my = e.clientY;
      dot.style.transform = 'translate(' + mx + 'px,' + my + 'px)';
      cursor.classList.remove('is-hidden');
      var now = performance.now();
      if (now - lastTrail > 55 && live < 18 && !e.target.closest('.scrub__stage, input, textarea')) {
        lastTrail = now; trail(mx, my);
      }
    }, { passive: true });
    d.addEventListener('pointerover', function (e) {
      var t = e.target.closest && e.target.closest(hoverSel);
      cursor.classList.toggle('is-hover', !!t && !t.matches('.hero__bubbles'));
    });
    d.addEventListener('pointerdown', function () { cursor.classList.add('is-down'); });
    d.addEventListener('pointerup', function () { cursor.classList.remove('is-down'); });
    d.addEventListener('mouseleave', function () { cursor.classList.add('is-hidden'); });
    (function loop() {
      rx += (mx - rx) * 0.18; ry += (my - ry) * 0.18;
      ring.style.transform = 'translate(' + rx + 'px,' + ry + 'px)';
      requestAnimationFrame(loop);
    })();
    function trail(x, y) {
      if (!Element.prototype.animate) return;
      var s = rand(6, 16), b = d.createElement('span');
      b.className = 'cbub';
      b.style.cssText = 'left:' + (x - s / 2) + 'px;top:' + (y - s / 2) + 'px;width:' + s + 'px;height:' + s + 'px';
      body.appendChild(b); live++;
      var a = b.animate([
        { transform: 'translate(0,0) scale(.4)', opacity: 0.9 },
        { transform: 'translate(' + rand(-24, 24) + 'px,' + rand(-70, -40) + 'px) scale(1)', opacity: 0 }
      ], { duration: rand(700, 1100), easing: 'cubic-bezier(.2,.8,.2,1)' });
      a.onfinish = function () { b.remove(); live--; };
    }
  }

  /* -------------------------------------------------------
     Marquee driven by scroll velocity
     ------------------------------------------------------- */
  var mTrack = $('.marquee__track');
  if (mTrack) {
    if (reduced) {
      mTrack.style.transform = 'none';
    } else {
      var mx0 = 0, dir = 1, boost = 0, mVisible = true;
      onVisible(mTrack, function (v) { mVisible = v; });
      (function mloop() {
        if (mVisible) {
          var v = lenis ? lenis.velocity : scrollVel;
          if (Math.abs(v) > 0.5) dir = v > 0 ? 1 : -1;
          boost += (clamp(Math.abs(v), 0, 60) - boost) * 0.1;
          mx0 -= (0.8 + boost * 0.35) * dir;
          var half = mTrack.scrollWidth / 2;
          if (half > 0) { if (mx0 <= -half) mx0 += half; if (mx0 > 0) mx0 -= half; }
          mTrack.style.transform = 'translate3d(' + mx0 + 'px,0,0) skewX(' + (-clamp(boost, 0, 30) * 0.3 * dir) + 'deg)';
        }
        requestAnimationFrame(mloop);
      })();
    }
  }

  /* -------------------------------------------------------
     Accordion
     ------------------------------------------------------- */
  var refreshT;
  function refreshLater() { if (!hasG) return; clearTimeout(refreshT); refreshT = setTimeout(function () { ST.refresh(); }, 560); }
  function setPanel(btn, open) {
    var panel = $('#' + btn.getAttribute('aria-controls'));
    var item = btn.closest('.acc__item');
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    item.classList.toggle('is-open', open);
    if (reduced) { panel.style.height = open ? 'auto' : '0px'; return; }
    panel.style.height = panel.scrollHeight + 'px';
    if (!open) { void panel.offsetHeight; panel.style.height = '0px'; }
    else {
      panel.addEventListener('transitionend', function te() {
        panel.removeEventListener('transitionend', te);
        if (btn.getAttribute('aria-expanded') === 'true') panel.style.height = 'auto';
      });
    }
  }
  $$('.acc__btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var open = btn.getAttribute('aria-expanded') !== 'true';
      $$('.acc__btn[aria-expanded="true"]').forEach(function (o) { if (o !== btn) setPanel(o, false); });
      setPanel(btn, open);
      refreshLater();
    });
  });

  /* -------------------------------------------------------
     Scrub test
     ------------------------------------------------------- */
  (function scrub() {
    var stage = $('.scrub__stage');
    if (!stage) return;
    var mud = $('.scrub__mud', stage), fx = $('.scrub__fx', stage);
    var mctx = mud.getContext('2d'), fctx = fx.getContext('2d');
    var meterVal = $('.meter__val'), meterFill = $('.meter__fill');
    var W = 0, H = 0, drawing = false, last = null, clean = false, foam = [], fxRunning = false, autoRun = false;
    var lastCheck = 0, pct = 0;

    function size() {
      var r = stage.getBoundingClientRect();
      if (Math.abs(r.width - W) < 2 && W) return;
      var copy = null;
      if (W) { copy = d.createElement('canvas'); copy.width = mud.width; copy.height = mud.height; copy.getContext('2d').drawImage(mud, 0, 0); }
      W = r.width; H = r.height;
      [mud, fx].forEach(function (c) { c.width = W * DPR; c.height = H * DPR; });
      mctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      fctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      if (copy) { mctx.save(); mctx.setTransform(1, 0, 0, 1, 0, 0); mctx.drawImage(copy, 0, 0, mud.width, mud.height); mctx.restore(); }
      else paintMud();
    }

    function paintMud() {
      mctx.globalCompositeOperation = 'source-over';
      mctx.clearRect(0, 0, W, H);
      var g = mctx.createLinearGradient(0, 0, W, H);
      g.addColorStop(0, '#5a3d22'); g.addColorStop(0.5, '#6e4a2a'); g.addColorStop(1, '#4a3019');
      mctx.fillStyle = g; mctx.fillRect(0, 0, W, H);
      var browns = ['#3f2914', '#7a5531', '#8b6239', '#553719', '#2f1e0e', '#9a7045'];
      for (var i = 0; i < 160; i++) {
        mctx.fillStyle = browns[(Math.random() * browns.length) | 0];
        mctx.globalAlpha = rand(0.25, 0.7);
        mctx.beginPath();
        var x = rand(0, W), y = rand(0, H), r = rand(8, W * 0.08);
        mctx.ellipse(x, y, r, r * rand(0.5, 1), rand(0, Math.PI), 0, Math.PI * 2);
        mctx.fill();
      }
      for (var k = 0; k < 500; k++) {
        mctx.fillStyle = browns[(Math.random() * browns.length) | 0];
        mctx.globalAlpha = rand(0.4, 0.9);
        mctx.beginPath(); mctx.arc(rand(0, W), rand(0, H), rand(0.8, 4), 0, Math.PI * 2); mctx.fill();
      }
      // drips
      for (var j = 0; j < 14; j++) {
        var dx = rand(0, W), dl = rand(H * 0.1, H * 0.35), dw = rand(6, 16);
        mctx.globalAlpha = 0.6; mctx.fillStyle = '#3a2612';
        mctx.beginPath(); mctx.roundRect ? mctx.roundRect(dx, rand(-10, H * 0.3), dw, dl, dw / 2) : mctx.rect(dx, 0, dw, dl); mctx.fill();
      }
      mctx.globalAlpha = 1;
      clean = false; pct = 0;
      stage.classList.remove('is-clean', 'is-touched');
      updateMeter(0);
    }

    function updateMeter(p) {
      if (meterVal) meterVal.textContent = p + '%';
      if (meterFill) meterFill.style.transform = 'scaleX(' + p / 100 + ')';
    }

    function erase(x0, y0, x1, y1) {
      var bw = Math.max(34, W * 0.075);
      mctx.globalCompositeOperation = 'destination-out';
      mctx.lineCap = 'round'; mctx.lineJoin = 'round';
      mctx.lineWidth = bw;
      mctx.beginPath(); mctx.moveTo(x0, y0); mctx.lineTo(x1, y1); mctx.stroke();
      mctx.globalCompositeOperation = 'source-over';
      for (var i = 0; i < 2; i++) foam.push({ x: x1 + rand(-bw / 2, bw / 2), y: y1 + rand(-bw / 2, bw / 2), r: rand(3, 11), vy: rand(0.3, 1.2), vx: rand(-0.6, 0.6), life: 1, spark: false });
      startFx();
      var now = performance.now();
      if (now - lastCheck > 140) { lastCheck = now; measure(); }
    }

    function measure() {
      if (clean) return;
      var data;
      try { data = mctx.getImageData(0, 0, mud.width, mud.height).data; } catch (err) { return; }
      var step = 16 * 4 * 3, total = 0, clear = 0;
      for (var i = 3; i < data.length; i += step) { total++; if (data[i] < 40) clear++; }
      var raw = clear / total;
      pct = clamp(Math.round((raw / 0.88) * 100), 0, 100);
      updateMeter(pct);
      if (pct >= 100) finish();
    }

    function finish() {
      clean = true; autoRun = false;
      updateMeter(100);
      if (hasG) G.to(mud, { opacity: 0, duration: 0.6, onComplete: function () { mctx.clearRect(0, 0, W, H); mud.style.opacity = 1; } });
      else mctx.clearRect(0, 0, W, H);
      stage.classList.add('is-clean');
      if (!reduced) {
        var colors = ['#ff5fa2', '#2fd6e8', '#ffd23f', '#7cb8ff', '#ffffff'];
        for (var i = 0; i < 90; i++) {
          var a = rand(0, Math.PI * 2), sp = rand(2, 9);
          foam.push({ x: W / 2, y: H / 2, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 3, r: rand(3, 7), life: 1, spark: true, c: colors[i % colors.length], rot: rand(0, 6) });
        }
        startFx();
      }
    }

    function startFx() { if (!fxRunning) { fxRunning = true; requestAnimationFrame(fxLoop); } }
    function fxLoop() {
      fctx.clearRect(0, 0, W, H);
      for (var i = foam.length - 1; i >= 0; i--) {
        var p = foam[i];
        if (p.spark) {
          p.x += p.vx; p.y += p.vy; p.vy += 0.22; p.vx *= 0.985; p.life -= 0.012; p.rot += 0.2;
          fctx.save(); fctx.translate(p.x, p.y); fctx.rotate(p.rot); fctx.globalAlpha = Math.max(0, p.life);
          fctx.fillStyle = p.c; fctx.fillRect(-p.r, -p.r / 2.5, p.r * 2, p.r / 1.25); fctx.restore();
        } else {
          p.x += p.vx; p.y -= p.vy; p.life -= 0.018;
          fctx.globalAlpha = Math.max(0, p.life) * 0.9;
          fctx.strokeStyle = '#fff'; fctx.lineWidth = 1.2; fctx.fillStyle = 'rgba(255,255,255,.35)';
          fctx.beginPath(); fctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); fctx.fill(); fctx.stroke();
        }
        if (p.life <= 0) foam.splice(i, 1);
      }
      fctx.globalAlpha = 1;
      if (foam.length) requestAnimationFrame(fxLoop); else { fxRunning = false; fctx.clearRect(0, 0, W, H); }
    }

    function pos(e) { var r = mud.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
    mud.addEventListener('pointerdown', function (e) {
      if (clean) return;
      drawing = true; autoRun = false; last = pos(e);
      stage.classList.add('is-touched');
      try { mud.setPointerCapture(e.pointerId); } catch (err) { /* noop */ }
      erase(last.x, last.y, last.x + 0.1, last.y + 0.1);
      e.preventDefault();
    });
    mud.addEventListener('pointermove', function (e) {
      if (!drawing || clean) return;
      var p = pos(e); erase(last.x, last.y, p.x, p.y); last = p;
    });
    function stop() { if (drawing) { drawing = false; measure(); } }
    mud.addEventListener('pointerup', stop);
    mud.addEventListener('pointercancel', stop);

    var autoBtn = $('[data-scrub="auto"]'), resetBtn = $('[data-scrub="reset"]');
    if (autoBtn) autoBtn.addEventListener('click', function () {
      if (clean || autoRun) return;
      autoRun = true; stage.classList.add('is-touched');
      var rows = 7, t = 0, total = reduced ? 1 : 150, px = 0, py = H * 0.06;
      (function run() {
        if (!autoRun) return;
        var steps = reduced ? total : 1;
        for (var s = 0; s < steps && t <= total; s++, t++) {
          var k = t / total, row = k * rows, rowI = Math.floor(row), f = row - rowI;
          var x = (rowI % 2 ? 1 - f : f) * W * 1.1 - W * 0.05;
          var y = (row / rows) * H * 1.06 + Math.sin(k * 40) * 10;
          erase(px, py, x, y); px = x; py = y;
        }
        if (t <= total && !clean) requestAnimationFrame(run);
        else { autoRun = false; measure(); if (!clean) finish(); }
      })();
    });
    if (resetBtn) resetBtn.addEventListener('click', function () {
      autoRun = false; foam = [];
      if (hasG) G.killTweensOf(mud);
      mud.style.opacity = 1;
      paintMud();
    });

    size();
    if ('ResizeObserver' in window) new ResizeObserver(size).observe(stage);
  })();

  /* -------------------------------------------------------
     Booking form
     ------------------------------------------------------- */
  (function form() {
    var f = $('.bform');
    if (!f) return;
    var status = $('.bform__status', f), success = $('.bsuccess'), label = $('.bform__label', f);
    var submitBtn = $('button[type="submit"]', f);
    var msgs = {
      name: 'Please tell us your name.',
      phone: 'Please add a phone number we can reach you on.',
      email: 'Please enter a valid email address.',
      'dog-name': "What's your pup's name?",
      'dog-size': 'Please choose a size.',
      service: 'Please choose a service.'
    };

    $$('select', f).forEach(function (s) {
      s.addEventListener('change', function () { s.classList.toggle('has-value', !!s.value); clearErr(s); });
    });
    $$('input, select', f).forEach(function (el) {
      el.addEventListener('input', function () { clearErr(el); });
    });

    function clearErr(el) {
      var field = el.closest('.field'); if (!field) return;
      field.classList.remove('is-invalid');
      var err = $('.field__err', field); if (err) err.textContent = '';
      el.removeAttribute('aria-invalid');
    }
    function validate() {
      var first = null;
      $$('[required]', f).forEach(function (el) {
        var field = el.closest('.field'), err = field && $('.field__err', field);
        var v = (el.value || '').trim();
        var bad = !v;
        if (!bad && el.type === 'email') bad = !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
        if (!bad && el.type === 'tel') bad = v.replace(/\D/g, '').length < 7;
        if (bad) {
          field.classList.remove('is-invalid'); void field.offsetWidth; field.classList.add('is-invalid');
          if (err) { err.textContent = msgs[el.name] || 'This field is required.'; el.setAttribute('aria-describedby', err.id); }
          el.setAttribute('aria-invalid', 'true');
          if (!first) first = el;
        }
      });
      return first;
    }

    f.addEventListener('submit', function (e) {
      e.preventDefault();
      status.textContent = '';
      var bad = validate();
      if (bad) { bad.focus(); status.textContent = 'Please fix the highlighted fields.'; return; }
      submitBtn.disabled = true;
      label.textContent = 'Sending…';
      fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(new FormData(f)).toString()
      }).then(function (res) {
        if (!res.ok) throw new Error('Bad response');
        f.hidden = true;
        success.hidden = false;
        success.focus();
        celebrate(success);
        refreshLater();
      }).catch(function () {
        status.textContent = "Sorry, that didn't go through. Please try again or call (000) 000-0000.";
      }).then(function () {
        submitBtn.disabled = false;
        label.textContent = 'Send booking request';
      });
    });

    var again = $('.bsuccess__again');
    if (again) again.addEventListener('click', function () {
      f.reset();
      $$('select', f).forEach(function (s) { s.classList.remove('has-value'); });
      success.hidden = true; f.hidden = false;
      var first = $('input:not([type="hidden"]):not([name="bot-field"])', f); if (first) first.focus();
      refreshLater();
    });

    function celebrate(el) {
      if (reduced || !Element.prototype.animate) return;
      var r = el.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + 60;
      var colors = ['#ff5fa2', '#2fd6e8', '#ffd23f', '#7cb8ff'];
      for (var i = 0; i < 26; i++) {
        var s = d.createElement('span'), sz = rand(14, 30), a = rand(0, Math.PI * 2), dist = rand(90, 260);
        s.innerHTML = '<svg viewBox="0 0 64 64" width="' + sz + '" height="' + sz + '"><use href="#i-paw"/></svg>';
        s.style.cssText = 'position:fixed;left:' + cx + 'px;top:' + cy + 'px;z-index:970;pointer-events:none;fill:' + colors[i % 4];
        body.appendChild(s);
        s.animate([
          { transform: 'translate(-50%,-50%) scale(0) rotate(0deg)', opacity: 1 },
          { transform: 'translate(calc(-50% + ' + Math.cos(a) * dist + 'px), calc(-50% + ' + (Math.sin(a) * dist - 40) + 'px)) scale(1) rotate(' + rand(-200, 200) + 'deg)', opacity: 1, offset: 0.6 },
          { transform: 'translate(calc(-50% + ' + Math.cos(a) * dist * 1.1 + 'px), calc(-50% + ' + (Math.sin(a) * dist + 80) + 'px)) scale(.6) rotate(' + rand(-300, 300) + 'deg)', opacity: 0 }
        ], { duration: rand(1100, 1600), easing: 'cubic-bezier(.2,.8,.2,1)' }).onfinish = (function (n) { return function () { n.remove(); }; })(s);
      }
    }
  })();

  /* -------------------------------------------------------
     Footer word split
     ------------------------------------------------------- */
  var footWord = $('.foot__word');
  var footChars = [];
  if (footWord && !reduced) {
    Array.prototype.slice.call(footWord.childNodes).forEach(function (n) {
      if (n.nodeType !== 3) return;
      var frag = d.createDocumentFragment();
      n.textContent.split('').forEach(function (c) {
        var s = d.createElement('span'); s.className = 'ch'; s.textContent = c;
        frag.appendChild(s); footChars.push(s);
      });
      n.parentNode.replaceChild(frag, n);
    });
    footWord.style.background = 'none';
    footChars.forEach(function (c) {
      c.style.backgroundImage = 'linear-gradient(180deg,#fff 30%,rgba(255,255,255,.15))';
      c.addEventListener('pointerenter', function () {
        if (!hasG) return;
        G.fromTo(c, { y: 0 }, { y: '-0.18em', duration: 0.25, ease: 'power2.out', yoyo: true, repeat: 1, overwrite: true });
        G.fromTo(c, { color: 'transparent' }, { color: '#ff5fa2', duration: 0.2, yoyo: true, repeat: 1 });
      });
    });
  }

  /* -------------------------------------------------------
     No GSAP or reduced motion: stop here (content is visible)
     ------------------------------------------------------- */
  var loader = $('.loader');
  function hideLoader() { if (loader) loader.remove(); body.classList.remove('is-loading'); }

  if (!hasG || reduced) {
    hideLoader();
    return;
  }

  /* -------------------------------------------------------
     Pre-split text for reveals
     ------------------------------------------------------- */
  var splitHeads = $$('.split').map(function (h) { return { el: h, words: splitWords(h) }; });
  var aboutWords = $('.about__statement') ? splitPlainWords($('.about__statement')) : [];

  /* -------------------------------------------------------
     Loader + hero intro
     ------------------------------------------------------- */
  body.classList.add('is-loading');
  var heroImg = $('.hero__media img');
  var heroTitleLines = $$('.hero__title .line__in');
  G.set(heroTitleLines, { yPercent: 115, rotate: 6 });
  G.set(['.hero__eyebrow', '.hero__lead', '.hero__actions > *'], { y: 40, opacity: 0 });
  G.set('.hero__sticker', { scale: 0, rotate: -120 });
  G.set(heroImg, { scale: 1.3 });
  G.set(nav, { yPercent: -100 });

  function heroIntro() {
    var tl = G.timeline({ defaults: { ease: 'expo.out' } });
    tl.to(heroImg, { scale: 1, duration: 2.2 }, 0)
      .to(nav, { yPercent: 0, duration: 1.2, clearProps: 'transform' }, 0.2)
      .to('.hero__eyebrow', { y: 0, opacity: 1, duration: 1 }, 0.2)
      .to(heroTitleLines, { yPercent: 0, rotate: 0, duration: 1.4, stagger: 0.12 }, 0.25)
      .to('.hero__lead', { y: 0, opacity: 1, duration: 1 }, 0.6)
      .to('.hero__actions > *', { y: 0, opacity: 1, duration: 1, stagger: 0.08 }, 0.7)
      .to('.hero__sticker', { scale: 1, rotate: 0, duration: 1.4, ease: 'elastic.out(1, .5)' }, 0.8);
  }

  var count = { v: 0 };
  var numEl = $('.loader__num');
  var water = $('.loader__water');
  var loaded = false, minDone = false, exited = false;

  function exitLoader() {
    if (exited) return; exited = true;
    G.timeline()
      .to(count, { v: 100, duration: 0.4, ease: 'power2.out', onUpdate: function () { numEl.textContent = Math.round(count.v); } })
      .to(water, { yPercent: 0, duration: 0.4, ease: 'power2.out' }, '<')
      .to('.loader__tub', { scale: 1.15, duration: 0.25, ease: 'power2.out' })
      .to('.loader__tub', { scale: 0, duration: 0.45, ease: 'back.in(2)' })
      .to('.loader__label', { opacity: 0, y: 10, duration: 0.3 }, '<')
      .to('.loader__splash', { scale: Math.max(innerWidth, innerHeight) / 4, duration: 0.8, ease: 'expo.in' }, '-=0.2')
      .add(function () { heroIntro(); })
      .to(loader, { clipPath: 'circle(0% at 50% 50%)', duration: 0.9, ease: 'expo.inOut' }, '-=0.05')
      .add(function () { hideLoader(); ST.refresh(); });
  }

  if (numEl && water && loader) {
    G.set(water, { yPercent: 100 });
    G.set(loader, { clipPath: 'circle(150% at 50% 50%)' });
    G.to(count, {
      v: 85, duration: 1.6, ease: 'power1.inOut',
      onUpdate: function () { numEl.textContent = Math.round(count.v); G.set(water, { yPercent: 100 - count.v }); },
      onComplete: function () { minDone = true; if (loaded) exitLoader(); }
    });
    var done = function () { loaded = true; if (minDone) exitLoader(); };
    if (heroImg && !heroImg.complete) { heroImg.addEventListener('load', done); heroImg.addEventListener('error', done); }
    else done();
    setTimeout(function () { loaded = true; minDone = true; exitLoader(); }, 4500);
  } else {
    hideLoader();
    heroIntro();
  }

  /* -------------------------------------------------------
     Hero parallax
     ------------------------------------------------------- */
  G.to('.hero__media img', { yPercent: 12, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
  G.to('.hero__content', { y: -120, opacity: 0, ease: 'none', scrollTrigger: { trigger: hero, start: '35% top', end: 'bottom top', scrub: true } });
  G.to('.hero__sticker', { y: -200, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });

  /* -------------------------------------------------------
     Headings, eyebrows, copy
     ------------------------------------------------------- */
  splitHeads.forEach(function (o) {
    G.from(o.words, {
      yPercent: 115, rotate: 8, duration: 1.1, ease: 'expo.out', stagger: 0.045,
      scrollTrigger: { trigger: o.el, start: 'top 88%', once: true }
    });
  });
  $$('.section .eyebrow, .shead__lead, .scrub__lead, .meter, .scrub__btns, .contact__lead, .contact__phone, .faq__head > p:last-child, .about__copy, #about-title').forEach(function (el) {
    G.from(el, { y: 40, opacity: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 90%', once: true } });
  });

  /* Marquee entrance */
  G.from('.marquee', { rotate: 6, scale: 0.9, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: '.marquee', start: 'top 95%', once: true } });

  /* -------------------------------------------------------
     Service cards: 3D flip-in + tilt
     ------------------------------------------------------- */
  var cards = $$('.card');
  G.set(cards, { transformPerspective: 1000, opacity: 0 });
  ST.batch(cards, {
    start: 'top 92%', once: true,
    onEnter: function (batch) {
      G.fromTo(batch, { y: 120, rotationX: -35, opacity: 0, scale: 0.92 }, { y: 0, rotationX: 0, opacity: 1, scale: 1, duration: 1.2, ease: 'expo.out', stagger: 0.09, overwrite: true });
    }
  });
  cards.forEach(function (c) {
    var img = $('.card__img img', c);
    if (img) G.fromTo(img, { yPercent: -6 }, { yPercent: 6, ease: 'none', scrollTrigger: { trigger: c, start: 'top bottom', end: 'bottom top', scrub: true } });
    if (!fine) return;
    c.addEventListener('pointermove', function (e) {
      var r = c.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      c.style.setProperty('--mx', px * 100 + '%'); c.style.setProperty('--my', py * 100 + '%');
      G.to(c, { rotationY: (px - 0.5) * 14, rotationX: (0.5 - py) * 12, y: -8, duration: 0.6, ease: 'power3.out', overwrite: 'auto' });
    });
    c.addEventListener('pointerleave', function () { G.to(c, { rotationY: 0, rotationX: 0, y: 0, duration: 1, ease: 'elastic.out(1, .45)', overwrite: 'auto' }); });
  });

  /* -------------------------------------------------------
     Scrub stage reveal
     ------------------------------------------------------- */
  G.from('.scrub__stage', { clipPath: 'inset(18% 18% 18% 18% round 60px)', scale: 0.85, rotate: -6, duration: 1.6, ease: 'expo.out', scrollTrigger: { trigger: '.scrub__stage', start: 'top 85%', once: true } });

  /* -------------------------------------------------------
     About: word highlight + collage
     ------------------------------------------------------- */
  if (aboutWords.length) {
    ST.create({
      trigger: '.about__statement', start: 'top 80%', end: 'bottom 45%', scrub: true,
      onUpdate: function (self) {
        var n = Math.round(self.progress * aboutWords.length);
        for (var i = 0; i < aboutWords.length; i++) aboutWords[i].classList.toggle('is-on', i < n);
      }
    });
  }
  $$('.about__img').forEach(function (fig, i) {
    G.from(fig, { clipPath: 'inset(100% 0% 0% 0% round 34px)', duration: 1.5, ease: 'expo.inOut', delay: i * 0.12, scrollTrigger: { trigger: '.about__media', start: 'top 80%', once: true } });
    G.from($('img', fig), { scale: 1.4, duration: 1.8, ease: 'expo.out', delay: i * 0.12, scrollTrigger: { trigger: '.about__media', start: 'top 80%', once: true } });
  });
  $$('[data-speed]').forEach(function (el) {
    var sp = parseFloat(el.getAttribute('data-speed')) || 0;
    G.to(el, { y: function () { return -sp * window.innerHeight; }, ease: 'none', scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: true, invalidateOnRefresh: true } });
  });

  /* -------------------------------------------------------
     Why: bubbles pop in
     ------------------------------------------------------- */
  G.set('.bub', { opacity: 0 });
  ST.batch('.bub', {
    start: 'top 92%', once: true,
    onEnter: function (batch) {
      G.fromTo(batch, { scale: 0, rotate: -25, opacity: 0 }, { scale: 1, rotate: 0, opacity: 1, duration: 1.4, ease: 'elastic.out(1, .55)', stagger: 0.12, clearProps: 'transform' });
    }
  });
  if (fine) $$('.bub').forEach(function (b) {
    b.addEventListener('pointerenter', function () {
      G.fromTo(b, { scaleX: 1, scaleY: 1 }, { keyframes: [{ scaleX: 1.12, scaleY: 0.9, duration: 0.15 }, { scaleX: 0.95, scaleY: 1.08, duration: 0.15 }, { scaleX: 1.04, scaleY: 0.98, duration: 0.15 }, { scaleX: 1, scaleY: 1, duration: 0.3 }], ease: 'sine.inOut', overwrite: true });
    });
  });

  /* -------------------------------------------------------
     Band: pinned shake with water drops
     ------------------------------------------------------- */
  (function band() {
    var sec = $('.band');
    if (!sec) return;
    var canvas = $('.band__drops', sec), ctx = canvas.getContext('2d');
    var W = 0, H = 0, drops = [], running = false, intensity = 0;
    function resize() {
      var r = canvas.getBoundingClientRect(); W = r.width; H = r.height;
      canvas.width = W * DPR; canvas.height = H * DPR; ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize);

    var tl = G.timeline({
      scrollTrigger: {
        trigger: sec, start: 'top top', end: '+=140%', pin: true, scrub: 0.6, anticipatePin: 1,
        onToggle: function (self) { if (self.isActive && !running) { running = true; requestAnimationFrame(loop); } },
        onUpdate: function (self) { intensity = clamp(Math.abs(self.getVelocity()) / 1500, 0, 1.5); }
      }
    });
    tl.fromTo('.band__frame', { clipPath: 'inset(22% 26% 22% 26% round 48px)' }, { clipPath: 'inset(0% 0% 0% 0% round 0px)', ease: 'power2.inOut', duration: 1 }, 0)
      .fromTo('.band__frame img', { scale: 1.45, rotate: -4 }, { scale: 1, rotate: 0, ease: 'power2.inOut', duration: 1 }, 0)
      .fromTo('.band__l--1', { xPercent: -120 }, { xPercent: 0, ease: 'power3.out', duration: 0.8 }, 0.05)
      .fromTo('.band__l--2', { xPercent: 120 }, { xPercent: 0, ease: 'power3.out', duration: 0.8 }, 0.15)
      .fromTo('.band__l--3', { xPercent: -140, rotate: -8 }, { xPercent: 0, rotate: 0, ease: 'power3.out', duration: 0.8 }, 0.25)
      .to('.band__text', { scale: 1.06, duration: 0.3 }, 1);

    ST.create({ trigger: sec, start: 'top bottom', end: 'bottom top', onToggle: function (s) { if (s.isActive && !running) { running = true; requestAnimationFrame(loop); } else if (!s.isActive) running = false; } });

    function loop() {
      if (!running) return;
      ctx.clearRect(0, 0, W, H);
      var emit = 1 + intensity * 14;
      for (var i = 0; i < emit; i++) {
        var a = rand(0, Math.PI * 2), sp = rand(4, 10) * (0.6 + intensity);
        drops.push({ x: W / 2 + rand(-W * 0.12, W * 0.12), y: H * 0.5 + rand(-H * 0.12, H * 0.12), vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 2, life: 1, r: rand(1.5, 4) });
      }
      if (drops.length > 600) drops.splice(0, drops.length - 600);
      for (var j = drops.length - 1; j >= 0; j--) {
        var p = drops[j];
        p.x += p.vx; p.y += p.vy; p.vy += 0.28; p.life -= 0.014;
        var spd = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        ctx.strokeStyle = 'rgba(200,235,255,' + Math.max(0, p.life) * 0.85 + ')';
        ctx.lineWidth = p.r; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - p.vx * (1 + spd * 0.06), p.y - p.vy * (1 + spd * 0.06)); ctx.stroke();
        if (p.life <= 0 || p.y > H + 20) drops.splice(j, 1);
      }
      intensity *= 0.94;
      requestAnimationFrame(loop);
    }
  })();

  /* -------------------------------------------------------
     Process: paw print trail + steps
     ------------------------------------------------------- */
  var pawsBox = $('.paws');
  if (pawsBox && getComputedStyle(pawsBox).display !== 'none') {
    var N = 14, paws = [];
    for (var i = 0; i < N; i++) {
      var k = i / (N - 1);
      var p = d.createElementNS('http://www.w3.org/2000/svg', 'svg');
      p.setAttribute('viewBox', '0 0 64 64');
      p.innerHTML = '<use href="#i-paw"/>';
      var yy = 50 + Math.sin(k * Math.PI * 2.2) * 30 + (i % 2 ? -10 : 10);
      p.style.left = (2 + k * 94) + '%';
      p.style.top = yy + '%';
      p.style.transform = 'translate(-50%,-50%) rotate(' + (90 + Math.cos(k * Math.PI * 2.2) * 30) + 'deg)';
      pawsBox.appendChild(p); paws.push(p);
    }
    G.fromTo(paws, { opacity: 0, scale: 0 }, { opacity: 0.9, scale: 1, ease: 'back.out(3)', stagger: 0.12, scrollTrigger: { trigger: '.steps', start: 'top 85%', end: 'center 45%', scrub: 0.5 } });
  }
  $$('.step').forEach(function (s, i) {
    G.from(s, { y: 120, opacity: 0, rotate: i % 2 ? 4 : -4, duration: 1.3, ease: 'expo.out', delay: i * 0.12, scrollTrigger: { trigger: '.steps', start: 'top 85%', once: true } });
    G.from($('.step__n', s), { scale: 0, rotate: -180, duration: 1.2, ease: 'elastic.out(1, .5)', delay: 0.3 + i * 0.15, scrollTrigger: { trigger: '.steps', start: 'top 85%', once: true } });
  });

  /* -------------------------------------------------------
     Gallery: reveal
     ------------------------------------------------------- */
  G.set('.gcol img', { opacity: 0 });
  ST.batch('.gcol img', {
    start: 'top 95%', once: true,
    onEnter: function (batch) { G.fromTo(batch, { clipPath: 'inset(30% 10% 30% 10% round 40px)', opacity: 0, scale: 1.15 }, { clipPath: 'inset(0% 0% 0% 0% round 22px)', opacity: 1, scale: 1, duration: 1.4, ease: 'expo.out', stagger: 0.1, clearProps: 'clipPath,transform' }); }
  });

  /* -------------------------------------------------------
     FAQ + contact + footer
     ------------------------------------------------------- */
  G.set('.acc__item', { opacity: 0 });
  ST.batch('.acc__item', {
    start: 'top 92%', once: true,
    onEnter: function (batch) { G.fromTo(batch, { x: 80, opacity: 0 }, { x: 0, opacity: 1, duration: 1, ease: 'expo.out', stagger: 0.07, clearProps: 'transform' }); }
  });

  G.from('.formcard', { y: 120, rotate: 4, opacity: 0, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: '.formcard', start: 'top 90%', once: true } });

  if (footChars.length) {
    G.from(footChars, { yPercent: 110, rotate: 12, opacity: 0, duration: 1.2, ease: 'expo.out', stagger: 0.05, scrollTrigger: { trigger: footWord, start: 'top 92%', once: true } });
  }
  G.from('.foot__word svg', { scale: 0, rotate: -180, duration: 1.4, ease: 'elastic.out(1,.5)', delay: 0.4, scrollTrigger: { trigger: '.foot__word', start: 'top 92%', once: true } });

  /* -------------------------------------------------------
     Magnetic buttons
     ------------------------------------------------------- */
  if (fine) {
    $$('.magnetic').forEach(function (el) {
      var strength = el.classList.contains('btn--block') ? 0.12 : 0.35;
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        G.to(el, { x: (e.clientX - r.left - r.width / 2) * strength, y: (e.clientY - r.top - r.height / 2) * strength, duration: 0.5, ease: 'power3.out' });
      });
      el.addEventListener('pointerleave', function () { G.to(el, { x: 0, y: 0, duration: 1, ease: 'elastic.out(1, .35)' }); });
    });
  }

  /* Recalculate after fonts and images settle */
  if (d.fonts && d.fonts.ready) d.fonts.ready.then(function () { ST.refresh(); });
  window.addEventListener('load', function () { ST.refresh(); });
})();
