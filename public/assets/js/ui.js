(function () {
  "use strict";

  var paths = {
    search:
      '<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5M11 7v2m0 4v2M7 11h2m4 0h2"/>',
    play:
      '<path d="M8.3 5.8v12.4L18.7 12 8.3 5.8Z"/><path d="M4.5 4.5v15M19.5 7v10"/>',
    heart:
      '<path d="M12 20s-7.2-4.4-8.6-9.1C2.2 7.6 4.3 4.7 7.5 4.7c1.9 0 3.5 1.1 4.5 2.5 1-1.4 2.6-2.5 4.5-2.5 3.2 0 5.3 2.9 4.1 6.2C19.2 15.6 12 20 12 20Z"/><path d="M7 9.2h2m6 0h2"/>',
    sun:
      '<circle cx="12" cy="12" r="3.6"/><path d="M12 2v2.2M12 19.8V22M2 12h2.2M19.8 12H22M4.9 4.9l1.6 1.6m11 11 1.6 1.6M19.1 4.9l-1.6 1.6m-11 11-1.6 1.6"/>',
    arrow:
      '<path d="M5 12h14M13 6l6 6-6 6"/><path d="M5 6v12"/>',
    back:
      '<path d="m11 5-7 7 7 7M4 12h16"/><path d="M18 7v10"/>',
    grid:
      '<rect x="3.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.5"/><path d="M17 14v7m-3.5-3.5h7"/>',
    trend:
      '<path d="M4 17 9 12l3.5 3.5L20 8"/><path d="M14 8h6v6"/><path d="M4 21h16"/>',
    user:
      '<circle cx="12" cy="8" r="3.5"/><path d="M5 20c.6-4 3-6 7-6s6.4 2 7 6"/><path d="M3 4h3M18 4h3"/>',
    spark:
      '<path d="m12 2 1.4 5.1L18 8.5l-4.6 1.4L12 15l-1.4-5.1L6 8.5l4.6-1.4L12 2Z"/><path d="m18.5 14 .8 2.7 2.7.8-2.7.8-.8 2.7-.8-2.7-2.7-.8 2.7-.8.8-2.7Z"/>',
    tune:
      '<path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/>',
    layers:
      '<path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m4 12 8 4.5 8-4.5M4 16l8 4.5 8-4.5"/>',
    close:
      '<path d="m6 6 12 12M18 6 6 18"/><path d="M3.5 8V3.5H8M16 20.5h4.5V16"/>',
    trash:
      '<path d="M5 7h14M9 7V4h6v3M7 7l1 13h8l1-13M10 11v5m4-5v5"/>',
    edit:
      '<path d="m5 16-1 4 4-1L19 8l-3-3L5 16Z"/><path d="m13.8 7.2 3 3M4 4h7M4 8V4"/>',
    pulse:
      '<path d="M3 13h4l2-6 4 12 2-6h6"/><path d="M4 4h4M16 20h4"/>',
    crown:
      '<path d="m3 7 4.5 4L12 4l4.5 7L21 7l-2 11H5L3 7Z"/><path d="M6 21h12M8 14h8"/>',
    rocket:
      '<path d="M14 4c3-2 5-1 6-1 0 1 1 3-1 6l-5 5-5-5 5-5Z"/><path d="m9 9-4 1-2 3 5 1m7-1-1 5-3 2-1-5"/><circle cx="15.5" cy="7.5" r="1.5"/>',
    briefcase:
      '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V4h6v3M3 12h18M10 12v3h4v-3"/>',
    download:
      '<path d="M12 3v12m0 0 5-5m-5 5-5-5"/><path d="M4 18v3h16v-3"/>',
    check:
      '<circle cx="12" cy="12" r="9"/><path d="m8 12 2.5 2.5L16 9"/>',
    shield:
      '<path d="M12 3 5 6v5c0 4.6 2.8 8.1 7 10 4.2-1.9 7-5.4 7-10V6l-7-3Z"/><path d="m9 12 2 2 4-4"/>',
  };

  function icon(name) {
    return (
      '<svg class="tech-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
      (paths[name] || paths.spark) +
      "</svg>"
    );
  }

  function inferredIcon(element) {
    var text = element.textContent || "";
    if (element.dataset.icon) return element.dataset.icon;
    if (element.id === "themeToggle") return "sun";
    if (element.id === "clearSearch") return "close";
    if (element.id === "loadMore") return "layers";
    if (element.id === "clearHistory") return "trash";
    if (element.id === "edit") return "edit";
    if (element.id === "back" || /返回/.test(text)) return "back";
    if (
      element.id === "play" ||
      element.id === "continueButton" ||
      element.dataset.play !== undefined ||
      /播放|继续/.test(text)
    )
      return "play";
    if (
      element.id === "favorite" ||
      element.id === "fav" ||
      element.dataset.favorite !== undefined ||
      /收藏|片单/.test(text)
    )
      return "heart";
    if (element.closest && element.closest(".hero-search")) return "search";
    if (element.closest && element.closest(".filters")) return "tune";
    if (element.closest && element.closest(".episode-list")) return "pulse";
    if (element.classList.contains("rank-card")) return "trend";
    if (element.dataset.query !== undefined) return "spark";
    if (element.dataset.action === "favorite") return "trash";
    return "spark";
  }

  function removeLegacyGlyph(element) {
    Array.prototype.slice.call(element.childNodes).forEach(function (node) {
      if (node.nodeType !== 3) return;
      node.nodeValue = node.nodeValue.replace(
        /^\s*[☼☾♥♡▶⌕⌂▦↗○×]+\s*/,
        "",
      );
    });
  }

  function enhance(element) {
    if (!(element instanceof Element)) return;
    if (
      !element.matches(
        "button,.profile-button,.mobile-nav a,.brand-mark[data-icon]",
      )
    )
      return;
    removeLegacyGlyph(element);
    if (element.querySelector(":scope > .tech-icon")) return;
    element.insertAdjacentHTML("afterbegin", icon(inferredIcon(element)));
    element.classList.add("has-tech-icon");
  }

  function enhanceAll(root) {
    if (!root || !root.querySelectorAll) return;
    if (
      root.matches &&
      root.matches(
        "button,.profile-button,.mobile-nav a,.brand-mark[data-icon]",
      )
    )
      enhance(root);
    root
      .querySelectorAll(
        "button,.profile-button,.mobile-nav a,.brand-mark[data-icon]",
      )
      .forEach(enhance);
  }

  function rememberScene(url, origin) {
    var card =
      origin &&
      (origin.closest(".movie-card,.deck-slide,.detail-layout,.library-item") ||
        origin);
    var image = card && card.querySelector("img");
    var title = card && card.querySelector("h1,h2,h3,strong");
    sessionStorage.setItem(
      "jusou:scene",
      JSON.stringify({
        url: image ? image.currentSrc || image.src : "",
        title: title ? title.textContent : "",
        target: url.indexOf("play.html") > -1 ? "player" : "detail",
        time: Date.now(),
      }),
    );
  }

  function go(url, origin) {
    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      !origin
    ) {
      location.href = url;
      return;
    }
    rememberScene(url, origin);
    var source =
      origin.closest(".card-poster,.deck-slide,.detail-art,.library-thumb") ||
      origin.querySelector(".card-poster,.deck-art,.detail-art,.library-thumb") ||
      origin;
    var rect = source.getBoundingClientRect();
    var image = source.querySelector && source.querySelector("img");
    var layer = document.createElement("div");
    layer.className = "route-flight";
    layer.innerHTML =
      '<div class="route-flight-grid"></div><div class="route-flight-card"></div><div class="route-flight-scan"></div>';
    var card = layer.querySelector(".route-flight-card");
    card.style.setProperty("--from-x", rect.left + "px");
    card.style.setProperty("--from-y", rect.top + "px");
    card.style.setProperty("--from-w", Math.max(1, rect.width) + "px");
    card.style.setProperty("--from-h", Math.max(1, rect.height) + "px");
    if (image) card.style.backgroundImage = 'url("' + image.src + '")';
    document.body.appendChild(layer);
    requestAnimationFrame(function () {
      layer.classList.add("active");
    });
    setTimeout(function () {
      location.href = url;
    }, 560);
  }

  function runArrival() {
    var raw = sessionStorage.getItem("jusou:scene");
    if (!raw) return;
    sessionStorage.removeItem("jusou:scene");
    try {
      var scene = JSON.parse(raw);
      if (Date.now() - scene.time > 5000) return;
      var layer = document.createElement("div");
      layer.className = "route-arrival " + scene.target;
      layer.innerHTML =
        '<div class="arrival-media"></div><div class="arrival-grid"></div><div class="arrival-label"><span>JUSOU // LINK</span><strong>' +
        (scene.title || "场景载入") +
        "</strong></div>";
      if (scene.url)
        layer.querySelector(".arrival-media").style.backgroundImage =
          'url("' + scene.url + '")';
      document.body.appendChild(layer);
      requestAnimationFrame(function () {
        layer.classList.add("active");
      });
      setTimeout(function () {
        layer.remove();
      }, 900);
    } catch (_error) {}
  }

  function installRipple(event) {
    var button = event.target.closest(
      "button,.profile-button,.mobile-nav a",
    );
    if (!button) return;
    var rect = button.getBoundingClientRect();
    var pulse = document.createElement("i");
    pulse.className = "tech-ripple";
    pulse.style.left = event.clientX - rect.left + "px";
    pulse.style.top = event.clientY - rect.top + "px";
    button.appendChild(pulse);
    setTimeout(function () {
      pulse.remove();
    }, 650);
  }

  function installPalette() {
    var themeButton = document.getElementById("themeToggle");
    if (!themeButton) return;
    var choices = [
      ["matrix", "翡翠矩阵", "#20f29a", "#c9ff43"],
      ["ocean", "极光蓝", "#28d8ff", "#3975ff"],
      ["quantum", "量子紫", "#9c6cff", "#e86dff"],
      ["pulse", "霓虹粉", "#ff4fa3", "#ff7a59"],
      ["solar", "熔金橙", "#ffad32", "#ff5d2e"],
      ["ice", "冰川青", "#58ffe2", "#62a9ff"],
    ];
    var selected = localStorage.getItem("jusou:palette") || "matrix";
    document.documentElement.dataset.palette = selected;
    var panel = document.createElement("section");
    panel.className = "palette-panel";
    panel.id = "palettePanel";
    panel.setAttribute("aria-label", "渐变主题选择");
    panel.innerHTML =
      '<div class="palette-head"><div><span>CHROMA CORE</span><strong>能量主题</strong></div><small>实时切换</small></div><div class="palette-grid">' +
      choices
        .map(function (choice) {
          return (
            '<button type="button" data-palette="' +
            choice[0] +
            '" data-icon="spark" style="--c1:' +
            choice[2] +
            ";--c2:" +
            choice[3] +
            '" aria-label="切换到' +
            choice[1] +
            '"><i></i><span>' +
            choice[1] +
            "</span></button>"
          );
        })
        .join("") +
      '</div><div class="palette-spectrum" aria-hidden="true"></div>';
    document.body.appendChild(panel);

    function choose(name) {
      document.documentElement.dataset.palette = name;
      localStorage.setItem("jusou:palette", name);
      panel.querySelectorAll("[data-palette]").forEach(function (button) {
        button.classList.toggle("active", button.dataset.palette === name);
      });
    }

    choose(selected);
    panel.addEventListener("click", function (event) {
      var choice = event.target.closest("[data-palette]");
      if (!choice) return;
      choose(choice.dataset.palette);
      if (navigator.vibrate) navigator.vibrate(12);
    });
    themeButton.addEventListener(
      "click",
      function (event) {
        event.preventDefault();
        event.stopImmediatePropagation();
        panel.classList.toggle("open");
        themeButton.classList.toggle("active", panel.classList.contains("open"));
      },
      true,
    );
    document.addEventListener("click", function (event) {
      if (
        !panel.contains(event.target) &&
        !themeButton.contains(event.target)
      ) {
        panel.classList.remove("open");
        themeButton.classList.remove("active");
      }
    });
  }

  window.TechIcon = icon;
  window.NeonNav = { go: go };
  if (window.Jusou) {
    window.Jusou.openDetail = function (id, origin) {
      go("./detail.html?id=" + encodeURIComponent(id), origin);
    };
    window.Jusou.openPlayer = function (id, episode, origin) {
      go(
        "./play.html?id=" +
          encodeURIComponent(id) +
          "&episode=" +
          (episode || 0),
        origin,
      );
    };
  }

  document.addEventListener("pointerdown", installRipple, { passive: true });
  enhanceAll(document);
  new MutationObserver(function (mutations) {
    mutations.forEach(function (mutation) {
      mutation.addedNodes.forEach(function (node) {
        if (node.nodeType === 1) enhanceAll(node);
      });
      if (mutation.target instanceof Element) enhance(mutation.target);
    });
  }).observe(document.documentElement, {
    childList: true,
    subtree: true,
  });
  installPalette();
  runArrival();
})();
