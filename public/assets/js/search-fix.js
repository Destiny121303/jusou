(function () {
  "use strict";
  if (!window.Jusou || !location.hostname.endsWith(".github.io")) return;
  var original = window.Jusou;
  var apiBase = "https://jusou-live.des121303.chatgpt.site/api";
  var catalogPromise = fetch("./assets/js/catalog.json?v=1", { cache: "no-store" })
    .then(function (r) { return r.ok ? r.json() : []; })
    .then(function (list) { return Array.isArray(list) ? list : []; })
    .catch(function () { return []; });
  function all() {
    return catalogPromise.then(function (list) {
      var base = Array.isArray(original.fallback) ? original.fallback : [];
      var seen = {};
      return base.concat(list).filter(function (item) {
        var id = String(item.id || item.name || "");
        if (seen[id]) return false;
        seen[id] = true;
        return true;
      });
    });
  }
  window.Jusou.search = function (keyword) {
    var q = String(keyword || "").trim().toLowerCase();
    if (!q) return all().then(function (items) { return { code: 200, total: items.length, list: items }; });
    return fetch(apiBase + "/search?keyword=" + encodeURIComponent(keyword), { cache: "no-store" })
      .then(function (r) { if (!r.ok) throw new Error("api"); return r.json(); })
      .then(function (remote) { if (remote && Array.isArray(remote.list) && remote.list.length) return remote; throw new Error("empty"); })
      .catch(function () { return all().then(function (items) {
      return {
        code: 200,
        total: q ? items.filter(function (item) {
          return [item.name, item.type, item.actor, item.year, item.area]
            .join(" ").toLowerCase().indexOf(q) > -1;
        }).length : items.length,
        list: q ? items.filter(function (item) {
          return [item.name, item.type, item.actor, item.year, item.area]
            .join(" ").toLowerCase().indexOf(q) > -1;
        }) : items
      };
      }); });
  };
  var baseDetail = original.detail;
  window.Jusou.detail = function (id) {
    return fetch(apiBase + "/detail?id=" + encodeURIComponent(id), { cache: "no-store" })
      .then(function (r) { if (!r.ok) throw new Error("api"); return r.json(); })
      .then(function (remote) { return remote && remote.data ? remote.data : baseDetail(id); })
      .catch(function () { return all().then(function (items) {
        var match = items.find(function (item) { return String(item.id) === String(id); });
        return match || baseDetail(id);
      }); });
  };
})();
