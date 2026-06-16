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
  var heroBg = document.querySelector(".hero-bg");
  var docEl = document.documentElement;
  function onScroll() {
    var y = window.scrollY || docEl.scrollTop;
    if (nav) nav.classList.toggle("scrolled", y > 12);
    if (prog) {
      var max = docEl.scrollHeight - docEl.clientHeight;
      prog.style.transform = "scaleX(" + (max > 0 ? Math.min(1, y / max) : 0) + ")";
    }
    /* subtle hero grid parallax */
    if (heroBg) {
      if (reduce || document.body.classList.contains("no-motion")) {
        heroBg.style.transform = "";
      } else if (y < window.innerHeight * 1.2) {
        heroBg.style.transform = "translate3d(0," + (y * 0.14).toFixed(1) + "px,0)";
      }
    }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  onScroll();

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

  /* ---- collections: draw icon strokes when in view ------------------- */
  var collGrid = document.querySelector(".coll-grid");
  if (collGrid) {
    if (reduce || !("IntersectionObserver" in window)) {
      collGrid.classList.add("drawn");
    } else {
      var drawIt = function () { collGrid.classList.add("drawn"); };
      var cio = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { if (e.isIntersecting) { drawIt(); cio.unobserve(e.target); } });
      }, { threshold: 0.01, rootMargin: "0px 0px -5% 0px" });
      if (collGrid.getBoundingClientRect().top < (window.innerHeight || 800) * 0.95) drawIt();
      else cio.observe(collGrid);
      setTimeout(drawIt, 3200);
    }
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

  /* ---- active section in nav ----------------------------------------- */
  var links = qsa("#navlinks a");
  var map = {};
  links.forEach(function (a) {
    var id = a.getAttribute("href").slice(1);
    if (document.getElementById(id)) map[id] = a;
  });
  if ("IntersectionObserver" in window) {
    var current = null;
    var navIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          var id = e.target.id;
          if (current && map[current]) map[current].classList.remove("active");
          if (map[id]) { map[id].classList.add("active"); current = id; }
        }
      });
    }, { threshold: 0.0, rootMargin: "-45% 0px -50% 0px" });
    Object.keys(map).forEach(function (id) { navIO.observe(document.getElementById(id)); });
  }
})();
