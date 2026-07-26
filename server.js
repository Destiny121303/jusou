const express = require("express");
const fs = require("fs");
const path = require("path");
const https = require("https");
const http = require("http");

const app = express();
const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, "public");

const API_SOURCE = { host: "api.guangsuapi.com", basePath: "/api.php/provide/vod/at/json", shortTypeId: 31, dramaTypeId: 13 };

const cache = { list: {}, detail: {}, search: {}, types: null, home: {} };
const CACHE_TTL = 5 * 60 * 1000;

function cacheGet(store, key) { const entry = cache[store][key]; if (entry && Date.now() - entry.time < CACHE_TTL) return entry.data; return null; }
function cacheSet(store, key, data) { cache[store][key] = { data, time: Date.now() }; }

function fetchApi(path, query) {
  return new Promise((resolve, reject) => {
    const qs = query ? "?" + query : "";
    const options = { hostname: API_SOURCE.host, path: API_SOURCE.basePath + qs, method: "GET", timeout: 15000, headers: { "User-Agent": "Mozilla/5.0" } };
    const req = https.get(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => { try { resolve(JSON.parse(data)); } catch (e) { reject(new Error("JSON parse error: " + e.message)); } });
    });
    req.on("error", reject);
    req.on("timeout", () => { req.destroy(); reject(new Error("timeout")); });
  });
}

function transformItem(item) {
  let episodes = [];
  if (item.vod_play_url) {
    const sources = item.vod_play_url.split("$$$");
    const primary = sources.length > 1 ? sources[1] : sources[0];
    if (primary) {
      episodes = primary.split("#").map((seg) => {
        const sep = seg.indexOf("$");
        if (sep > 0) return { name: seg.slice(0, sep), url: seg.slice(sep + 1) };
        return { name: "播放", url: seg };
      });
    }
  }
  return {
    id: item.vod_id, name: item.vod_name || "未知剧集", type: item.type_name || "短剧",
    actor: item.vod_actor || "未知演员", score: parseFloat(item.vod_score) || 0,
    hot: Math.floor(Math.random() * 500) + 100, vip: false, episodes: episodes.length || 1,
    cover: item.vod_pic || "", intro: item.vod_content || item.vod_blurb || "精彩短剧，每日更新。",
    year: item.vod_year || "", area: item.vod_area || "", remarks: item.vod_remarks || "",
    playUrl: episodes.length > 0 ? episodes[0].url : "", episodeList: episodes,
    rawUrl: item.vod_play_url || "", playFrom: item.vod_play_from || "",
  };
}

// favicon
app.get("/favicon.ico", function(req,res){res.set("Content-Type","image/svg+xml");res.send("<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 32 32\"><rect width=\"32\" height=\"32\" rx=\"6\" fill=\"#ff2050\"/><text x=\"16\" y=\"22\" text-anchor=\"middle\" fill=\"white\" font-size=\"20\" font-weight=\"bold\">剧</text></svg>")});

// 首页 - 先取列表再补详情（拿封面）
app.get("/api/home", async (req, res) => {
  var cached = cacheGet("home", "main");
  if (cached) return res.json(cached);
  try {
    var data = await fetchApi("", "ac=list&t=" + API_SOURCE.shortTypeId + "&pg=1&limit=20");
    if (!data || !data.list) return res.json({code:200,total:0,list:[]});
    var items = data.list.slice(0, 12);
    var detailPromises = items.map(function(item) {
      return fetchApi("", "ac=detail&ids=" + item.vod_id)
        .then(function(d) { return d && d.list && d.list[0] ? d.list[0] : item; })
        .catch(function() { return item; });
    });
    var enriched = await Promise.all(detailPromises);
    var result = { code: 200, total: parseInt(data.total) || 0, list: enriched.map(transformItem) };
    cacheSet("home", "main", result);
    return res.json(result);
  } catch (err) {
    console.error("API home error:", err.message);
    res.status(500).json({ error: "获取首页数据失败" });
  }
});

    // 列表
app.get("/api/list", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1; const limit = parseInt(req.query.limit) || 20;
    const cacheKey = API_SOURCE.shortTypeId + "_" + page + "_" + limit;
    const cached = cacheGet("list", cacheKey);
    if (cached) return res.json(cached);

    const data = await fetchApi("", "ac=list&t=" + API_SOURCE.shortTypeId + "&pg=" + page + "&limit=" + limit);
    if (data && data.list) {
      const result = { code: 200, total: parseInt(data.total) || 0, page: parseInt(data.page) || page, pageCount: parseInt(data.pagecount) || 1, list: data.list.map(transformItem) };
      cacheSet("list", cacheKey, result);
      return res.json(result);
    }
    res.json({ code: 200, total: 0, list: [] });
  } catch (err) { console.error("API list error:", err.message); res.status(500).json({ error: "获取列表失败" }); }
});

// 搜索
app.get("/api/search", async (req, res) => {
  try {
    const keyword = (req.query.keyword || "").trim();
    if (!keyword) return res.json({ code: 200, total: 0, list: [] });
    const cached = cacheGet("search", keyword);
    if (cached) return res.json(cached);
    const data = await fetchApi("", "ac=list&wd=" + encodeURIComponent(keyword) + "&limit=30");
    if (data && data.list) {
      const result = { code: 200, total: parseInt(data.total) || 0, list: data.list.map(transformItem) };
      cacheSet("search", keyword, result);
      return res.json(result);
    }
    res.json({ code: 200, total: 0, list: [] });
  } catch (err) { console.error("API search error:", err.message); res.status(500).json({ error: "搜索失败" }); }
});

// 详情
app.get("/api/detail", async (req, res) => {
  try {
    const id = req.query.id; if (!id) return res.status(400).json({ error: "缺少id参数" });
    const cached = cacheGet("detail", id); if (cached) return res.json(cached);
    const data = await fetchApi("", "ac=detail&ids=" + id);
    if (data && data.list && data.list.length > 0) {
      const result = { code: 200, data: transformItem(data.list[0]) };
      cacheSet("detail", id, result);
      return res.json(result);
    }
    res.status(404).json({ error: "未找到" });
  } catch (err) { console.error("API detail error:", err.message); res.status(500).json({ error: "获取详情失败" }); }
});

// 分类
app.get("/api/types", async (req, res) => {
  try { if (cache.types) return res.json(cache.types); const data = await fetchApi("", "ac=class"); cache.types = data; res.json(data); }
  catch (err) { res.status(500).json({ error: "获取分类失败" }); }
});


// body-parser
app.use(express.json({limit:"10mb"}));
app.use(express.urlencoded({limit:"10mb",extended:true}));

// QR码上传/获取
app.post("/api/qr", function(req, res) {
  try {
    var data = req.body && req.body.qr;
    if (!data) return res.status(400).json({error:"缺少qr数据"});
    // 保存base64到文件
    fs.writeFileSync(path.join(__dirname, "data", "qr.txt"), data, "utf8");
    res.json({code:200,msg:"收款码已更新"});
  } catch(e) {
    res.status(500).json({error:e.message});
  }
});

app.get("/api/qr", function(req, res) {
  try {
    var qrFile = path.join(__dirname, "data", "qr.txt");
    if (fs.existsSync(qrFile)) {
      var data = fs.readFileSync(qrFile, "utf8");
      return res.json({code:200,qr:data});
    }
    res.json({code:200,qr:""});
  } catch(e) {
    res.status(500).json({error:e.message});
  }
});

app.use(express.static(PUBLIC_DIR));
app.use((req, res) => { res.status(404).sendFile(path.join(PUBLIC_DIR, "index.html")); });
app.use((err, req, res, next) => { console.error("服务器错误:", err.message); res.status(500).send("服务器内部错误"); });

app.listen(PORT, () => { console.log("剧搜运行中：http://localhost:" + PORT); });
