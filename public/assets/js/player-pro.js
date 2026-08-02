(function () {
  "use strict";
  var video = document.getElementById("video");
  var stage = document.querySelector(".video-stage");
  var quality = document.getElementById("qualityToggle");
  var qualityLabel = document.getElementById("qualityLabel");
  var menu = document.getElementById("qualityMenu");
  var fit = document.getElementById("fitToggle");
  var enhance = document.getElementById("enhanceToggle");
  var fullscreen = document.getElementById("fullscreenToggle");
  var activeHls = null;

  function resolutionLabel(height, original) {
    var label = height >= 2160 ? "4K" : height >= 1440 ? "2K" : height >= 1080 ? "1080P" : height >= 720 ? "720P" : height >= 480 ? "480P" : height ? height + "P" : "原画";
    return label + (original ? " 原画" : "");
  }

  function selectButton(button) {
    menu.querySelectorAll("button").forEach(function (item) { item.classList.toggle("active", item === button); });
    qualityLabel.textContent = button.dataset.label || "自动";
    quality.classList.remove("open");
  }

  function buildLevels(hls, levels) {
    activeHls = hls;
    var unique = [];
    levels.forEach(function (level, index) {
      var key = (level.height || 0) + ":" + (level.bitrate || 0);
      if (!unique.some(function (item) { return item.key === key; })) unique.push({ key: key, index: index, height: level.height || 0, bitrate: level.bitrate || 0 });
    });
    unique.sort(function (a, b) { return b.height - a.height || b.bitrate - a.bitrate; });
    var auto = '<button class="active" data-level="-1" data-label="自动"><i></i><span><b>智能自动</b><small>按网络实时调整</small></span></button>';
    var choices = unique.map(function (level, position) {
      var label = resolutionLabel(level.height, position === 0);
      return '<button data-level="' + level.index + '" data-label="' + label + '"><i></i><span><b>' + label + '</b><small>' + (level.bitrate ? Math.round(level.bitrate / 1000) + " Kbps" : "片源轨道") + '</small></span></button>';
    }).join("");
    menu.innerHTML = '<header><span>STREAM QUALITY</span><b>' + (unique[0] ? resolutionLabel(unique[0].height, true) : "自动") + '</b></header>' + auto + choices;
    if (unique[0] && unique[0].height >= 2160) stage.classList.add("source-4k"); else stage.classList.remove("source-4k");
  }

  window.addEventListener("jusou:levels", function (event) {
    buildLevels(event.detail.hls, event.detail.levels || []);
    if (window.Hls && event.detail.hls) {
      event.detail.hls.on(Hls.Events.LEVEL_SWITCHED, function (_event, data) {
        if (event.detail.hls.autoLevelEnabled) {
          qualityLabel.textContent = "自动 " + resolutionLabel((event.detail.hls.levels[data.level] || {}).height || 0, false);
        }
      });
    }
  });

  quality.onclick = function (event) {
    event.stopPropagation();
    quality.classList.toggle("open");
  };
  menu.onclick = function (event) {
    var button = event.target.closest("[data-level]");
    if (!button || !activeHls) return;
    var level = Number(button.dataset.level);
    activeHls.currentLevel = level;
    activeHls.nextLevel = level;
    selectButton(button);
  };
  document.addEventListener("click", function (event) {
    if (!event.target.closest(".quality-control")) quality.classList.remove("open");
  });

  var fits = ["contain", "cover"];
  var fitIndex = Math.max(0, fits.indexOf(localStorage.getItem("jusou:video-fit") || "contain"));
  function applyFit() {
    video.style.objectFit = fits[fitIndex];
    fit.querySelector("b").textContent = fits[fitIndex] === "contain" ? "完整" : "填充";
    localStorage.setItem("jusou:video-fit", fits[fitIndex]);
  }
  fit.onclick = function () { fitIndex = (fitIndex + 1) % fits.length; applyFit(); stage.classList.add("frame-flash"); setTimeout(function () { stage.classList.remove("frame-flash"); }, 520); };
  applyFit();
  var enhanced = localStorage.getItem("jusou:video-enhance") === "1";
  function applyEnhance() {
    stage.classList.toggle("video-enhanced", enhanced);
    enhance.classList.toggle("active", enhanced);
    enhance.querySelector("b").textContent = enhanced ? "增强中" : "关闭";
    localStorage.setItem("jusou:video-enhance", enhanced ? "1" : "0");
  }
  enhance.onclick = function () {
    enhanced = !enhanced;
    applyEnhance();
    stage.classList.add("enhance-flash");
    setTimeout(function () { stage.classList.remove("enhance-flash"); }, 620);
  };
  applyEnhance();

  fullscreen.onclick = function () {
    if (document.fullscreenElement) document.exitFullscreen();
    else if (stage.requestFullscreen) stage.requestFullscreen();
    else if (video.webkitEnterFullscreen) video.webkitEnterFullscreen();
  };
  document.addEventListener("fullscreenchange", function () { fullscreen.querySelector("b").textContent = document.fullscreenElement ? "退出" : "全屏"; });

  video.addEventListener("loadedmetadata", function () {
    var ratio = video.videoWidth && video.videoHeight ? video.videoWidth / video.videoHeight : 16 / 9;
    stage.classList.toggle("media-portrait", ratio < 0.86);
    stage.classList.toggle("media-square", ratio >= 0.86 && ratio < 1.2);
    stage.classList.toggle("media-landscape", ratio >= 1.2);
    if (!activeHls && video.videoHeight) {
      qualityLabel.textContent = resolutionLabel(video.videoHeight, true);
      menu.innerHTML = '<header><span>DIRECT MEDIA</span><b>' + resolutionLabel(video.videoHeight, true) + '</b></header><button class="active"><i></i><span><b>系统原画</b><small>由浏览器直接解码</small></span></button>';
    }
  });
})();
