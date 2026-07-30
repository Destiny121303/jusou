(function () {
  "use strict";
  var LIMIT = 60 * 60;
  var KEY = "jusou:trial-seconds";
  function seconds() { return Math.max(0, Number(localStorage.getItem(KEY) || 0)); }
  function isMember() { return localStorage.getItem("jusou:member-status") === "active"; }
  function remaining() { return Math.max(0, LIMIT - seconds()); }
  window.JusouMember = { isActive: isMember, remaining: remaining };
  var video = document.getElementById("video");
  if (!video || isMember()) return;
  var last = 0;
  function wall() {
    var left = remaining();
    var hud = document.getElementById("hudProtocol");
    if (hud) hud.textContent = "TRIAL // " + Math.ceil(left / 60) + " MIN LEFT";
    if (left > 0) return;
    video.pause();
    var gate = document.createElement("div");
    gate.className = "member-gate";
    gate.innerHTML = '<span class="section-kicker">TRIAL COMPLETE</span><h2>60 分钟体验已结束</h2><p>开通会员即可长期畅看，并保留收藏与播放进度。</p><a class="primary-button" href="./membership.html">查看会员套餐 →</a>';
    document.querySelector(".video-stage").appendChild(gate);
  }
  video.addEventListener("playing", function () { last = Date.now(); wall(); });
  video.addEventListener("pause", function () {
    if (!last) return;
    localStorage.setItem(KEY, Math.min(LIMIT, seconds() + Math.floor((Date.now() - last) / 1000)));
    last = 0; wall();
  });
  setInterval(function () {
    if (video.paused || !last) return;
    var now = Date.now(), delta = Math.floor((now - last) / 1000);
    if (delta > 0) { localStorage.setItem(KEY, Math.min(LIMIT, seconds() + delta)); last = now; wall(); }
  }, 5000);
  wall();
})();
