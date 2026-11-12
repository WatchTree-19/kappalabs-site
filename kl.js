/* Kappa Labs site measurement. Cookie-free: nothing is stored on the visitor's device.
   Cloudflare Web Analytics counts visits, pages, referrers and countries.
   GoatCounter counts the events below, each as an event path such as "copy-email". */
(function () {
  var CF_TOKEN = "";          // Cloudflare Web Analytics token
  var GC_CODE = "";           // GoatCounter site code (the part before .goatcounter.com)

  function add(src, attrs) {
    var s = document.createElement("script");
    s.defer = true; s.src = src;
    for (var k in attrs) s.setAttribute(k, attrs[k]);
    document.head.appendChild(s);
  }
  if (CF_TOKEN) add("https://static.cloudflareinsights.com/beacon.min.js", { "data-cf-beacon": JSON.stringify({ token: CF_TOKEN }) });
  if (!GC_CODE) return;
  add("https://gc.zgo.at/count.js", { "data-goatcounter": "https://" + GC_CODE + ".goatcounter.com/count" });

  var page = location.pathname.replace(/\.html$/, "").replace(/\/$/, "").replace(/^\/index$/, "") || "/home";
  var sent = {};
  function ev(name, once) {
    if (once && sent[name]) return;
    sent[name] = 1;
    try {
      if (window.goatcounter && window.goatcounter.count) {
        window.goatcounter.count({ path: name, title: page, event: true });
      }
    } catch (e) {}
  }

  // Clicks: copy email, email links, PDF downloads, links out, the hero's judge buttons, buyer pages
  document.addEventListener("click", function (e) {
    var t = e.target.closest ? e.target.closest("a, button") : null;
    if (!t) return;
    if (t.id === "copy") return ev("copy-email" + page);
    if (t.closest && t.closest("#judges")) return ev("hero-judge" + page, true);
    var h = t.getAttribute("href") || "";
    if (h.indexOf("mailto:") === 0) return ev("email-click" + page);
    if (/\.pdf($|\?)/i.test(h)) return ev("pdf" + page + "/" + h.split("/").pop());
    if (/^https?:\/\//.test(h) && h.indexOf(location.host) < 0) {
      try { return ev("out/" + new URL(h).host + page); } catch (x) {}
    }
    if (h.indexOf("#contact") >= 0) return ev("cta-contact" + page);
  }, true);

  // How far down each page people read
  var marks = [25, 50, 75, 100];
  function onScroll() {
    var d = document.documentElement, max = d.scrollHeight - innerHeight;
    if (max <= 0) return;
    var pct = (scrollY / max) * 100;
    marks.forEach(function (m) { if (pct >= m - 2) ev("scroll-" + m + page, true); });
  }
  addEventListener("scroll", onScroll, { passive: true });

  // How long people stay: time the tab was actually visible, sent once when they leave
  var shown = document.visibilityState === "visible" ? Date.now() : 0, total = 0, done = false;
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "visible") { shown = Date.now(); return; }
    if (shown) { total += Date.now() - shown; shown = 0; }
    report();
  });
  addEventListener("pagehide", report);
  function report() {
    if (done) return;
    if (shown) { total += Date.now() - shown; shown = 0; }
    var s = total / 1000;
    if (s < 1) return;
    done = true;
    var b = s < 10 ? "0-10s" : s < 30 ? "10-30s" : s < 60 ? "30-60s" : s < 180 ? "1-3m" : s < 600 ? "3-10m" : "10m+";
    ev("time-" + b + page, true);
  }
})();
