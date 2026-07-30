const express = require("express");
const path = require("path");
const https = require("https");

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const PUBLIC_DIR = path.join(__dirname, "public");
const API = { hostname: "api.guangsuapi.com", path: "/api.php/provide/vod/at/json", typeId: 31 };
const stores = { home: new Map(), list: new Map(), search: new Map(), detail: new Map() };
const TTL = 5 * 60 * 1000;

app.disable("x-powered-by");
app.use(express.json({ limit: "1mb" }));

function cached(store, key) {
  const item = stores[store].get(key);
  if (!item || Date.now() - item.time > TTL) return null;
  return item.data;
}

function remember(store, key, data) {
  stores[store].set(key, { time: Date.now(), data });
  return data;
}

function fetchSource(query) {
  return new Promise((resolve, reject) => {
    const req = https.get({
      hostname: API.hostname,
      path: `${API.path}?${query}`,
      timeout: 12000,
      headers: { "User-Agent": "Jusou/2.0", Accept: "application/json" }
    }, (response) => {
      let body = "";
      response.setEncoding("utf8");
      response.on("data", (chunk) => { body += chunk; });
      response.on("end", () => {
        if (response.statusCode < 200 || response.statusCode >= 300) {
          return reject(new Error(`上游服务返回 ${response.statusCode}`));
        }
        try { resolve(JSON.parse(body)); } catch { reject(new Error("上游数据格式异常")); }
      });
    });
    req.on("timeout", () => req.destroy(new Error("上游服务超时")));
    req.on("error", reject);
  });
}

function normalize(item = {}) {
  const sources = String(item.vod_play_url || "").split("$$$").filter(Boolean);
  const selected = sources.find((source) => source.includes(".m3u8")) || sources[0] || "";
  const episodeList = selected.split("#").filter(Boolean).map((segment, index) => {
    const splitAt = segment.indexOf("$");
    return splitAt > -1
      ? { name: segment.slice(0, splitAt) || `第${index + 1}集`, url: segment.slice(splitAt + 1) }
      : { name: `第${index + 1}集`, url: segment };
  }).filter((episode) => /^https?:\/\//i.test(episode.url));

  return {
    id: String(item.vod_id || ""),
    name: item.vod_name || "未命名短剧",
    type: item.type_name || "短剧",
    actor: item.vod_actor || "演员信息待更新",
    director: item.vod_director || "",
    score: Number.parseFloat(item.vod_score) || 0,
    hot: Number(item.vod_hits || item.vod_hits_day) || 0,
    cover: item.vod_pic || "",
    intro: String(item.vod_content || item.vod_blurb || "暂无剧情简介。").replace(/<[^>]*>/g, "").trim(),
    year: item.vod_year || "近期",
    area: item.vod_area || "中国大陆",
    remarks: item.vod_remarks || (episodeList.length ? `全${episodeList.length}集` : "热播中"),
    episodeList,
    playUrl: episodeList[0]?.url || ""
  };
}

async function getList(page, limit) {
  const key = `${page}:${limit}`;
  const hit = cached("list", key);
  if (hit) return hit;
  const data = await fetchSource(`ac=list&t=${API.typeId}&pg=${page}&limit=${limit}`);
  const base = Array.isArray(data.list) ? data.list : [];
  const result = {
    code: 200,
    total: Number(data.total) || base.length,
    page: Number(data.page) || page,
    pageCount: Number(data.pagecount) || 1,
    list: base.map(normalize)
  };
  return remember("list", key, result);
}

app.get("/api/health", (_req, res) => res.json({ ok: true, service: "剧搜" }));

app.get("/api/home", async (_req, res, next) => {
  try {
    const hit = cached("home", "main");
    if (hit) return res.json(hit);
    const list = await getList(1, 18);
    const detailed = await Promise.all(list.list.slice(0, 12).map(async (item) => {
      try {
        const data = await fetchSource(`ac=detail&ids=${encodeURIComponent(item.id)}`);
        return data.list?.[0] ? normalize(data.list[0]) : item;
      } catch { return item; }
    }));
    res.json(remember("home", "main", { ...list, list: detailed }));
  } catch (error) { next(error); }
});

app.get("/api/list", async (req, res, next) => {
  try {
    const page = Math.max(1, Math.min(999, Number.parseInt(req.query.page, 10) || 1));
    const limit = Math.max(1, Math.min(30, Number.parseInt(req.query.limit, 10) || 18));
    res.json(await getList(page, limit));
  } catch (error) { next(error); }
});

app.get("/api/search", async (req, res, next) => {
  try {
    const keyword = String(req.query.keyword || "").trim().slice(0, 50);
    if (!keyword) return res.status(400).json({ error: "请输入搜索关键词" });
    const hit = cached("search", keyword);
    if (hit) return res.json(hit);
    const data = await fetchSource(`ac=list&wd=${encodeURIComponent(keyword)}&limit=30`);
    const result = { code: 200, total: Number(data.total) || 0, list: (data.list || []).map(normalize) };
    res.json(remember("search", keyword, result));
  } catch (error) { next(error); }
});

app.get("/api/detail", async (req, res, next) => {
  try {
    const id = String(req.query.id || "").trim();
    if (!/^\d+$/.test(id)) return res.status(400).json({ error: "无效的剧集编号" });
    const hit = cached("detail", id);
    if (hit) return res.json(hit);
    const data = await fetchSource(`ac=detail&ids=${encodeURIComponent(id)}`);
    if (!data.list?.[0]) return res.status(404).json({ error: "未找到该短剧" });
    res.json(remember("detail", id, { code: 200, data: normalize(data.list[0]) }));
  } catch (error) { next(error); }
});

app.use(express.static(PUBLIC_DIR, { maxAge: "1h", extensions: ["html"] }));
app.get("/", (_req, res) => res.sendFile(path.join(PUBLIC_DIR, "index.html")));
app.use("/api", (_req, res) => res.status(404).json({ error: "接口不存在" }));
app.use((_req, res) => res.status(404).sendFile(path.join(PUBLIC_DIR, "index.html")));
app.use((error, _req, res, _next) => {
  console.error(error.message);
  res.status(502).json({ error: "内容服务暂时不可用，请稍后重试" });
});

app.listen(PORT, () => console.log(`剧搜已启动：http://localhost:${PORT}`));
