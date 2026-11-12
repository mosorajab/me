/* =========================================================================
   Portfolio — interactions & motion
   ========================================================================= */
(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var qsa = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---- nav scrolled state + scroll progress -------------------------- */
  var nav = document.getElementById("nav");
  var prog = document.getElementById("progress");
  var heroLayers = qsa("[data-parallax]");
  var docEl = document.documentElement;
  function onScroll() {
    var y = window.scrollY || docEl.scrollTop;
    if (nav) nav.classList.toggle("scrolled", y > 12);
    if (prog) {
      var max = docEl.scrollHeight - docEl.clientHeight;
      prog.style.transform = "scaleX(" + (max > 0 ? Math.min(1, y / max) : 0) + ")";
    }
    /* subtle hero grid parallax */
    heroLayers.forEach(function (el) {
      if (reduce || document.body.classList.contains("no-motion")) {
        el.style.transform = "";
      } else if (y < window.innerHeight * 1.2) {
        el.style.transform = "translate3d(0," + (y * 0.14).toFixed(1) + "px,0)";
      }
    });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  onScroll();

  /* ---- index: full-screen section menu ------------------------------- */
  var index = document.getElementById("index");
  var indexOpen = document.getElementById("indexOpen");
  var indexClose = document.getElementById("indexClose");
  var lastFocus = null;
  function setIndex(open) {
    if (!index || open === !index.hidden) return;
    if (open) {
      lastFocus = document.activeElement;
      index.hidden = false;
      void index.offsetWidth;                 // let the fade-in transition run
      index.classList.add("open");
      document.body.classList.add("index-open");
      var cur = index.querySelector("a.active") || index.querySelector(".index-list a");
      if (cur) cur.focus({ preventScroll: true });
    } else {
      index.classList.remove("open");
      index.hidden = true;
      document.body.classList.remove("index-open");
      if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
    }
    if (indexOpen) indexOpen.setAttribute("aria-expanded", open ? "true" : "false");
  }
  if (index && indexOpen) {
    indexOpen.addEventListener("click", function () { setIndex(true); });
    if (indexClose) indexClose.addEventListener("click", function () { setIndex(false); });
    qsa("a", index).forEach(function (a) {
      a.addEventListener("click", function () { lastFocus = null; setIndex(false); });
    });
    // keep Tab inside the open dialog
    index.addEventListener("keydown", function (e) {
      if (e.key !== "Tab") return;
      var f = qsa("a, button", index);
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
  }

  /* ---- keyboard: 1–7 jump to sections, I opens the index ------------- */
  var jumpTo = ["about", "work", "mosaic", "projects", "writing", "collections", "contact"];
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") { setIndex(false); return; }
    if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;
    var t = e.target;
    if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
    if (e.key === "i" || e.key === "I") { e.preventDefault(); setIndex(index && index.hidden); return; }
    var n = parseInt(e.key, 10);
    var sec = n >= 1 && n <= jumpTo.length && document.getElementById(jumpTo[n - 1]);
    if (!sec) return;
    e.preventDefault();
    setIndex(false);
    sec.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
  });

  /* ---- hero mosaic: the brand mark on the grid, lit by the pointer --- */
  (function heroTiles() {
    var hero = document.getElementById("hero");
    var cvs = document.getElementById("heroTiles");
    var hint = document.getElementById("heroHint");
    if (!hero || !cvs || !cvs.getContext) return;
    var ctx = cvs.getContext("2d");
    var fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    var MARK = [0, 1, 0, 0, 0, 1, 1, 0, 0];   // same pattern as the nav mark; 1 = accent
    var W = 0, H = 0, S = 0, dpr = 1, on = false, raf = 0;
    var placed = {}, heat = {}, hoverKey = null, touched = false;
    var ink, accent;

    function readColors() {
      var cs = getComputedStyle(document.documentElement);
      ink = cs.getPropertyValue("--ink").trim();
      accent = cs.getPropertyValue("--accent").trim();
    }
    // cells are counted from the right edge (k) and top (r), matching the
    // CSS grid on .hero-bg, which is anchored right/top
    var markRow = 1;
    function setMark(start) {
      // first row whose cells sit fully below the fixed nav
      var s = Math.max(54, Math.min(84, window.innerWidth * 0.06));
      markRow = Math.max(1, Math.ceil(((nav ? nav.offsetHeight : 64) + 8) / s));
      placed = {};
      MARK.forEach(function (v, i) {
        placed[(3 - i % 3) + "," + (markRow + Math.floor(i / 3))] = { v: v ? 2 : 1, t: reduce ? -1e9 : start + i * 70 };
      });
    }
    function cell(k, r) { return [W - (k + 1) * S + 1, r * S + 1, S - 1, S - 1]; }
    // same falloff as the radial mask on .hero-bg, so the trail fades with the grid
    function mask(x, y) {
      var dx = (x - 0.82 * W) / (1.2 * W), dy = (y - 0.14 * H) / (0.8 * H);
      var d = Math.sqrt(dx * dx + dy * dy);
      return d <= 0.22 ? 1 : d >= 0.72 ? 0 : 1 - (d - 0.22) / 0.5;
    }
    function ease(p) { return 1 - Math.pow(1 - p, 3); }

    function draw(now) {
      var busy = false;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = ink;
      Object.keys(heat).forEach(function (key) {
        var h = heat[key];
        if (h < 0.02) { delete heat[key]; return; }
        var p = key.split(","), c = cell(+p[0], +p[1]);
        ctx.globalAlpha = 0.055 * h * mask(c[0] + c[2] / 2, c[1] + c[3] / 2);
        ctx.fillRect(c[0], c[1], c[2], c[3]);
        if (key !== hoverKey) { heat[key] = h * 0.92; busy = true; }
      });
      Object.keys(placed).forEach(function (key) {
        var tile = placed[key], p = key.split(","), c = cell(+p[0], +p[1]);
        var prog = Math.max(0, Math.min(1, (now - tile.t) / 520));
        if (prog < 1) busy = true;
        if (prog <= 0) return;
        var s = c[2] * ease(prog), o = (c[2] - s) / 2;
        ctx.globalAlpha = prog * (tile.v === 2 ? 0.94 : 0.075);
        ctx.fillStyle = tile.v === 2 ? accent : ink;
        ctx.fillRect(c[0] + o, c[1] + o, s, s);
      });
      if (hoverKey) {
        var hp = hoverKey.split(","), hc = cell(+hp[0], +hp[1]);
        ctx.globalAlpha = 0.9 * Math.max(mask(hc[0] + hc[2] / 2, hc[1] + hc[3] / 2), placed[hoverKey] ? 1 : 0);
        ctx.strokeStyle = accent; ctx.lineWidth = 1;
        ctx.strokeRect(hc[0] + 0.5, hc[1] + 0.5, hc[2] - 1, hc[3] - 1);
      }
      ctx.globalAlpha = 1;
      return busy;
    }
    function tick(now) { raf = 0; if (draw(now)) raf = requestAnimationFrame(tick); }
    function kick() { if (on && !raf) raf = requestAnimationFrame(tick); }

    function size() {
      on = window.innerWidth >= 1000;
      cvs.hidden = !on;
      if (hint) hint.hidden = !(on && fine.matches);
      if (!on) { hero.classList.remove("tile-hover"); return; }
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = hero.clientWidth; H = hero.clientHeight;
      S = Math.max(54, Math.min(84, window.innerWidth * 0.06));   // clamp(54px, 6vw, 84px)
      cvs.width = Math.round(W * dpr); cvs.height = Math.round(H * dpr);
      cvs.style.width = W + "px"; cvs.style.height = H + "px";
      if (hint) { hint.style.top = ((markRow + 3) * S + 14) + "px"; hint.style.right = S + "px"; }
      kick();
    }
    function cellAt(e) {
      var b = cvs.getBoundingClientRect();
      var k = Math.floor((W - (e.clientX - b.left)) / S), r = Math.floor((e.clientY - b.top) / S);
      return k >= 0 && r >= 0 ? k + "," + r : null;
    }
    function onText(e) { return !!e.target.closest("a, button, h1, h2, p, .hero-links, .hero-eyebrow"); }
    function markTouched(v) {
      touched = v;
      if (!hint) return;
      hint.disabled = !v;
      hint.textContent = v ? "↺ Reset the mark" : "Click the grid to place a tile";
    }

    hero.addEventListener("pointermove", function (e) {
      if (!on || !fine.matches) return;
      var key = onText(e) ? null : cellAt(e);
      hero.classList.toggle("tile-hover", !!key);
      if (key === hoverKey) return;
      hoverKey = key;
      if (key && !reduce) heat[key] = 1;
      kick();
    });
    hero.addEventListener("pointerleave", function () {
      hoverKey = null; hero.classList.remove("tile-hover"); kick();
    });
    hero.addEventListener("click", function (e) {
      if (!on || onText(e) || String(window.getSelection ? window.getSelection() : "")) return;
      var key = cellAt(e);
      if (!key) return;
      var cur = placed[key];
      var next = !cur ? 2 : cur.v === 2 ? 1 : 0;      // empty → accent → ink → empty
      if (next) placed[key] = { v: next, t: reduce ? -1e9 : performance.now() };
      else delete placed[key];
      markTouched(true);
      kick();
    });
    if (hint) hint.addEventListener("click", function () {
      setMark(performance.now()); markTouched(false); kick();
    });

    readColors();
    setMark(performance.now() + 500);
    size();
    if ("ResizeObserver" in window) new ResizeObserver(size).observe(hero);
    else window.addEventListener("resize", size, { passive: true });
  })();

  /* ---- animated nav mark (builds, then pulses) ----------------------- */
  var navMark = document.getElementById("navMark");
  if (navMark) {
    if (reduce) {
      navMark.classList.add("live");
    } else {
      navMark.classList.add("build");
      void navMark.offsetWidth;            // force reflow so the transition runs
      navMark.classList.add("go");
      setTimeout(function () { navMark.classList.add("live"); }, 1700);
    }
  }

  /* ---- hero headline: split into rising words ------------------------ */
  var hl = document.getElementById("heroHeadline");
  if (hl && !reduce) {
    var tmp = document.createElement("div");
    tmp.innerHTML = hl.innerHTML;
    var out = [];
    Array.prototype.forEach.call(tmp.childNodes, function (node) {
      if (node.nodeType === 3) {
        node.textContent.split(/(\s+)/).forEach(function (tok) {
          if (/^\s+$/.test(tok)) out.push(" ");
          else if (tok.length) out.push('<span class="word"><span>' + tok + "</span></span>");
        });
      } else if (node.nodeName === "BR") {
        out.push("<br />");
      } else {
        out.push('<span class="word word-accent"><span>' + node.outerHTML + "</span></span> ");
      }
    });
    hl.innerHTML = out.join("");
    var words = qsa(".word > span", hl);
    words.forEach(function (w, i) { w.style.transitionDelay = (0.28 + i * 0.06) + "s"; });
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { hl.classList.add("words-in"); });
    });
  }

  /* ---- staggered groups ---------------------------------------------- */
  (function setupStagger() {
    var groups = qsa("[data-stagger]");
    if (!groups.length) return;

    groups.forEach(function (g) {
      var step = parseInt(g.getAttribute("data-stagger-step") || "70", 10);
      var offset = parseInt(g.getAttribute("data-stagger-offset") || "0", 10);
      var kids = Array.prototype.slice.call(g.children);
      g._kids = kids; g._step = step;
      if (reduce) return;
      kids.forEach(function (k, i) {
        k.classList.add("stg");
        k.style.setProperty("--si", (offset + i) * step);
      });
    });

    if (reduce || !("IntersectionObserver" in window)) return;

    function go(g) {
      if (g._done) return; g._done = true;
      var last = 0;
      g._kids.forEach(function (k, i) {
        k.classList.add("shown");
        last = parseFloat(k.style.getPropertyValue("--si")) || (i * g._step);
      });
      // clean up so hover/interaction transitions are unencumbered afterwards
      setTimeout(function () {
        g._kids.forEach(function (k) {
          k.classList.remove("stg", "shown");
          k.style.removeProperty("--si");
        });
      }, last + 1100);
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { go(e.target); io.unobserve(e.target); } });
    }, { threshold: 0.01, rootMargin: "0px 0px -8% 0px" });

    var vh = window.innerHeight || 800;
    groups.forEach(function (g) {
      if (g.getBoundingClientRect().top < vh * 0.95) go(g);
      else io.observe(g);
    });
    setTimeout(function () { groups.forEach(go); }, 3200);
  })();

  /* ---- reveal on scroll (section heads, intros, etc.) ---------------- */
  var reveals = qsa(".reveal");
  function show(el) { el.classList.add("in"); }
  if (reduce || !("IntersectionObserver" in window)) {
    reveals.forEach(show);
  } else {
    var rio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { show(e.target); rio.unobserve(e.target); } });
    }, { threshold: 0.01, rootMargin: "0px 0px -6% 0px" });
    var vh2 = window.innerHeight || 800;
    reveals.forEach(function (el) {
      if (el.getBoundingClientRect().top < vh2 * 0.92) show(el);
      else rio.observe(el);
    });
    setTimeout(function () { reveals.forEach(show); }, 2800);
  }

  /* ---- mosaic logo glyph: builds tile-by-tile when in view ----------- */
  var mGlyph = document.getElementById("mosaicGlyph");
  if (mGlyph) {
    if (reduce) {
      mGlyph.classList.add("live");
    } else {
      mGlyph.classList.add("build");
      var fireGlyph = function () {
        if (mGlyph._done) return; mGlyph._done = true;
        void mGlyph.offsetWidth;
        mGlyph.classList.add("go");
        setTimeout(function () { mGlyph.classList.add("live"); }, 900);
      };
      if ("IntersectionObserver" in window) {
        var gio = new IntersectionObserver(function (entries) {
          entries.forEach(function (e) { if (e.isIntersecting) { fireGlyph(); gio.unobserve(e.target); } });
        }, { threshold: 0.4 });
        if (mGlyph.getBoundingClientRect().top < (window.innerHeight || 800) * 0.85) fireGlyph();
        else gio.observe(mGlyph);
        setTimeout(fireGlyph, 4000);
      } else {
        fireGlyph();
      }
    }
  }

  /* ---- draw-in: icon strokes and the timeline track ------------------ */
  qsa(".draw svg > *").forEach(function (el) { el.setAttribute("pathLength", "1"); });
  var drawGroups = qsa(".draw, .tl");
  if (reduce || !("IntersectionObserver" in window)) {
    drawGroups.forEach(function (g) { g.classList.add("drawn"); });
  } else {
    var dio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("drawn"); dio.unobserve(e.target); } });
    }, { threshold: 0.15 });
    drawGroups.forEach(function (g) {
      if (g.classList.contains("draw")) g.classList.add("armed");
      dio.observe(g);
    });
  }

  /* ---- where am I: rail, index and nav follow the current section ---- */
  var spySections = jumpTo.map(function (id) { return document.getElementById(id); }).filter(Boolean);
  var spyLinks = qsa("[data-spy]");
  var rail = document.getElementById("rail");
  var hero = document.getElementById("hero");
  var nowN = document.getElementById("navNowN");
  var nowT = document.getElementById("navNowT");
  var nowBar = document.getElementById("navNowBar");
  var nowLink = document.getElementById("navNow");
  var activeId = null, spyQueued = false;
  function spy() {
    spyQueued = false;
    var y = window.scrollY || docEl.scrollTop;
    var vh = window.innerHeight || 800;
    var line = y + vh * 0.4;
    var cur = null;
    spySections.forEach(function (s) { if (s.offsetTop <= line) cur = s; });
    // the last section is short: count it as current once the page bottoms out
    if (y + vh >= docEl.scrollHeight - 4) cur = spySections[spySections.length - 1];
    var past = hero ? y > hero.offsetTop + hero.offsetHeight - vh * 0.5 : y > vh * 0.5;
    if (nav) nav.classList.toggle("has-now", !!cur && past);
    if (rail) rail.classList.toggle("show", past);
    var id = cur && past ? cur.id : null;
    if (cur && nowBar) {
      var p = (line - cur.offsetTop) / Math.max(1, cur.offsetHeight);
      nowBar.style.transform = "scaleX(" + Math.max(0, Math.min(1, p)).toFixed(3) + ")";
    }
    if (id === activeId) return;
    activeId = id;
    spyLinks.forEach(function (a) { a.classList.toggle("active", a.getAttribute("data-spy") === id); });
    if (cur && nowN && nowT) {
      nowN.textContent = cur.getAttribute("data-n") || "";
      nowT.textContent = cur.getAttribute("data-label") || "";
      if (nowLink) nowLink.setAttribute("href", "#" + cur.id);
    }
  }
  function queueSpy() { if (!spyQueued) { spyQueued = true; requestAnimationFrame(spy); } }
  window.addEventListener("scroll", queueSpy, { passive: true });
  window.addEventListener("resize", queueSpy, { passive: true });
  spy();
})();
