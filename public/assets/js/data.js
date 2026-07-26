/* =================================
   剧搜 V8 - 数据中心 v2
================================= */

var dramas = [];
var totalDramas = 0;
var currentPage = 1;
var isLoading = false;

// 带超时的fetch
function fetchWithTimeout(url, ms) {
  return new Promise(function(resolve, reject) {
    var controller = new AbortController();
    var timeout = setTimeout(function() { controller.abort(); reject(new Error("timeout")); }, ms || 15000);
    fetch(url, { signal: controller.signal }).then(function(r) {
      clearTimeout(timeout);
      resolve(r);
    }).catch(function(e) {
      clearTimeout(timeout);
      reject(e);
    });
  });
}

// 加载首页数据
function loadInitialData(callback) {
  if (isLoading) return;
  isLoading = true;
  fetchWithTimeout("/api/home?v=" + Date.now(), 20000)
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (data && data.list && data.list.length > 0) {
        dramas = data.list;
        totalDramas = data.total || 0;
      }
    })
    .catch(function(err) {
      console.error("数据加载失败:", err);
    })
    .then(function() {
      isLoading = false;
      if (callback) callback();
    });
}

// 按页加载
function loadMore(page, callback) {
  if (isLoading) return;
  isLoading = true;
  fetchWithTimeout("/api/list?page=" + (page || 1) + "&limit=20&v=" + Date.now(), 20000)
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (data && data.list) {
        dramas = page === 1 ? data.list : dramas.concat(data.list);
        currentPage = data.page || 1;
        totalDramas = data.total || 0;
      }
    })
    .catch(function(err) {
      console.error("加载失败:", err);
    })
    .then(function() {
      isLoading = false;
      if (callback) callback();
    });
}

// 从API搜索
function searchFromApi(keyword, callback) {
  if (!keyword) { loadMore(1, callback); return; }
  isLoading = true;
  fetchWithTimeout("/api/search?keyword=" + encodeURIComponent(keyword) + "&v=" + Date.now(), 20000)
    .then(function(r) { return r.json(); })
    .then(function(data) {
      dramas = data && data.list ? data.list : [];
    })
    .catch(function(err) {
      console.error("搜索失败:", err);
      dramas = [];
    })
    .then(function() {
      isLoading = false;
      if (callback) callback();
    });
}

// 客户端过滤
function searchDrama(keyword) {
  if (!keyword) return dramas;
  return dramas.filter(function(item) {
    return (item.name && item.name.indexOf(keyword) >= 0) ||
           (item.type && item.type.indexOf(keyword) >= 0) ||
           (item.actor && item.actor.indexOf(keyword) >= 0);
  });
}

// 获取单部剧集
function getDrama(id) {
  return dramas.find(function(item) { return item.id == id; });
}

// 异步获取详情
function getDramaDetail(id, callback) {
  fetchWithTimeout("/api/detail?id=" + id + "&v=" + Date.now(), 15000)
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (data && data.data) {
        var idx = dramas.findIndex(function(item) { return item.id == id; });
        if (idx >= 0) dramas[idx] = data.data;
        else dramas.push(data.data);
        if (callback) callback(data.data);
      } else {
        if (callback) callback(null);
      }
    })
    .catch(function() {
      if (callback) callback(null);
    });
}





// ===== 北京时间对齐 =====
function getBeijingNow() {
  var now = new Date();
  // 本地时间偏移(分钟) + 本地到北京时差(480分钟=UTC+8)
  var beijing = new Date(now.getTime() + (now.getTimezoneOffset() + 480) * 60000);
  return beijing;
}

function formatTimeUnit(n) {
  return String(n).padStart(2, "0");
}

// 获取VIP倒计时（返回天/时/分/秒/毫秒对象）
function getVipCountdown() {
  var s = getVipStatus();
  if (!s.active || !s.expireAt) return null;
  var now = getBeijingNow().getTime();
  var diff = s.expireAt - now;
  if (diff <= 0) {
    checkVipExpiry();
    return null;
  }
  var days = Math.floor(diff / 86400000);
  var hours = Math.floor((diff % 86400000) / 3600000);
  var mins = Math.floor((diff % 3600000) / 60000);
  var secs = Math.floor((diff % 60000) / 1000);
  var ms = diff % 1000;
  return { days: Math.max(0,days), hours: Math.max(0,hours), mins: Math.max(0,mins), secs: Math.max(0,secs), ms: Math.max(0,ms), total: diff };
}

// 获取VIP显示文本
function getVipDisplayText() {
  var cd = getVipCountdown();
  if (!cd) return "已过期";
  if (cd.days > 0) return cd.days + "天 " + formatTimeUnit(cd.hours) + ":" + formatTimeUnit(cd.mins) + ":" + formatTimeUnit(cd.secs);
  return formatTimeUnit(cd.hours) + ":" + formatTimeUnit(cd.mins) + ":" + formatTimeUnit(cd.secs) + "." + String(cd.ms).padStart(3,"0");
}

// ===== 二维码管理 =====
function getPaymentQR() {
  return ""; // 从服务器获取
}

function fetchPaymentQR(callback) {
  fetch("/api/qr").then(function(r){return r.json()}).then(function(d){if(d&&d.qr&&callback)callback(d.qr)}).catch(function(){if(callback)callback("")});
}

function setPaymentQR(url) {
  // 已废弃，改为服务器存储
}

function getPaymentAmount() {
  return parseInt(localStorage.getItem("paymentAmount")) || 0;
}

function setPaymentAmount(amount) {
  localStorage.setItem("paymentAmount", String(amount));
}

// ===== VIP会员系统 =====
var VIP_PLANS = {
  month: { name:"月卡", price:19, days:30, perDay:0.63 },
  quarter: { name:"季卡", price:49, days:90, perDay:0.54 },
  year: { name:"年卡", price:199, days:365, perDay:0.55 }
};

function getVipStatus() {
  return JSON.parse(localStorage.getItem("vipStatus") || "null") || { active: false, plan: null, expireAt: null, activatedAt: null };
}

function activateVip(plan, duration) {
  var now = Date.now();
  var expire = now + duration * 24 * 60 * 60 * 1000;
  var status = { active: true, plan: plan, expireAt: expire, activatedAt: now };
  localStorage.setItem("vipStatus", JSON.stringify(status));
  // 同步更新user
  var user = getUser();
  user.vip = true;
  saveUser(user);
  return status;
}

function checkVipExpiry() {
  var status = getVipStatus();
  if (status.active && status.expireAt && Date.now() > status.expireAt) {
    status.active = false;
    localStorage.setItem("vipStatus", JSON.stringify(status));
    var user = getUser();
    user.vip = false;
    saveUser(user);
  }
  return status;
}

function daysUntilExpiry() {
  var s = getVipStatus();
  if (!s.active || !s.expireAt) return 0;
  return Math.max(0, Math.floor((s.expireAt - Date.now()) / (24*60*60*1000)));
}

// 本地存储
function saveHistory(movie) {
  var list = JSON.parse(localStorage.getItem("history") || "[]");
  list = list.filter(function(item) { return item.id !== movie.id; });
  list.unshift({ id: movie.id, name: movie.name, cover: movie.cover });
  if (list.length > 50) list = list.slice(0, 50);
  localStorage.setItem("history", JSON.stringify(list));
}

function getHistory() {
  return JSON.parse(localStorage.getItem("history") || "[]");
}

function addFavorite(movie) {
  var list = JSON.parse(localStorage.getItem("favorite") || "[]");
  if (!list.find(function(item) { return item.id === movie.id; })) {
    list.push({ id: movie.id, name: movie.name, cover: movie.cover });
    localStorage.setItem("favorite", JSON.stringify(list));
  }
}

function getFavorite() {
  return JSON.parse(localStorage.getItem("favorite") || "[]");
}

function getUser() {
  var u = JSON.parse(localStorage.getItem("user") || "null");
  return u || { name: "游客", vip: false, avatar: "\uD83D\uDC64" };
}

function saveUser(user) {
  localStorage.setItem("user", JSON.stringify(user));
}
