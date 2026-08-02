(function () {
  "use strict";
  var progress = document.createElement("div");
  progress.className = "scroll-progress";
  document.body.appendChild(progress);
  var wipe = document.createElement("div");
  wipe.className = "page-wipe";
  wipe.innerHTML = '<i></i><i></i><span><b>JUSOU</b><small>正在切换界面</small></span>';
  document.body.appendChild(wipe);
  function onScroll() {
    var height = document.documentElement.scrollHeight - innerHeight;
    progress.style.setProperty("--scroll", (height > 0 ? scrollY / height * 100 : 0) + "%");
  }
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("./sw.js").catch(function () {});
  var installEvent = null;
  addEventListener("beforeinstallprompt", function (event) {
    event.preventDefault();
    installEvent = event;
    document.querySelectorAll("[data-install]").forEach(function (button) { button.disabled = false; button.textContent = "安装到手机"; });
  });
  window.JusouInstall = async function () {
    if (installEvent) { installEvent.prompt(); var result = await installEvent.userChoice; installEvent = null; return result.outcome; }
    if (/iPhone|iPad|iPod/.test(navigator.userAgent)) { alert("请点 Safari 底部分享按钮，再选择“添加到主屏幕”。"); return "ios"; }
    alert("请通过浏览器菜单选择“安装应用”或“添加到主屏幕”。");
    return "help";
  };
  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) { if (entry.isIntersecting) entry.target.classList.add("visible"); });
  }, { threshold: 0.08 });
  document.querySelectorAll(".app-section,.bento-card,.plan-card,.commerce-card,.legal-card,.ranking-section").forEach(function (element) {
    element.classList.add("reveal"); observer.observe(element);
  });
  document.querySelectorAll(".kinetic-row").forEach(function (row) {
    var ticking = false;
    function update() {
      var rect = row.getBoundingClientRect(), center = rect.left + rect.width / 2, cards = row.querySelectorAll(".kinetic-card"), best = 0, nearest = Infinity;
      cards.forEach(function (card, index) {
        var cardRect = card.getBoundingClientRect(), distance = (cardRect.left + cardRect.width / 2 - center) / cardRect.width, value = Math.max(-1, Math.min(1, distance));
        card.style.setProperty("--kinetic", value.toFixed(3)); card.style.setProperty("--kinetic-abs", Math.abs(value).toFixed(3));
        if (Math.abs(distance) < nearest) { nearest = Math.abs(distance); best = index; }
      });
      cards.forEach(function (card, index) { card.classList.toggle("active", index === best); }); ticking = false;
    }
    row.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true }); update();
  });
  function decorateRanking() {
    document.querySelectorAll(".vertical-ranking .rank-card").forEach(function (card, index) {
      if (card.querySelector(".rank-meter")) return;
      var meter = document.createElement("span"); meter.className = "rank-meter"; meter.style.setProperty("--rank", (96 - index * 8) + "%"); meter.innerHTML = "<i></i>"; card.appendChild(meter);
    });
  }
  new MutationObserver(decorateRanking).observe(document.documentElement, { childList: true, subtree: true }); decorateRanking();
  document.addEventListener("pointermove", function (event) {
    var card = event.target.closest(".bento-card,.plan-card,.commerce-card,.movie-card");
    if (!card || matchMedia("(pointer:coarse)").matches) return;
    var rect = card.getBoundingClientRect();
    card.style.setProperty("--mx", ((event.clientX - rect.left) / rect.width * 100) + "%");
    card.style.setProperty("--my", ((event.clientY - rect.top) / rect.height * 100) + "%");
  }, { passive: true });
  var extraPalettes = [
    ["nebula", "星云钛紫", "#a78bfa", "#22d3ee"],
    ["graphite", "石墨银焰", "#e2e8f0", "#64748b"],
    ["aurora", "极光青金", "#34d399", "#fbbf24"]
  ];
  var paletteGrid = document.querySelector(".palette-grid");
  if (paletteGrid) {
    extraPalettes.forEach(function (item) {
      if (paletteGrid.querySelector('[data-palette="' + item[0] + '"]')) return;
      var button = document.createElement("button");
      button.type = "button";
      button.dataset.palette = item[0];
      button.style.setProperty("--c1", item[2]);
      button.style.setProperty("--c2", item[3]);
      button.innerHTML = '<i></i><span>' + item[1] + '</span>';
      paletteGrid.appendChild(button);
    });
  }
  document.addEventListener("click", function (event) {
    var install = event.target.closest("[data-install]"); if (install) window.JusouInstall();
    var interactive = event.target.closest("button,.primary-button,.secondary-button,.profile-button,.mobile-nav a,.bento-card,.movie-card");
    if (interactive) {
      var rect = interactive.getBoundingClientRect(), ripple = document.createElement("i");
      ripple.className = "ui-ripple"; ripple.style.left = (event.clientX - rect.left) + "px"; ripple.style.top = (event.clientY - rect.top) + "px"; interactive.appendChild(ripple);
      setTimeout(function () { ripple.remove(); }, 720);
    }
    var link = event.target.closest(".desktop-nav a,.mobile-nav a,.bento-card,.app-hero-actions a,.app-footer a");
    if (!link || event.defaultPrevented || event.button > 0 || event.metaKey || event.ctrlKey || event.shiftKey || link.target === "_blank") return;
    var target = new URL(link.href, location.href);
    if (target.origin !== location.origin || target.pathname === location.pathname && target.hash) return;
    event.preventDefault(); wipe.classList.add("active"); wipe.querySelector("small").textContent = link.textContent.trim() || "正在切换界面";
    setTimeout(function () { location.href = target.href; }, 430);
  });
})();
