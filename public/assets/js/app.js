/* =================================
   剧搜 V9 - APP核心
================================= */

var hotMovies, newMovies, rankList, guessList, continueBox;
var searchInput;
var allMoviesHtml = "";

function showToast(t) {
  var e = document.getElementById("toast");
  if (!e) return;
  e.innerText = t; e.classList.add("show");
  clearTimeout(e._t); e._t = setTimeout(function(){e.classList.remove("show")},2000);
}
window.showToast = showToast;

function mkCard(i) {
  var c = i.cover || "";
  return "<div class=\"movie-card\" data-id=\""+i.id+"\">" +
    "<div class=\"poster-box\">" +
      "<span class=\"fallback\">🎬</span>" +
      "<img class=\"poster-img\" src=\""+c+"\" onerror=\"this.style.display='none'\">" +
      (i.vip?"<div class=\"badge\"><span class=\"vip\">VIP</span></div>":"") +
      "<button class=\"play-btn\" data-play=\""+i.id+"\">▶</button>" +
    "</div>" +
    "<div class=\"movie-info\">" +
      "<h3>"+i.name+"</h3>" +
      "<div class=\"movie-meta\">" +
        "<span>"+(i.type||"短剧")+"</span>" +
        (i.score?"<span class=\"score\">⭐"+i.score+"</span>":"") +
        "<span class=\"hot\">🔥"+(i.hot||0)+"万</span>" +
      "</div>" +
    "</div></div>";
}

function renderAll() {
  if (!dramas || !dramas.length) {
    var m = "<div style=\"grid-column:1/-1;text-align:center;padding:60px;color:var(--muted)\">暂无数据</div>";
    if (newMovies) newMovies.innerHTML = m;
    if (hotMovies) hotMovies.innerHTML = m;
    return;
  }
  allMoviesHtml = dramas.map(mkCard).join("");
  if (newMovies) newMovies.innerHTML = dramas.slice(0,10).map(mkCard).join("");
  if (hotMovies) { hotMovies.classList.remove("loading"); hotMovies.innerHTML = allMoviesHtml; }
  if (guessList) {
    var s = dramas.slice().sort(function(){return 0.5-Math.random()});
    guessList.innerHTML = s.slice(0,10).map(mkCard).join("");
  }
  if (rankList) {
    rankList.innerHTML = dramas.slice(0,20).map(function(i,idx){
      var c = i.cover || "";
      var nc = "rank-num " + (idx<3 ? ["top1","top2","top3"][idx] : "normal");
      return "<div class=\"rank-item\" data-id=\""+i.id+"\">" +
        "<div class=\""+nc+"\">"+(idx+1)+"</div>" +
        "<div class=\"rank-cover\">" +
          (c ? "<img src=\""+c+"\" onerror=\"this.style.display='none'\">" : "") +
        "</div>" +
        "<div class=\"rank-info\"><h3>"+i.name+"</h3><p>"+(i.type||"短剧")+" · 🔥"+(i.hot||0)+"万</p></div>" +
      "</div>";
    }).join("");
  }
  if (continueBox) {
    var h = getHistory();
    if (!h.length) { continueBox.innerHTML = "<div style=\"color:var(--muted);padding:10px\">暂无观看记录</div>"; }
    else {
      continueBox.innerHTML =
        "<div class=\"continue-cover\">🎬</div>" +
        "<div class=\"continue-info\"><h3>"+h[0].name+"</h3><p>继续观看</p><div class=\"progress-bar\"><span></span></div></div>" +
        "<button class=\"btn-primary\" style=\"padding:10px 24px;border-radius:20px;font-size:13px\" onclick=\"playMovie("+h[0].id+")\">继续播放</button>";
    }
  }
}

window.playMovie = function(id){
  var m = getDrama(id);
  if (m) { saveHistory(m); location.href="play.html"; }
  else { getDramaDetail(id,function(d){if(d){saveHistory(d);location.href="play.html"}else showToast("无法播放")}); }
};

// 卡片点击事件
document.addEventListener("click",function(e){
  var c = e.target.closest(".movie-card");
  if (c && c.dataset.id && !e.target.closest(".play-btn")) {
    localStorage.setItem("detailId",c.dataset.id); location.href="detail.html"; return;
  }
  var r = e.target.closest(".rank-item");
  if (r && r.dataset.id) { localStorage.setItem("detailId",r.dataset.id); location.href="detail.html"; return; }
  if (e.target.classList.contains("play-btn")) {
    e.stopPropagation();
    if (e.target.dataset.play) playMovie(e.target.dataset.play);
  }
});

// 搜索
window.doSearch = function(key){
  if (!key || !key.trim()) { clearSearch(); return; }
  showToast("搜索中...");
  searchFromApi(key.trim(), function(){
    if (!hotMovies) return;
    if (dramas.length) {
      hotMovies.innerHTML = dramas.map(mkCard).join("");
      showToast("找到 "+dramas.length+" 个结果");
    } else {
      hotMovies.innerHTML = "<div style=\"grid-column:1/-1;text-align:center;padding:60px;color:var(--muted)\"><p style=\"font-size:48px\">🔍</p><p>未找到结果</p><button class=\"btn-primary\" style=\"margin-top:16px;padding:10px 30px;border-radius:20px\" onclick=\"clearSearch()\">显示全部</button></div>";
      showToast("未找到结果");
    }
  });
};

window.clearSearch = function(){
  if (searchInput) searchInput.value = "";
  loadMore(1, function(){ renderAll(); showToast("已显示全部"); });
};

// 分类筛选
window.filterCat = function(type){
  // 同步filter-chip状态
  var chips = document.querySelectorAll(".filter-chip");
  chips.forEach(function(b){ b.classList.toggle("active", b.innerText.trim() === type || (type.indexOf(b.innerText.trim()) >= 0)); });
  var cats = document.querySelectorAll(".category-strip button");
  cats.forEach(function(b){ b.classList.remove("active"); });
  // 高亮当前
  cats.forEach(function(b){ if (b.innerText.trim() === type) b.classList.add("active"); });
  if (searchInput) searchInput.value = "";
  if (type === "全部") { loadMore(1, function(){ renderAll(); }); return; }
  showToast("搜索 "+type+"...");
  searchFromApi(type, function(){
    if (!hotMovies) return;
    hotMovies.innerHTML = dramas.length
      ? dramas.map(mkCard).join("")
      : "<div style=\"grid-column:1/-1;text-align:center;padding:40px;color:var(--muted)\">暂无此类短剧</div>";
    showToast(dramas.length ? type+" 共 "+dramas.length+" 部" : "暂无内容");
  });
};



// ===== VIP支付流程 =====
var selectedPlan = null;
var currentPayAmount = 0;

window.selectPlan = function(el) {
  document.querySelectorAll(".plan-card").forEach(function(c){c.style.borderColor="";c.style.transform=""});
  el.style.borderColor = "var(--primary)";
  el.style.transform = "translateY(-4px)";
  selectedPlan = el.dataset.plan;
  var planInfo = VIP_PLANS[selectedPlan];
  if (!planInfo) return;
  currentPayAmount = planInfo.price;
  showPaymentModal(planInfo);
};

function showPaymentModal(plan) {
  var existing = document.getElementById("payModal");
  if (existing) existing.remove();
  var qrFound = "";
  fetchPaymentQR(function(url){qrFound=url;var qe=document.getElementById('payQR');if(qe&&url){qe.innerHTML="<img src='"+url+"' style='width:100%;height:100%;object-fit:contain;padding:8px'>";qe.style.background='white';}});
  var div = document.createElement("div");
  div.className = "modal payment-modal";
  div.id = "payModal";
  div.style.display = "flex";
  div.innerHTML =
    "<div class='modal-box'>" +
      "<button class='modal-close' onclick='closePayModal()'>&times;</button>" +
      "<div style='font-size:36px;margin-bottom:4px'>📱</div>" +
      "<h2 style='margin-bottom:2px'>扫码支付</h2>" +
      "<p style='color:var(--muted);font-size:12px;margin-bottom:12px'>" + plan.name + " · " + plan.days + "天</p>" +
      "<div class='payment-qr' id='payQR'>" +
        (qrFound ? "<img src='"+qrFound+"' style='width:100%;height:100%;object-fit:contain;padding:8px'>" : "<span style='font-size:64px'>📱</span><div class='qr-overlay'></div>") +
      "</div>" +
      "<div class='payment-amount'><span class='currency'>&yen;</span>" + plan.price + "</div>" +
      "<div class='payment-methods'>" +
        "<div class='payment-method active' onclick=\"switchPayMethod(this,'wechat')\">微信支付</div>" +
        "<div class='payment-method' onclick=\"switchPayMethod(this,'alipay')\">支付宝</div>" +
      "</div>" +
      "<div class='pay-status' id='payStatus'>请使用手机扫码支付</div>" +
      "<button onclick='simulatePayment()' style='width:100%;padding:12px;border-radius:12px;background:linear-gradient(135deg,var(--primary),var(--secondary));color:#fff;font-weight:600;font-size:14px;border:0;cursor:pointer;margin-top:12px'>我已支付</button>" +
      "<div style='margin-top:8px;font-size:11px;color:var(--muted);opacity:.5'>收款码由站长设置</div>" +
    "</div>";
  document.body.appendChild(div);
  div.onclick = function(e) { if (e.target === div) closePayModal(); };
}

window.switchPayMethod = function(el, method) {
  document.querySelectorAll(".payment-method").forEach(function(m){m.classList.remove("active")});
  el.classList.add("active");
  document.getElementById("qrIcon").innerText = method === "wechat" ? "💚" : "💙";
  document.getElementById("payStatus").innerText = "请使用" + (method==="wechat"?"微信":"支付宝") + "扫码支付";
};

window.simulatePayment = function() {
  var status = document.getElementById("payStatus");
  if (!status) return;
  status.className = "pay-status";
  status.innerText = "处理中...";
  setTimeout(function() {
    if (selectedPlan && VIP_PLANS[selectedPlan]) {
      var plan = VIP_PLANS[selectedPlan];
      activateVip(selectedPlan, plan.days);
      status.className = "pay-status success";
      status.innerText = "✅ " + plan.name + "开通成功！有效期" + plan.days + "天";
      showToast("VIP开通成功！");
      var vm = document.getElementById("vipMascot");
      if(vm){vm.classList.add("vip-active");vm.querySelector(".mascot-tag").innerText=daysUntilExpiry()+"天";vm.title="VIP会员 剩余"+daysUntilExpiry()+"天"}
      setTimeout(closePayModal, 2000);
      closeVip();
    }
  }, 1500);
};

window.closePayModal = function() {
  var m = document.getElementById("payModal");
  if (m) { m.style.display = "none"; setTimeout(function(){m.remove()},300); }
};

window.closeVip = function(){var m=document.getElementById("vipModal");if(m)m.style.display="none"};
window.closeLogin = function(){var m=document.getElementById("loginPanel");if(m)m.style.display="none"};

window.openVip = function() {
  var s = checkVipExpiry();
  if (s.active) { showToast("您已是VIP会员，剩余" + daysUntilExpiry() + "天"); return; }
  var m = document.getElementById("vipModal");
  if (m) m.style.display = "flex";
};
  // 弹窗
function bindModals() {
  var vm = document.getElementById("vipModal");
  var lp = document.getElementById("loginPanel");
  var lb = document.getElementById("loginBtn");
  if (vm) vm.onclick = function(e){ if (e.target === vm) vm.style.display = "none"; };
  if (lp) lp.onclick = function(e){ if (e.target === lp) lp.style.display = "none"; };
  if (lb) lb.onclick = function(){ if (lp) lp.style.display = "flex"; };

  var bx = document.querySelector(".modal-box");
  if (bx && lp) {
    var ph = lp.querySelectorAll("input")[0];
    var bs = lp.querySelectorAll("button");
    if (bs[0]) bs[0].onclick = function(){
      var p = ph.value.trim();
      if (!/^1[3-9]\d{9}$/.test(p)) return showToast("手机号格式错误");
      showToast("验证码已发送"); var t=60; bs[0].disabled=true;
      var iv=setInterval(function(){bs[0].innerText=t+"秒";if(--t<=0){clearInterval(iv);bs[0].disabled=false;bs[0].innerText="获取验证码"}},1000);
    };
    if (bs[1]) bs[1].onclick = function(){
      if (!ph.value.trim()) return showToast("请输入手机号");
      saveUser({name:"用户"+ph.value.trim().slice(-4),avatar:"👤",vip:false});
      lp.style.display="none"; showToast("登录成功");
    };
  }
}

// DOM就绪
document.addEventListener("DOMContentLoaded", function(){
  hotMovies = document.getElementById("hotMovies");
  newMovies = document.getElementById("newMovies");
  rankList = document.getElementById("rankList");
  guessList = document.getElementById("guessList");
  continueBox = document.getElementById("continueBox");
  searchInput = document.getElementById("searchInput");

  bindModals();

  // 迷你播放器
  var mt = document.getElementById("miniTitle");
  if (mt) { var hh = JSON.parse(localStorage.getItem("history")||"[]"); if (hh.length) { mt.innerText = hh[0].name; document.getElementById("miniPlayer").classList.add("show"); } }

  // 返回顶部
  var bt = document.getElementById("backTop");
  if (bt) {
    window.addEventListener("scroll", function(){ bt.style.display = window.scrollY > 500 ? "flex" : "none"; });
    bt.onclick = function(){ window.scrollTo({top:0,behavior:"smooth"}); };
  }


  // 导航栏滚动
  window.addEventListener("scroll", function(){
    var h = document.querySelector(".header");
    if (h) h.classList.toggle("scrolled", window.scrollY > 40);
  });


  // VIP吉祥物状态
  var vm = document.getElementById("vipMascot");
  if (vm) {
    var vs = checkVipExpiry();
    if (vs.active) {
      vm.classList.add("vip-active");
      vm.querySelector(".mascot-tag").innerText = daysUntilExpiry() + "天";
      vm.title = "VIP会员 剩余" + daysUntilExpiry() + "天";
    }
  }
  // 开场动画
  setTimeout(function(){var il=document.getElementById("introLoader");if(il)il.classList.add("hide")},2200);

  // 加载数据
  loadInitialData(function(){ renderAll(); });
});
