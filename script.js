/* =========================================================================
   mosorr.com — interactions & motion
   ========================================================================= */
(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var qsa = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var docEl = document.documentElement;
  var prog = document.getElementById("progress");

  /* ---- theme: follows the device until the visitor picks one ---------- */
  (function theme() {
    var btn = document.getElementById("themeToggle");
    var sys = window.matchMedia("(prefers-color-scheme: light)");
    var meta = document.querySelector('meta[name="theme-color"]');
    function stored() { try { var t = localStorage.getItem("theme"); return t === "light" || t === "dark" ? t : null; } catch (e) { return null; } }
    function apply(t) {
      docEl.setAttribute("data-theme", t);
      if (meta) meta.setAttribute("content", t === "light" ? "#f8f5ef" : "#1a1817");
      if (btn) btn.setAttribute("aria-label", t === "light" ? "Switch to dark mode" : "Switch to light mode");
    }
    apply(stored() || (sys.matches ? "light" : "dark"));
    if (btn) btn.addEventListener("click", function () {
      var next = docEl.getAttribute("data-theme") === "light" ? "dark" : "light";
      try { localStorage.setItem("theme", next); } catch (e) {}
      apply(next);
    });
    var follow = function () { if (!stored()) apply(sys.matches ? "light" : "dark"); };
    if (sys.addEventListener) sys.addEventListener("change", follow); else if (sys.addListener) sys.addListener(follow);
  })();

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
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
  }

  /* ---- keyboard: 1–6 jump to sections, I opens the index ------------- */
  var jumpTo = ["about", "projects", "writing", "collections", "background", "contact"];
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

  /* ---- hero headline: words sharpen out of a blur, one by one -------- */
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
      } else {
        out.push('<span class="word"><span>' + node.outerHTML + "</span></span>");
      }
    });
    hl.innerHTML = out.join("");
    qsa(".word > span", hl).forEach(function (w, i) { w.style.transitionDelay = (0.25 + i * 0.09) + "s"; });
    requestAnimationFrame(function () { requestAnimationFrame(function () { hl.classList.add("words-in"); }); });
  }

  /* ---- lens: magnify a framed plate under the pointer ---------------- */
  if (fine) qsa(".lens-plate").forEach(function (fig) {
    var frame = fig.querySelector(".plate-frame");
    var img = frame && frame.querySelector("img");
    if (!img) return;
    var lens = document.createElement("div");
    lens.className = "lens"; lens.setAttribute("aria-hidden", "true");
    lens.style.backgroundImage = "url('" + img.getAttribute("src") + "')";
    frame.appendChild(lens);
    var zoom = 2.4, size = 180;
    frame.addEventListener("pointermove", function (e) {
      var fr = frame.getBoundingClientRect(), ir = img.getBoundingClientRect();
      var x = e.clientX - ir.left, y = e.clientY - ir.top;
      lens.style.left = (e.clientX - fr.left - size / 2) + "px";
      lens.style.top = (e.clientY - fr.top - size / 2) + "px";
      lens.style.backgroundSize = (ir.width * zoom) + "px " + (ir.height * zoom) + "px";
      lens.style.backgroundPosition = (size / 2 - x * zoom) + "px " + (size / 2 - y * zoom) + "px";
    });
  });

  /* ---- off the clock: the dial shows the pastime you point at ------- */
  (function cabinet() {
    var cab = document.getElementById("cabinet");
    if (!cab) return;
    var items = qsa(".cab-item", cab), arts = qsa(".cab-art", cab);
    var ring = cab.querySelector(".cab-ring"), count = document.getElementById("cabCount");
    qsa(".cab-ico svg > *", cab).forEach(function (el) { el.setAttribute("pathLength", "1"); });
    var cur = 0, lastTouch = 0, inView = false;
    function show(i) {
      if (i === cur) return;
      cur = i;
      items.forEach(function (b, k) { b.classList.toggle("on", k === i); b.setAttribute("aria-pressed", k === i ? "true" : "false"); });
      arts.forEach(function (a, k) { a.classList.toggle("on", k === i); });
      if (ring) ring.style.transform = "rotate(" + (i * 360 / items.length).toFixed(1) + "deg)";
      if (count) count.textContent = (i + 1) + " / " + items.length;
    }
    items.forEach(function (b, k) {
      var pick = function () { lastTouch = Date.now(); show(k); };
      b.addEventListener("click", pick);
      b.addEventListener("focus", pick);
      if (fine) b.addEventListener("pointerenter", pick);
    });
    // while it is on screen and nobody is choosing, turn slowly through them
    if (!reduce) {
      if ("IntersectionObserver" in window) new IntersectionObserver(function (es) { inView = es[0].isIntersecting; }).observe(cab);
      setInterval(function () {
        if (inView && Date.now() - lastTouch > 9000) show((cur + 1) % items.length);
      }, 3800);
    }
  })();

  /* ---- staggered groups ---------------------------------------------- */
  (function setupStagger() {
    var groups = qsa("[data-stagger]");
    groups.forEach(function (g) {
      var step = parseInt(g.getAttribute("data-stagger-step") || "70", 10);
      g._kids = Array.prototype.slice.call(g.children); g._step = step;
      if (reduce) return;
      g._kids.forEach(function (k, i) { k.classList.add("stg"); k.style.setProperty("--si", i * step); });
    });
    if (reduce || !("IntersectionObserver" in window)) return;
    function go(g) {
      if (g._done) return; g._done = true;
      g._kids.forEach(function (k) { k.classList.add("shown"); });
      // clean up so hover transitions are not delayed afterwards
      setTimeout(function () {
        g._kids.forEach(function (k) { k.classList.remove("stg", "shown"); k.style.removeProperty("--si"); });
      }, g._kids.length * g._step + 1100);
    }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { go(e.target); io.unobserve(e.target); } });
    }, { threshold: 0.05, rootMargin: "0px 0px -8% 0px" });
    groups.forEach(function (g) { io.observe(g); });
  })();

  /* ---- reveal on scroll ---------------------------------------------- */
  var reveals = qsa(".reveal");
  if (reduce || !("IntersectionObserver" in window)) reveals.forEach(function (el) { el.classList.add("in"); });
  else {
    var rio = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); rio.unobserve(e.target); } });
    }, { threshold: 0.08, rootMargin: "0px 0px -6% 0px" });
    reveals.forEach(function (el) { rio.observe(el); });
  }

  /* ---- draw-in: icon strokes ----------------------------------------- */
  qsa(".draw svg > *").forEach(function (el) { el.setAttribute("pathLength", "1"); });
  if (!reduce && "IntersectionObserver" in window) {
    var dio = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("drawn"); dio.unobserve(e.target); } });
    }, { threshold: 0.15 });
    qsa(".draw").forEach(function (g) { g.classList.add("armed"); dio.observe(g); });
  }

  /* ---- dock: magnify icons near the pointer -------------------------- */
  var dock = document.getElementById("dock");
  var dockLinks = dock ? qsa("a", dock) : [];
  if (dock && fine && !reduce && window.innerWidth > 640) {
    dock.addEventListener("pointermove", function (e) {
      dockLinks.forEach(function (a) {
        var r = a.getBoundingClientRect();
        var d = Math.abs(e.clientX - (r.left + r.width / 2));
        a.style.setProperty("--s", (44 + 20 * Math.max(0, 1 - d / 150)).toFixed(1) + "px");
      });
    });
    dock.addEventListener("pointerleave", function () {
      dockLinks.forEach(function (a) { a.style.removeProperty("--s"); });
    });
  }

  /* ---- scroll: progress, dock, active section ------------------------ */
  var sections = jumpTo.map(function (id) { return document.getElementById(id); }).filter(Boolean);
  var spyLinks = qsa("[data-spy]");
  var hero = document.getElementById("hero");
  var activeId = null, queued = false, lastY = 0;
  function onScroll() {
    queued = false;
    var y = window.scrollY || docEl.scrollTop;
    var vh = window.innerHeight || 800;
    var max = docEl.scrollHeight - docEl.clientHeight;
    if (prog) prog.style.transform = "scaleX(" + (max > 0 ? clamp(y / max, 0, 1) : 0) + ")";
    if (dock) {
      dock.classList.toggle("show", y > (hero ? hero.offsetHeight * 0.35 : vh * 0.4));
      // on phones the dock tucks away while reading downwards and returns on any upward scroll
      if (window.innerWidth <= 640) {
        if (y > lastY + 8 && y > 320) dock.classList.add("tuck");
        else if (y < lastY - 4 || y + vh >= docEl.scrollHeight - 80) dock.classList.remove("tuck");
      } else dock.classList.remove("tuck");
    }
    lastY = y;
    var line = y + vh * 0.4, cur = null;
    sections.forEach(function (s) { if (s.offsetTop <= line) cur = s; });
    if (y + vh >= docEl.scrollHeight - 4) cur = sections[sections.length - 1];
    var id = cur ? cur.id : null;
    if (id !== activeId) {
      activeId = id;
      spyLinks.forEach(function (a) { a.classList.toggle("active", a.getAttribute("data-spy") === id); });
    }
  }
  function queue() { if (!queued) { queued = true; requestAnimationFrame(onScroll); } }
  window.addEventListener("scroll", queue, { passive: true });
  window.addEventListener("resize", queue, { passive: true });
  onScroll();
})();
