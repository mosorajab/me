/* =========================================================================
   Portfolio — interactions
   ========================================================================= */
(function () {
  "use strict";

  /* ---- nav: scrolled state ------------------------------------------- */
  var nav = document.getElementById("nav");
  function onScroll() {
    if (window.scrollY > 12) nav.classList.add("scrolled");
    else nav.classList.remove("scrolled");
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---- reveal on scroll ---------------------------------------------- */
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var reveals = Array.prototype.slice.call(document.querySelectorAll(".reveal"));

  function show(el) { el.classList.add("in"); }

  if (reduce || !("IntersectionObserver" in window)) {
    reveals.forEach(show);
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { show(e.target); io.unobserve(e.target); }
      });
    }, { threshold: 0.01, rootMargin: "0px 0px -6% 0px" });

    // Reveal anything already within the first screen immediately (no wait
    // for the observer's first async tick), then observe the rest.
    var vh = window.innerHeight || 800;
    reveals.forEach(function (el) {
      var top = el.getBoundingClientRect().top;
      if (top < vh * 0.92) show(el);
      else io.observe(el);
    });

    // Safety net: never leave content hidden.
    setTimeout(function () { reveals.forEach(show); }, 2600);
  }

  /* ---- active section in nav ----------------------------------------- */
  var links = Array.prototype.slice.call(document.querySelectorAll("#navlinks a"));
  var map = {};
  links.forEach(function (a) {
    var id = a.getAttribute("href").slice(1);
    var sec = document.getElementById(id);
    if (sec) map[id] = a;
  });
  var sections = Object.keys(map).map(function (id) { return document.getElementById(id); });

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
    sections.forEach(function (s) { navIO.observe(s); });
  }
})();
