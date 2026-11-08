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

const app = express();
const PORT = 4000;

const ROOT = path.resolve(__dirname, "..");
const CRAWLER_DIR = path.join(ROOT, "crawler");
const OUTPUT_DIR = path.join(CRAWLER_DIR, "output");
const ML_DIR = path.join(ROOT, "ml");
const ML_OUTPUT_DIR = path.join(ML_DIR, "output");
const CRAWLER_SCRIPT = path.join(CRAWLER_DIR, "nsea_crawler.py");
const ML_PYTHON = "/usr/local/bin/python3";

// 允许前端跨域
app.use(cors());
app.use(express.json());

// 爬取状态缓存（避免重复爬取）
let lastCrawlTime = null;
let isCrawling = false;
let crawlLogs = [];

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
  res.json({
    status: "ok",
    uptime: process.uptime(),
    node: process.version,
    lastCrawlTime,
    isCrawling,
  });
});

// 刷新爬虫数据（核心接口）
app.post("/api/refresh", async (req, res) => {
  if (isCrawling) {
    return res.status(429).json({
      success: false,
      message: "爬虫正在运行中，请稍后再试",
    });
  }

  isCrawling = true;
  crawlLogs = [];

  try {
    const result = await runCrawler();
    lastCrawlTime = new Date().toISOString();
    res.json({
      success: true,
      message: "数据刷新成功",
      observationsCount: result.observations.length,
      infosCount: result.infos.length,
      crawledAt: result.crawledAt,
      durationSeconds: result.durationSeconds,
      observations: result.observations,
      infos: result.infos,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "爬虫执行失败: " + err.message,
      error: String(err),
    });
  } finally {
    isCrawling = false;
  }
});

// 获取最新数据（不运行爬虫，直接读文件）
app.get("/api/data/latest", (req, res) => {
  const obsPath = path.join(OUTPUT_DIR, "species_observations.json");
  const infoPath = path.join(OUTPUT_DIR, "species_info.csv");
  const statsPath = path.join(OUTPUT_DIR, "..", "..", "..", "src", "data", "crawlerStats.ts");

  let observations = [];
  let infos = [];
  let fileCrawledAt = null;

  if (fs.existsSync(obsPath)) {
    observations = JSON.parse(fs.readFileSync(obsPath, "utf-8"));
    fileCrawledAt = fs.statSync(obsPath).mtime.toISOString();
  } else {
    observations = loadBuiltinData();
  }

  if (fs.existsSync(infoPath)) {
    infos = parseCSV(infoPath);
  }

  // 统计
  const stats = {
    total: observations.length,
    china: observations.filter(
      (o) => 18 <= o.latitude && o.latitude <= 54 && 73 <= o.longitude && o.longitude <= 135
    ).length,
    by_species: {},
    by_source: {},
    by_month: {},
  };
  for (const o of observations) {
    stats.by_species[o.cn_name] = (stats.by_species[o.cn_name] || 0) + 1;
    stats.by_source[o.source] = (stats.by_source[o.source] || 0) + 1;
    const m = (o.observed_on || "").slice(0, 7);
    if (m) stats.by_month[m] = (stats.by_month[m] || 0) + 1;
  }

  res.json({
    observations,
    infos,
    stats,
    lastCrawlTime,
    fileCrawledAt,
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
// ML 分析 API
// ==========================================

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

// 运行 ML 管道
app.post("/api/ml/run", (req, res) => {
  const cmd = (req.body && req.body.module) || "";  // "sdm" / "forecast" / "hotspot" / ""(all)
  runMLPipeline(cmd, (err, stdout, stderr) => {
    if (err) {
      res.status(500).json({ success: false, error: err.message, stderr });
      return;
    }
    res.json({
      success: true,
      output: stdout,
      logs: (stderr || "").split("\n").filter(Boolean),
    });
  });
});

// SDM 物种分布模型结果
app.get("/api/ml/sdm", (req, res) => {
  const data = readMLResult("sdm_results.json");
  if (!data) return res.status(404).json({ error: "SDM 结果未生成，请先 POST /api/ml/run" });
  res.json(data);
});

// 时序预测结果
app.get("/api/ml/forecast", (req, res) => {
  const data = readMLResult("forecast_results.json");
  if (!data) return res.status(404).json({ error: "预测结果未生成" });
  res.json(data);
});

// 热点检测结果
app.get("/api/ml/hotspot", (req, res) => {
  const data = readMLResult("hotspot_results.json");
  if (!data) return res.status(404).json({ error: "热点结果未生成" });
  res.json(data);
});

// 环境因子关联结果
app.get("/api/ml/climate", (req, res) => {
  const data = readMLResult("climate_correlation.json");
  if (!data) return res.status(404).json({ error: "关联结果未生成" });
  res.json(data);
});

// 汇总: 一键获取所有 ML 结果
app.get("/api/ml/summary", (req, res) => {
  res.json({
    sdm: readMLResult("sdm_results.json"),
    forecast: readMLResult("forecast_results.json"),
    hotspot: readMLResult("hotspot_results.json"),
    climate: readMLResult("climate_correlation.json"),
    interpret: readMLResult("interpretability.json"),
    ehi: readMLResult("ehi_results.json"),
  });
});

// 可解释性结果
app.get("/api/ml/interpret", (req, res) => {
  const data = readMLResult("interpretability.json");
  if (!data) return res.status(404).json({ error: "可解释性结果未生成" });
  res.json(data);
});

// 生态健康指数
app.get("/api/ml/ehi", (req, res) => {
  const data = readMLResult("ehi_results.json");
  if (!data) return res.status(404).json({ error: "EHI 结果未生成" });
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

app.post("/api/ml/report", async (req, res) => {
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

  if (!LLM_CONFIG.apiKey) {
    return res.status(503).json({
      success: false,
      error: "LLM 未配置",
      hint: "请在服务器环境变量中设置 SPARK_API_KEY 以启用 AI 报告生成",
    });
  }

  try {
    const body = {
      model: LLM_CONFIG.model,
      stream: false,
      temperature: 0.7,
      messages: [
        { role: "system", content: "你是一个专业的生态学数据分析师，擅长将机器学习分析结果转化为通俗易懂的自然保护建议。" },
        { role: "user", content: buildReportPrompt(species, summary) },
      ],
    };

    const response = await fetch(`${LLM_CONFIG.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${LLM_CONFIG.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errTxt = await response.text();
      return res.status(502).json({
        success: false,
        error: "LLM API 调用失败",
        detail: errTxt.slice(0, 300),
        hint: "检查 SPARK_API_KEY 是否已激活",
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    res.json({
      success: true,
      species,
      report: content,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
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
// 需要生产部署时可以加：app.use(express.static(path.join(ROOT, "..", "dist")))

app.listen(PORT, () => {
  console.log(`\n🌿 自然感官生态档案库后端已启动`);
  console.log(`   API 地址: http://localhost:${PORT}/api`);
  console.log(`   爬虫脚本: ${CRAWLER_SCRIPT}`);
  console.log(`   输出目录: ${OUTPUT_DIR}`);
  console.log(`   可用 API:`);
  console.log(`     GET  /api/health        健康检查`);
  console.log(`     GET  /api/data/latest   获取最新爬虫数据`);
  console.log(`     POST /api/refresh       实时运行爬虫刷新数据`);
  console.log(`     GET  /api/crawl/status  爬虫运行状态`);
  console.log();
});
