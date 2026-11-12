/* =========================================================================
   Portfolio — interactions & motion
   ========================================================================= */
(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var qsa = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var docEl = document.documentElement;
  var nav = document.getElementById("nav");
  var prog = document.getElementById("progress");

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
  var jumpTo = ["about", "work", "projects", "writing", "collections", "contact"];
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

  /* ---- animated nav mark (builds, then pulses) ----------------------- */
  var navMark = document.getElementById("navMark");
  if (navMark) {
    if (reduce) navMark.classList.add("live");
    else {
      navMark.classList.add("build");
      void navMark.offsetWidth;
      navMark.classList.add("go");
      setTimeout(function () { navMark.classList.add("live"); }, 1700);
    }
  }

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

  /* ---- hero: a light that follows the pointer across Leonardo -------- */
  (function heroLight() {
    var hero = document.getElementById("hero");
    var plate = document.getElementById("heroPlate");
    if (!hero || !plate) return;
    var stage = plate.querySelector(".plate-stage");
    var target = { x: 0.5, y: 0.42 }, cur = { x: 0.5, y: 0.42 };
    var lastMove = 0, raf = 0, t0 = performance.now();
    function frame(now) {
      raf = 0;
      // with no pointer for a while (or on touch), the light wanders on its own
      if (!fine || now - lastMove > 2600) {
        var t = (now - t0) / 1000;
        target.x = 0.5 + Math.sin(t * 0.45) * 0.24;
        target.y = 0.42 + Math.sin(t * 0.31 + 1.3) * 0.22;
      }
      cur.x += (target.x - cur.x) * 0.08;
      cur.y += (target.y - cur.y) * 0.08;
      stage.style.setProperty("--px", (cur.x * 100).toFixed(2) + "%");
      stage.style.setProperty("--py", (cur.y * 100).toFixed(2) + "%");
      var rs = stage.getBoundingClientRect(), rh = hero.getBoundingClientRect();
      hero.style.setProperty("--lx", ((rs.left - rh.left + cur.x * rs.width) / rh.width * 100).toFixed(2) + "%");
      hero.style.setProperty("--ly", ((rs.top - rh.top + cur.y * rs.height) / rh.height * 100).toFixed(2) + "%");
      if (heroVisible) raf = requestAnimationFrame(frame);
    }
    var heroVisible = true;
    if (reduce) { stage.style.setProperty("--pr", "1400px"); return; }
    hero.addEventListener("pointermove", function (e) {
      if (!fine) return;
      var r = stage.getBoundingClientRect();
      target.x = clamp((e.clientX - r.left) / r.width, -0.2, 1.2);
      target.y = clamp((e.clientY - r.top) / r.height, -0.2, 1.2);
      lastMove = performance.now();
    });
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (es) {
        heroVisible = es[0].isIntersecting;
        if (heroVisible && !raf) raf = requestAnimationFrame(frame);
      }).observe(hero);
    }
    raf = requestAnimationFrame(frame);
  })();

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

  /* ---- spotlight cards: glow and lit border follow the pointer ------- */
  if (fine) qsa(".spot").forEach(function (el) {
    el.addEventListener("pointermove", function (e) {
      var r = el.getBoundingClientRect();
      el.style.setProperty("--x", (e.clientX - r.left) + "px");
      el.style.setProperty("--y", (e.clientY - r.top) + "px");
    });
  });

  /* ---- project cards tilt toward the pointer, with glare ------------- */
  if (fine && !reduce) qsa(".tilt").forEach(function (card) {
    var max = card.classList.contains("wide") ? 3 : 6;
    card.addEventListener("pointermove", function (e) {
      var r = card.getBoundingClientRect();
      var px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      card.classList.add("tilting");
      card.style.setProperty("--ry", ((px - 0.5) * 2 * max).toFixed(2) + "deg");
      card.style.setProperty("--rx", ((0.5 - py) * 2 * max).toFixed(2) + "deg");
      card.style.setProperty("--gx", (px * 100).toFixed(1) + "%");
      card.style.setProperty("--gy", (py * 100).toFixed(1) + "%");
    });
    card.addEventListener("pointerleave", function () {
      card.classList.remove("tilting");
      card.style.setProperty("--rx", "0deg"); card.style.setProperty("--ry", "0deg");
    });
  });

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
  var drawGroups = qsa(".draw");
  if (!reduce && "IntersectionObserver" in window) {
    var dio = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("drawn"); dio.unobserve(e.target); } });
    }, { threshold: 0.15 });
    drawGroups.forEach(function (g) { g.classList.add("armed"); dio.observe(g); });
  }

  /* ---- dock: magnify icons near the pointer -------------------------- */
  var dock = document.getElementById("dock");
  var dockLinks = dock ? qsa("a", dock) : [];
  if (dock && fine && !reduce && window.innerWidth > 640) {
    dock.addEventListener("pointermove", function (e) {
      dockLinks.forEach(function (a) {
        var r = a.getBoundingClientRect();
        var d = Math.abs(e.clientX - (r.left + r.width / 2));
        a.style.setProperty("--s", (44 + 22 * Math.max(0, 1 - d / 150)).toFixed(1) + "px");
      });
    });
    dock.addEventListener("pointerleave", function () {
      dockLinks.forEach(function (a) { a.style.removeProperty("--s"); });
    });
  }

  /* ---- scroll: progress, nav rule, dock, active section, tracing beam  */
  var sections = jumpTo.map(function (id) { return document.getElementById(id); }).filter(Boolean);
  var spyLinks = qsa("[data-spy]");
  var hero = document.getElementById("hero");
  var trace = document.getElementById("trace");
  var activeId = null, queued = false;
  function onScroll() {
    queued = false;
    var y = window.scrollY || docEl.scrollTop;
    var vh = window.innerHeight || 800;
    var max = docEl.scrollHeight - docEl.clientHeight;
    if (nav) nav.classList.toggle("scrolled", y > 12);
    if (prog) prog.style.transform = "scaleX(" + (max > 0 ? clamp(y / max, 0, 1) : 0) + ")";
    if (dock) dock.classList.toggle("show", y > (hero ? hero.offsetHeight * 0.35 : vh * 0.4));

    var line = y + vh * 0.4, cur = null;
    sections.forEach(function (s) { if (s.offsetTop <= line) cur = s; });
    if (y + vh >= docEl.scrollHeight - 4) cur = sections[sections.length - 1];
    var id = cur ? cur.id : null;
    if (id !== activeId) {
      activeId = id;
      spyLinks.forEach(function (a) { a.classList.toggle("active", a.getAttribute("data-spy") === id); });
    }

    // the beam grows as the timeline passes the middle of the screen
    if (trace) {
      var r = trace.getBoundingClientRect();
      var p = reduce ? 1 : clamp((vh * 0.6 - r.top) / r.height, 0, 1);
      trace.style.setProperty("--beam", (p * 100).toFixed(1) + "%");
    }
  }
  function queue() { if (!queued) { queued = true; requestAnimationFrame(onScroll); } }
  window.addEventListener("scroll", queue, { passive: true });
  window.addEventListener("resize", queue, { passive: true });
  onScroll();
})();
