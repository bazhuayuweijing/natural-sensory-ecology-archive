/**
 * 自然感官生态档案库 — Express 后端 API
 * ============================================
 * 职责：
 *   1. 运行 Python 爬虫脚本获取最新观察数据
 *   2. 提供刷新 API 让前端实时获取
 *   3. 暴露爬虫数据文件的 JSON 端点
 *
 * 启动:  node server/index.js
 * 端口:  4000
 */

const express = require("express");
const cors = require("cors");
const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");
const os = require("os");
const crypto = require("crypto");
const cron = require("node-cron");
const rateLimit = require("express-rate-limit");
const db = require("./db.cjs");

const app = express();
const PORT = process.env.PORT || 4000;

// JWT 密钥（生产环境应从环境变量读取）
const JWT_SECRET = process.env.JWT_SECRET || "nsea-dev-secret-change-in-production";
const JWT_EXPIRES_IN = 7 * 24 * 60 * 60; // 7 天

// CORS 白名单
const CORS_ORIGIN = (process.env.CORS_ORIGIN || "http://localhost:5173,http://localhost:4000").split(",");
app.use(cors({ origin: CORS_ORIGIN, credentials: true }));

// ---- JWT 工具（HS256，用内置 crypto）----
function base64url(str) {
  return Buffer.from(str)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function signJwt(payload) {
  const header = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = base64url(
    JSON.stringify({ ...payload, iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + JWT_EXPIRES_IN })
  );
  const sig = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(`${header}.${body}`)
    .digest("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
  return `${header}.${body}.${sig}`;
}

function verifyJwt(token) {
  try {
    const [header, body, sig] = token.split(".");
    const expected = crypto
      .createHmac("sha256", JWT_SECRET)
      .update(`${header}.${body}`)
      .digest("base64")
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");
    if (sig !== expected) return null;
    const payload = JSON.parse(Buffer.from(body, "base64").toString());
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

// 认证中间件：校验 Authorization: Bearer <token>
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return res.status(401).json({ error: "未登录，请先登录" });
  const payload = verifyJwt(token);
  if (!payload) return res.status(401).json({ error: "登录已过期，请重新登录" });
  req.user = payload;
  next();
}

const ROOT = path.resolve(__dirname, "..");
const CRAWLER_DIR = path.join(ROOT, "crawler");
const OUTPUT_DIR = path.join(CRAWLER_DIR, "output");
const ML_DIR = path.join(ROOT, "ml");
const ML_OUTPUT_DIR = path.join(ML_DIR, "output");
const CRAWLER_SCRIPT = path.join(CRAWLER_DIR, "nsea_crawler.py");
const ML_PYTHON = "/usr/local/bin/python3";

app.use(express.json());

// API 限流：全局每分钟 60 次
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: "请求过于频繁，请稍后再试" },
});
app.use("/api/", apiLimiter);

// 严格限流：ML 运行 / 报告生成
const strictLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { success: false, error: "该接口限流中，请稍后再试" },
});

// 爬取状态缓存（避免重复爬取）
let lastCrawlTime = null;
let isCrawling = false;
let crawlLogs = [];

// ML 运行锁
let mlRunning = false;
let mlQueue = [];

function log(msg) {
  const line = `[${new Date().toLocaleTimeString()}] ${msg}`;
  console.log(line);
  crawlLogs.push(line);
  if (crawlLogs.length > 100) crawlLogs.shift();
}

function pythonCmd() {
  // macOS: python3 通常在 /usr/bin/python3
  // 尝试绝对路径 + 命令名（避免 PATH 问题）
  const candidates = [
    "/usr/bin/python3",
    "/usr/local/bin/python3",
    "/opt/homebrew/bin/python3",
    "python3",
    "python",
  ];
  for (const cmd of candidates) {
    try {
      fs.accessSync(cmd);  // 检查文件是否存在
      return cmd;
    } catch {}
  }
  // 退而求其次：用绝对路径调用 python3
  return "/usr/bin/python3";
}

/**
 * 运行爬虫脚本并等待完成
 * @returns {{observations: CrawledObservation[], stats: Object, source: string, crawledAt: string}}
 */
function runCrawler() {
  return new Promise((resolve, reject) => {
    const py = pythonCmd();
    if (!py) {
      reject(new Error("未找到 Python 环境"));
      return;
    }
    log(`开始运行爬虫: ${py} ${CRAWLER_SCRIPT}`);
    const start = Date.now();
    exec(
      `${py} "${CRAWLER_SCRIPT}"`,
      {
        cwd: CRAWLER_DIR,
        timeout: 300000,  // 5 分钟超时
        maxBuffer: 10 * 1024 * 1024,
      },
      (err, stdout, stderr) => {
        const duration = ((Date.now() - start) / 1000).toFixed(1);
        if (err) {
          log(`爬虫执行失败: ${err.message}`);
          reject(err);
          return;
        }
        log(`爬虫完成 (耗时 ${duration}s)`);
        // 解析输出
        const obsPath = path.join(OUTPUT_DIR, "species_observations.json");
        const infoPath = path.join(OUTPUT_DIR, "species_info.csv");
        try {
          const observations = JSON.parse(fs.readFileSync(obsPath, "utf-8"));
          const infos = parseCSV(infoPath);
          resolve({
            observations,
            infos,
            crawledAt: new Date().toISOString(),
            durationSeconds: parseFloat(duration),
          });
        } catch (e) {
          reject(e);
        }
      }
    );
  });
}

function parseCSV(filepath) {
  if (!fs.existsSync(filepath)) return [];
  const content = fs.readFileSync(filepath, "utf-8");
  const lines = content.trim().split("\n");
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const cols = line.split(",").map((c) => c.trim());
    const obj = {};
    headers.forEach((h, i) => (obj[h] = cols[i] || ""));
    return obj;
  });
}

/**
 * 从本地 TS 数据文件加载（前端开发时直接读取）
 */
function loadBuiltinData() {
  try {
    const obsPath = path.join(ROOT, "..", "src", "data", "crawlerObservations.ts");
    const content = fs.readFileSync(obsPath, "utf-8");
    const jsonStr = content.substring(
      content.indexOf("["),
      content.lastIndexOf("]") + 1
    );
    return JSON.parse(jsonStr);
  } catch (e) {
    return [];
  }
}

// ==========================================
// API 路由
// ==========================================

// 健康检查
app.get("/api/health", (req, res) => {
  const dbHealth = db.healthCheck();
  const lastCrawl = db.getLastRunLog("crawler");
  const lastML = db.getLastRunLog("ml");
  const mlOutputTime = fs.existsSync(ML_OUTPUT_DIR)
    ? fs.statSync(ML_OUTPUT_DIR).mtime.toISOString()
    : null;
  res.json({
    status: "ok",
    uptime: process.uptime(),
    node: process.version,
    db: dbHealth,
    lastCrawlTime,
    lastCrawlRun: lastCrawl ? { status: lastCrawl.status, at: lastCrawl.finished_at || lastCrawl.started_at, count: lastCrawl.record_count } : null,
    lastMLRun: lastML ? { status: lastML.status, at: lastML.finished_at || lastML.started_at } : null,
    mlOutputTime,
    isCrawling,
    isMLRunning: !!mlRunning,
  });
});

// 登录：返回 JWT
app.post("/api/login", (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ success: false, message: "请输入用户名和密码" });
  }
  const user = db.findUser(username, password);
  if (!user) {
    return res.status(401).json({ success: false, message: "用户名或密码错误" });
  }
  const token = signJwt({ id: user.id, username: user.username, role: user.role });
  res.json({
    success: true,
    token,
    user: { id: user.id, username: user.username, role: user.role },
    expiresIn: JWT_EXPIRES_IN,
  });
});

// 校验 token（前端启动时调用）
app.get("/api/auth/verify", authMiddleware, (req, res) => {
  res.json({ success: true, user: req.user });
});

// 注册
app.post("/api/register", (req, res) => {
  const { username, password, email, role } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ success: false, message: "用户名和密码必填" });
  }
  if (db.findUserByUsername(username)) {
    return res.status(409).json({ success: false, message: "用户名已被注册" });
  }
  const newUser = db.createUser(username, password, email, role);
  const token = signJwt({ id: newUser.id, username: newUser.username, role: newUser.role });
  res.json({
    success: true,
    token,
    user: { id: newUser.id, username: newUser.username, role: newUser.role },
    expiresIn: JWT_EXPIRES_IN,
  });
});

// 刷新爬虫数据（异步，立即返回 202，状态查 /api/crawl/status）
app.post("/api/refresh", strictLimiter, (req, res) => {
  if (isCrawling) {
    return res.status(409).json({
      success: false,
      message: "爬虫正在运行中，请稍后再试",
    });
  }
  isCrawling = true;
  crawlLogs = [];
  const runLogId = db.startRunLog("crawler");
  res.json({ success: true, message: "爬虫已启动，请通过 /api/crawl/status 查询状态", runLogId });

  // 后台执行
  runCrawler()
    .then((result) => {
      const count = db.upsertObservations(result.observations);
      lastCrawlTime = new Date().toISOString();
      db.finishRunLog(runLogId, "success", count);
      log(`爬虫完成，入库 ${count} 条`);
    })
    .catch((err) => {
      db.finishRunLog(runLogId, "failed", null, err.message);
      log(`爬虫失败: ${err.message}`);
    })
    .finally(() => {
      isCrawling = false;
    });
});

// 获取最新数据（优先从 DB 读，降级到文件）
app.get("/api/data/latest", (req, res) => {
  const obsFromDB = db.getObservations(5000);
  const stats = db.getObsStats();
  const lastRun = db.getLastRunLog("crawler");

  // 文件作为补充源
  const obsPath = path.join(OUTPUT_DIR, "species_observations.json");
  let observations = obsFromDB;
  if (observations.length === 0 && fs.existsSync(obsPath)) {
    observations = JSON.parse(fs.readFileSync(obsPath, "utf-8"));
  }

  const infoPath = path.join(OUTPUT_DIR, "species_info.csv");
  let infos = [];
  if (fs.existsSync(infoPath)) infos = parseCSV(infoPath);

  res.json({
    observations,
    infos,
    stats,
    lastCrawlTime,
    lastRunAt: lastRun?.finished_at || lastRun?.started_at || null,
    lastRunStatus: lastRun?.status || null,
    logs: crawlLogs.slice(-10),
  });
});

// 获取爬虫状态
app.get("/api/crawl/status", (req, res) => {
  res.json({
    isCrawling,
    lastCrawlTime,
    logs: crawlLogs.slice(-20),
  });
});

// ==========================================
// ML 分析 API（需登录）
// ==========================================
app.use("/api/ml", authMiddleware);

function runMLPipeline(cmd, callback) {
  const scriptPath = path.join(ML_DIR, "pipeline.py");
  exec(
    `${ML_PYTHON} "${scriptPath}" ${cmd || ""}`,
    { cwd: ML_DIR, timeout: 120000, maxBuffer: 10 * 1024 * 1024 },
    (err, stdout, stderr) => {
      callback(err, stdout, stderr);
    }
  );
}

function readMLResult(filename) {
  const fp = path.join(ML_OUTPUT_DIR, filename);
  if (fs.existsSync(fp)) {
    return JSON.parse(fs.readFileSync(fp, "utf-8"));
  }
  return null;
}

// 运行 ML 管道（加锁 + run_log + 结果入库）
app.post("/api/ml/run", strictLimiter, (req, res) => {
  if (mlRunning) {
    return res.status(409).json({ success: false, error: "ML 管道正在运行，请稍后再试" });
  }
  const cmd = (req.body && req.body.module) || "";
  mlRunning = true;
  const runLogId = db.startRunLog("ml", { module: cmd || "all" });
  res.json({ success: true, message: "ML 管道已启动", runLogId });

  runMLPipeline(cmd, (err, stdout, stderr) => {
    if (err) {
      db.finishRunLog(runLogId, "failed", null, err.message);
    } else {
      // 把输出文件保存到 DB
      const files = ["sdm_results.json", "forecast_results.json", "hotspot_results.json", "climate_correlation.json", "interpretability.json", "ehi_results.json"];
      for (const f of files) {
        const data = readMLResult(f);
        if (data) {
          const module = f.replace("_results.json", "").replace(".json", "");
          if (typeof data === "object" && !Array.isArray(data)) {
            for (const [species, val] of Object.entries(data)) {
              db.saveMLResult(module, species, val, runLogId);
            }
          }
        }
      }
      db.finishRunLog(runLogId, "success");
    }
    mlRunning = false;
  });
});

// SDM 物种分布模型结果（DB 优先，文件降级）
app.get("/api/ml/sdm", (req, res) => {
  const fromDB = db.getLatestMLResult("sdm");
  const data = (fromDB && Object.keys(fromDB).length > 0) ? fromDB : readMLResult("sdm_results.json");
  if (!data || (typeof data === "object" && Object.keys(data).length === 0))
    return res.status(404).json({ error: "SDM 结果未生成，请先 POST /api/ml/run" });
  res.json(data);
});

// 时序预测结果
app.get("/api/ml/forecast", (req, res) => {
  const fromDB = db.getLatestMLResult("forecast");
  const data = (fromDB && Object.keys(fromDB).length > 0) ? fromDB : readMLResult("forecast_results.json");
  if (!data || (typeof data === "object" && Object.keys(data).length === 0))
    return res.status(404).json({ error: "预测结果未生成" });
  res.json(data);
});

// 热点检测结果
app.get("/api/ml/hotspot", (req, res) => {
  const fromDB = db.getLatestMLResult("hotspot");
  const data = (fromDB && Object.keys(fromDB).length > 0) ? fromDB : readMLResult("hotspot_results.json");
  if (!data || (typeof data === "object" && Object.keys(data).length === 0))
    return res.status(404).json({ error: "热点结果未生成" });
  res.json(data);
});

// 环境因子关联结果
app.get("/api/ml/climate", (req, res) => {
  const fromDB = db.getLatestMLResult("climate");
  const data = (fromDB && Object.keys(fromDB).length > 0) ? fromDB : readMLResult("climate_correlation.json");
  if (!data || (typeof data === "object" && Object.keys(data).length === 0))
    return res.status(404).json({ error: "关联结果未生成" });
  res.json(data);
});

// 汇总: 一键获取所有 ML 结果（DB 优先，文件降级）
app.get("/api/ml/summary", (req, res) => {
  const pick = (mod, file) => {
    const fromDB = db.getLatestMLResult(mod);
    return fromDB && Object.keys(fromDB).length > 0 ? fromDB : readMLResult(file);
  };
  res.json({
    sdm: pick("sdm", "sdm_results.json"),
    forecast: pick("forecast", "forecast_results.json"),
    hotspot: pick("hotspot", "hotspot_results.json"),
    climate: pick("climate", "climate_correlation.json"),
    interpret: pick("interpret", "interpretability.json"),
    ehi: pick("ehi", "ehi_results.json"),
  });
});

// 可解释性结果
app.get("/api/ml/interpret", (req, res) => {
  const fromDB = db.getLatestMLResult("interpret");
  const data = (fromDB && Object.keys(fromDB).length > 0) ? fromDB : readMLResult("interpretability.json");
  if (!data || (typeof data === "object" && Object.keys(data).length === 0))
    return res.status(404).json({ error: "可解释性结果未生成" });
  res.json(data);
});

// 生态健康指数
app.get("/api/ml/ehi", (req, res) => {
  const fromDB = db.getLatestMLResult("ehi");
  const data = (fromDB && Object.keys(fromDB).length > 0) ? fromDB : readMLResult("ehi_results.json");
  if (!data || (typeof data === "object" && Object.keys(data).length === 0))
    return res.status(404).json({ error: "EHI 结果未生成" });
  res.json(data);
});

// ==========================================
// LLM 自动分析报告 (讯飞星火 Spark-X)
// ==========================================
const LLM_CONFIG = {
  apiKey: process.env.SPARK_API_KEY || "",
  model: process.env.SPARK_MODEL || "spark-x2.5-1.7b",
  baseUrl: process.env.SPARK_BASE_URL || "https://maas-api.cn-huabei-1.xf-yun.com/v2",
};

// 组装 Prompt
function buildReportPrompt(species, mlSummary) {
  return `你是一个生态学数据分析专家，请根据以下机器学习分析结果，写一份面向公众和决策者的物种分析简报。要求：1）开头用一句话总结这个物种的现状；2）分"分布与栖息地"、"趋势变化"、"保护建议"三个板块；3）语言通俗易懂，不用术语堆砌；4）最后给一个综合评级（A/B/C/D，A=生态状况良好，D=急需关注）。

物种: ${species}

=== 物种分布模型 ===
${JSON.stringify(mlSummary.sdm?.[species] || {}, null, 2).slice(0, 800)}

=== 时序趋势 ===
${JSON.stringify(mlSummary.forecast?.[species] || {}, null, 2).slice(0, 600)}

=== 热点检测 ===
${JSON.stringify(mlSummary.hotspot?.[species] || {}, null, 2).slice(0, 600)}

=== 环境因子 ===
${JSON.stringify(mlSummary.climate?.[species] || {}, null, 2).slice(0, 500)}

请输出 Markdown 格式的分析简报。`;
}

// 无 API Key 时的降级报告：基于 ML 数据生成模板化分析（不调用 LLM）
function buildFallbackReport(species, summary) {
  const sdm = summary.sdm?.[species] || {};
  const fc = summary.forecast?.[species] || {};
  const ehi = readMLResult("ehi_results.json")?.[species] || {};
  const lines = [];
  lines.push(`# ${species} 生态分析简报（模板版）`);
  lines.push(`> ⚠️ 未配置大模型 API Key，以下为基于机器学习结果的自动模板分析。配置 SPARK_API_KEY 可获得更深入的 AI 解读。`);
  lines.push("");
  lines.push(`## 现状概要`);
  lines.push(`${species} 的生态健康指数（EHI）为 **${ehi.ehi_score ?? "—"}**（等级 ${ehi.grade ?? "—"}），${ehi.status ?? "数据不足"}。`);
  lines.push("");
  lines.push(`## 分布与栖息地`);
  if (sdm.auc) lines.push(`- 物种分布模型 AUC = ${sdm.auc.toFixed(3)}，预测准确度 ${(sdm.accuracy * 100).toFixed(1)}%`);
  if (sdm.top_features?.length) lines.push(`- 关键环境因子：${sdm.top_features.slice(0, 3).map((f) => f.name).join("、")}`);
  lines.push("");
  lines.push(`## 趋势变化`);
  if (fc.trend) lines.push(`- 种群趋势：${fc.trend}（${fc.change ?? ""}）`);
  if (Array.isArray(fc.anomalies)) lines.push(`- 检测到 ${fc.anomalies.length} 个异常观测点`);
  lines.push("");
  lines.push(`## 保护建议`);
  if (ehi.recommendation) lines.push(...ehi.recommendation.map((r) => `- ${r}`));
  lines.push("");
  lines.push(`---`);
  lines.push(`*生成时间：${new Date().toLocaleString("zh-CN")} | 数据来源：iNaturalist + 珲春东北虎监测*`);
  return lines.join("\n");
}

app.post("/api/ml/report", strictLimiter, async (req, res) => {
  const { species } = req.body || {};
  if (!species) return res.status(400).json({ error: "需要提供物种名" });

  const summary = {
    sdm: readMLResult("sdm_results.json"),
    forecast: readMLResult("forecast_results.json"),
    hotspot: readMLResult("hotspot_results.json"),
    climate: readMLResult("climate_correlation.json"),
  };

  if (!summary.sdm?.[species]) {
    return res.status(404).json({ error: `${species} 的 ML 分析结果不存在` });
  }

  // 无 Key 时优雅降级：返回模板报告，不报错
  if (!LLM_CONFIG.apiKey) {
    return res.json({
      success: true,
      species,
      report: buildFallbackReport(species, summary),
      generatedAt: new Date().toISOString(),
      fallback: true,
      hint: "当前为模板分析。配置 SPARK_API_KEY 环境变量可启用 AI 深度解读。",
    });
  }

  // 带超时 + 重试的 LLM 调用
  const TIMEOUT = 30000; // 30s
  const MAX_RETRIES = 1;

  async function callLLM() {
    const body = {
      model: LLM_CONFIG.model,
      stream: false,
      temperature: 0.7,
      messages: [
        { role: "system", content: "你是一个专业的生态学数据分析师，擅长将机器学习分析结果转化为通俗易懂的自然保护建议。" },
        { role: "user", content: buildReportPrompt(species, summary) },
      ],
    };
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT);
    try {
      const response = await fetch(`${LLM_CONFIG.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${LLM_CONFIG.apiKey}`,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (!response.ok) {
        const errTxt = await response.text();
        throw new Error(`HTTP ${response.status}: ${errTxt.slice(0, 200)}`);
      }
      const data = await response.json();
      return data.choices?.[0]?.message?.content || "";
    } finally {
      clearTimeout(timer);
    }
  }

  let lastErr = null;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const content = await callLLM();
      return res.json({
        success: true,
        species,
        report: content,
        generatedAt: new Date().toISOString(),
        attempt: attempt + 1,
      });
    } catch (err) {
      lastErr = err;
      // 超时或网络错误才重试，其他错误直接返回
      if (err.name === "AbortError" || err.message.includes("fetch failed")) {
        if (attempt < MAX_RETRIES) continue;
      }
      break;
    }
  }

  // 重试失败后降级到模板报告
  res.json({
    success: true,
    species,
    report: buildFallbackReport(species, summary),
    generatedAt: new Date().toISOString(),
    fallback: true,
    hint: `大模型调用失败（${lastErr?.message || "未知错误"}），已降级为模板分析。`,
  });
});

// LLM 健康检查
app.get("/api/ml/llm-status", (req, res) => {
  res.json({
    configured: !!LLM_CONFIG.apiKey,
    model: LLM_CONFIG.model,
    hint: !LLM_CONFIG.apiKey ? "设置 SPARK_API_KEY 环境变量启用 LLM 报告生成" : "API Key 已配置（需在讯飞开放平台激活）",
  });
});

// ==========================================
// 前端开发时的 API 代理
// 用 server 直接提供静态文件，把 Vite 跑在别的端口
// ==========================================

// 后端只负责 API，前端用 Vite dev server (npm run dev)
// 生产环境（NODE_ENV=production）自动托管 dist/ 静态文件
if (process.env.NODE_ENV === "production") {
  const distPath = path.join(ROOT, "..", "dist");
  if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.get(/^\/(?!api).*/, (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log(`   📦 已启用前端静态托管: ${distPath}`);
  }
}

// 404 处理
app.use((req, res) => {
  res.status(404).json({ success: false, error: "接口不存在", path: req.path });
});

// 统一错误处理中间件
app.use((err, req, res, next) => {
  console.error("⚠️  服务器错误:", err.message);
  if (err instanceof SyntaxError && err.status === 400) {
    return res.status(400).json({ success: false, error: "请求体 JSON 格式错误" });
  }
  res.status(500).json({
    success: false,
    error: "服务器内部错误",
    message: process.env.NODE_ENV === "production" ? undefined : err.message,
  });
});

// ==========================================
// 定时任务
// ==========================================
// 每天凌晨 3 点自动跑爬虫
cron.schedule("0 3 * * *", () => {
  if (isCrawling) return;
  log("⏰ 定时爬虫启动");
  isCrawling = true;
  const runLogId = db.startRunLog("crawler", { scheduled: true });
  runCrawler()
    .then((r) => {
      const count = db.upsertObservations(r.observations);
      lastCrawlTime = new Date().toISOString();
      db.finishRunLog(runLogId, "success", count);
    })
    .catch((e) => db.finishRunLog(runLogId, "failed", null, e.message))
    .finally(() => { isCrawling = false; });
});

// 每周一凌晨 4 点自动跑 ML 管道
cron.schedule("0 4 * * 1", () => {
  if (mlRunning) return;
  log("⏰ 定时 ML 管道启动");
  mlRunning = true;
  const runLogId = db.startRunLog("ml", { scheduled: true, module: "all" });
  runMLPipeline("", (err) => {
    if (err) {
      db.finishRunLog(runLogId, "failed", null, err.message);
    } else {
      const files = ["sdm_results.json", "forecast_results.json", "hotspot_results.json", "climate_correlation.json", "interpretability.json", "ehi_results.json"];
      for (const f of files) {
        const data = readMLResult(f);
        if (data && typeof data === "object" && !Array.isArray(data)) {
          const mod = f.replace("_results.json", "").replace(".json", "");
          for (const [sp, val] of Object.entries(data)) db.saveMLResult(mod, sp, val, runLogId);
        }
      }
      db.finishRunLog(runLogId, "success");
    }
    mlRunning = false;
  });
});

app.listen(PORT, () => {
  console.log(`\n🌿 自然感官生态档案库后端已启动`);
  console.log(`   API 地址: http://localhost:${PORT}/api`);
  console.log(`   爬虫脚本: ${CRAWLER_SCRIPT}`);
  console.log(`   输出目录: ${OUTPUT_DIR}`);
  console.log(`   🗄️  数据库: ${process.env.DB_PATH || path.join(ROOT, "data", "nsea.db")}`);
  console.log(`   ⏰ 定时任务: 每天 03:00 爬虫 / 每周一 04:00 ML`);

  // DB 为空时从 data/*.json 导入种子数据
  if (db.countObservations() === 0) {
    const seedPath = path.join(ROOT, "..", "data", "species_observations.json");
    if (fs.existsSync(seedPath)) {
      try {
        const seed = JSON.parse(fs.readFileSync(seedPath, "utf-8"));
        const n = db.upsertObservations(seed);
        const runId = db.startRunLog("crawler", { source: "seed" });
        db.finishRunLog(runId, "success", n);
        lastCrawlTime = new Date().toISOString();
        console.log(`   🌱 种子数据导入完成: ${n} 条观测`);
      } catch (e) {
        console.error("   ⚠️  种子数据导入失败:", e.message);
      }
    }
  }

  console.log(`   可用 API:`);
  console.log(`     GET  /api/health        健康检查`);
  console.log(`     GET  /api/data/latest   获取最新爬虫数据`);
  console.log(`     POST /api/refresh       实时运行爬虫刷新数据`);
  console.log(`     GET  /api/crawl/status  爬虫运行状态`);
  console.log();
});
