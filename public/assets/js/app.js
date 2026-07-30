(function () {
  "use strict";

  var state = {
    items: [],
    page: 1,
    total: 0,
    busy: false,
    query: "",
    filter: "全部",
  };
  var grid = document.getElementById("movieGrid");
  var more = document.getElementById("loadMore");

  function esc(value) {
    return String(value || "").replace(/[&<>"']/g, function (character) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      }[character];
    });
  }

  function tones(id) {
    var colors = [
      ["#22e889", "#07351f"],
      ["#28d8ff", "#082d48"],
      ["#9c6cff", "#241647"],
      ["#ff4fa3", "#48122e"],
      ["#ffad32", "#412305"],
    ];
    var key = String(id)
      .split("")
      .reduce(function (sum, character) {
        return sum + character.charCodeAt(0);
      }, 0);
    return colors[key % colors.length];
  }

  function poster(movie, eager) {
    if (movie.cover) {
      return (
        '<img src="' +
        esc(movie.cover) +
        '" alt="' +
        esc(movie.name) +
        '海报" ' +
        (eager ? 'fetchpriority="high"' : 'loading="lazy"') +
        ">"
      );
    }
    var tone = tones(movie.id);
    return (
      '<div class="poster-fallback" style="--tone:' +
      tone[0] +
      ";--shade:" +
      tone[1] +
      '"><span>剧搜</span><strong>' +
      esc(movie.name) +
      "</strong></div>"
    );
  }

  function card(movie) {
    return (
      '<article class="movie-card" tabindex="0" data-id="' +
      esc(movie.id) +
      '">' +
      '<div class="card-poster">' +
      poster(movie) +
      '<span class="card-badge">' +
      esc(movie.remarks || "热播中") +
      "</span>" +
      '<button class="favorite-button ' +
      (Jusou.isFavorite(movie.id) ? "active" : "") +
      '" data-favorite="' +
      esc(movie.id) +
      '" data-icon="heart" aria-label="收藏"></button>' +
      '<div class="card-hover"><button data-play="' +
      esc(movie.id) +
      '" data-icon="play">立即播放</button></div>' +
      "</div>" +
      '<div class="card-copy"><h3>' +
      esc(movie.name) +
      "</h3><p><span>" +
      esc(movie.type) +
      "</span><span>" +
      (movie.score
        ? Number(movie.score).toFixed(1) + " 分"
        : esc(movie.year)) +
      "</span></p></div></article>"
    );
  }

  function visibleItems() {
    return state.filter === "全部"
      ? state.items
      : state.items.filter(function (movie) {
          return (movie.type || "").indexOf(state.filter) > -1;
        });
  }

  function render() {
    var items = visibleItems();
    grid.innerHTML = items.length
      ? items.map(card).join("")
      : '<div class="empty-state"><span>⌕</span><h3>暂时没有找到合适的短剧</h3><p>换个关键词，或浏览全部热播内容。</p></div>';
    more.classList.toggle(
      "hidden",
      !!state.query ||
        state.items.length >= state.total ||
        state.filter !== "全部",
    );
    document.getElementById("favoriteCount").textContent =
      Jusou.favorites().length;
  }

  function skeleton() {
    grid.innerHTML = Array(8)
      .fill(
        '<div class="card-skeleton"><i></i><b></b><span></span></div>',
      )
      .join("");
  }

  function toast(message) {
    var element = document.getElementById("toast");
    element.textContent = message;
    element.classList.add("show");
    clearTimeout(element.hideTimer);
    element.hideTimer = setTimeout(function () {
      element.classList.remove("show");
    }, 1800);
  }

  function busy(value) {
    state.busy = value;
    more.disabled = value;
    more.textContent = value ? "加载中…" : "加载更多";
  }

  function renderFeature(featured) {
    var deck = state.items.slice(0, 6);
    var slides = deck
      .map(function (movie, index) {
        return (
          '<article class="deck-slide" data-id="' +
          esc(movie.id) +
          '">' +
          '<div class="deck-layer-stack" aria-hidden="true"><i></i><i></i><i></i></div>' +
          '<div class="deck-art">' +
          poster(movie, index === 0) +
          '<div class="deck-art-hud"><span>NODE 0' +
          (index + 1) +
          "</span><b>" +
          esc(movie.remarks || "在线") +
          "</b></div></div>" +
          '<div class="deck-glass"><div><span>0' +
          (index + 1) +
          " · " +
          esc(movie.type) +
          "</span><b>" +
          (movie.score ? Number(movie.score).toFixed(1) : "NEW") +
          "</b></div><h2>" +
          esc(movie.name) +
          "</h2><p>" +
          esc(movie.year) +
          " · " +
          esc(movie.area) +
          '</p><button data-play="' +
          esc(movie.id) +
          '" data-icon="play">立即播放</button></div></article>'
        );
      })
      .join("");
    var dots = deck
      .map(function (_, index) {
        return '<i class="' + (index === 0 ? "active" : "") + '"></i>';
      })
      .join("");

    document.getElementById("heroFeature").innerHTML =
      '<div class="feature-console">' +
      '<div class="console-rail console-left" aria-hidden="true">' +
      '<div><span>内容节点</span><b>' +
      state.total.toLocaleString("zh-CN") +
      '</b><small>实时片库</small></div>' +
      '<div><span>播放协议</span><b>HLS</b><small>自适应码率</small></div>' +
      "</div>" +
      '<div class="feature-orbit" aria-hidden="true"><i></i><i></i><i></i><i></i></div>' +
      '<div class="feature-poster">' +
      poster(featured, true) +
      '<span class="poster-node">LIVE // 0.31</span></div>' +
      '<div class="feature-info"><div><span>今日推荐 · ' +
      esc(featured.type) +
      "</span><strong>" +
      (featured.score ? Number(featured.score).toFixed(1) : "NEW") +
      "</strong></div><h2>" +
      esc(featured.name) +
      "</h2><p>" +
      esc(featured.intro || featured.type) +
      '</p><div class="feature-progress"><span style="width:' +
      (featured.score ? Math.min(100, Number(featured.score) * 10) : 86) +
      '%"></span></div><button data-play="' +
      esc(featured.id) +
      '" data-icon="play">播放第一集</button></div>' +
      '<div class="console-rail console-right" aria-hidden="true">' +
      '<div><span>信号质量</span><b>98%</b><small>低延迟链路</small></div>' +
      '<div><span>今日上新</span><b>20+</b><small>持续同步</small></div>' +
      "</div></div>" +
      '<div class="mobile-deck-wrap"><div class="deck-top"><span id="deckReadout">NODE 01 / 0' +
      deck.length +
      '</span><b>左右滑动 · SWIPE</b></div><div class="mobile-deck" id="mobileDeck">' +
      slides +
      '</div><div class="deck-dots" id="deckDots">' +
      dots +
      "</div></div>";
    setupSwipe(deck.length);
  }

  function setupSwipe(count) {
    var deck = document.getElementById("mobileDeck");
    if (!deck) return;
    var slides = Array.prototype.slice.call(
      deck.querySelectorAll(".deck-slide"),
    );
    var dots = Array.prototype.slice.call(
      document.querySelectorAll("#deckDots i"),
    );
    var readout = document.getElementById("deckReadout");
    var lastIndex = -1;
    var ticking = false;

    function update() {
      var deckRect = deck.getBoundingClientRect();
      var center = deckRect.left + deckRect.width / 2;
      var activeIndex = 0;
      var closest = Infinity;
      slides.forEach(function (slide, index) {
        var rect = slide.getBoundingClientRect();
        var distance = (rect.left + rect.width / 2 - center) / rect.width;
        var clamped = Math.max(-1, Math.min(1, distance));
        slide.style.setProperty("--swipe-x", clamped.toFixed(3));
        slide.style.setProperty(
          "--swipe-abs",
          Math.abs(clamped).toFixed(3),
        );
        if (Math.abs(distance) < closest) {
          closest = Math.abs(distance);
          activeIndex = index;
        }
      });
      slides.forEach(function (slide, index) {
        slide.classList.toggle("active", index === activeIndex);
      });
      dots.forEach(function (dot, index) {
        dot.classList.toggle("active", index === activeIndex);
      });
      if (readout)
        readout.textContent =
          "NODE " +
          String(activeIndex + 1).padStart(2, "0") +
          " / " +
          String(count).padStart(2, "0");
      if (
        lastIndex >= 0 &&
        activeIndex !== lastIndex &&
        navigator.vibrate
      )
        navigator.vibrate(8);
      lastIndex = activeIndex;
      ticking = false;
    }

    deck.addEventListener(
      "scroll",
      function () {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(update);
      },
      { passive: true },
    );
    window.addEventListener("resize", update, { passive: true });
    update();
  }

  async function initial() {
    skeleton();
    busy(true);
    try {
      var response = await Jusou.home();
      state.items = response.list || [];
      state.total = response.total || state.items.length;
      render();
      if (state.items[0]) renderFeature(state.items[0]);
      document.getElementById("rankingGrid").innerHTML = state.items
        .slice(0, 5)
        .map(function (movie, index) {
          return (
            '<button class="rank-card" data-id="' +
            esc(movie.id) +
            '" data-icon="trend"><b>0' +
            (index + 1) +
            "</b>" +
            poster(movie) +
            "<span><strong>" +
            esc(movie.name) +
            "</strong><small>" +
            esc(movie.type) +
            " · " +
            esc(movie.remarks) +
            "</small></span></button>"
          );
        })
        .join("");
      var history = Jusou.history();
      if (history[0]) {
        document.getElementById("continueSection").classList.remove("hidden");
        document.getElementById("continueTitle").textContent =
          history[0].name + " · 第" + ((history[0].episode || 0) + 1) + "集";
        document.getElementById("continueButton").onclick = function () {
          Jusou.openPlayer(
            history[0].id,
            history[0].episode,
            document.getElementById("continueSection"),
          );
        };
      }
      if (response.offline) toast("内容服务暂不可用，已展示精选内容");
    } catch (error) {
      state.items = [];
      render();
      toast(error.message || "内容加载失败");
    }
    busy(false);
  }

  async function search(keyword) {
    keyword = keyword.trim();
    if (!keyword) return clear();
    state.query = keyword;
    state.filter = "全部";
    skeleton();
    busy(true);
    document.getElementById("resultTitle").textContent =
      "“" + keyword + "”的搜索结果";
    document.getElementById("clearSearch").classList.remove("hidden");
    try {
      var response = await Jusou.search(keyword);
      state.items = response.list || [];
      state.total = state.items.length;
      render();
    } catch (error) {
      state.items = [];
      render();
      toast(error.message || "搜索失败");
    }
    busy(false);
  }

  async function clear() {
    state.query = "";
    state.filter = "全部";
    state.page = 1;
    document.getElementById("searchInput").value = "";
    document.getElementById("resultTitle").textContent = "正在热播";
    document.getElementById("clearSearch").classList.add("hidden");
    document.querySelectorAll("#filters button").forEach(function (button) {
      button.classList.toggle("active", button.dataset.filter === "全部");
    });
    await initial();
  }

  document.addEventListener("click", function (event) {
    var favorite = event.target.closest("[data-favorite]");
    if (favorite) {
      event.stopPropagation();
      var movie = state.items.find(function (item) {
        return String(item.id) === favorite.dataset.favorite;
      });
      if (movie) {
        var active = Jusou.toggleFavorite(movie);
        toast(active ? "已加入我的片单" : "已取消收藏");
        render();
      }
      return;
    }
    var play = event.target.closest("[data-play]");
    if (play) {
      return Jusou.openPlayer(
        play.dataset.play,
        0,
        play.closest(".movie-card,.deck-slide,.feature-console") || play,
      );
    }
    var detail = event.target.closest("[data-id]");
    if (detail)
      return Jusou.openDetail(detail.dataset.id, detail);
    var quickQuery = event.target.closest("[data-query]");
    if (quickQuery) {
      document.getElementById("searchInput").value =
        quickQuery.dataset.query;
      search(quickQuery.dataset.query);
    }
  });

  grid.addEventListener("keydown", function (event) {
    if (
      (event.key === "Enter" || event.key === " ") &&
      event.target.classList.contains("movie-card")
    )
      Jusou.openDetail(event.target.dataset.id, event.target);
  });
  document
    .getElementById("searchForm")
    .addEventListener("submit", function (event) {
      event.preventDefault();
      search(document.getElementById("searchInput").value);
    });
  document.getElementById("clearSearch").onclick = clear;
  document.getElementById("filters").onclick = function (event) {
    var button = event.target.closest("[data-filter]");
    if (!button) return;
    state.filter = button.dataset.filter;
    this.querySelectorAll("button").forEach(function (item) {
      item.classList.toggle("active", item === button);
    });
    document.getElementById("resultTitle").textContent =
      state.filter === "全部" ? "正在热播" : state.filter + "短剧";
    render();
  };
  var hotTabs = document.querySelector(".hot-tabs");
  if (hotTabs) {
    hotTabs.onclick = function (event) {
      var button = event.target.closest("[data-filter]");
      if (!button) return;
      state.filter = button.dataset.filter;
      hotTabs.querySelectorAll("button").forEach(function (item) {
        item.classList.toggle("active", item === button);
      });
      document.querySelectorAll("#filters [data-filter]").forEach(function (item) {
        item.classList.toggle("active", item.dataset.filter === state.filter);
      });
      document.getElementById("resultTitle").textContent =
        state.filter === "全部" ? "正在热播" : state.filter + "短剧";
      render();
    };
  }
  more.onclick = async function () {
    if (state.busy) return;
    busy(true);
    try {
      var response = await Jusou.list(++state.page);
      state.items = state.items.concat(response.list || []);
      state.total = response.total || state.total;
      render();
    } catch (_error) {
      state.page--;
      toast("加载失败，请稍后重试");
    }
    busy(false);
  };

  initial();
})();
