/**
 * SQLite 数据层（Node 内置 node:sqlite，零原生依赖）
 * 表：observations / run_log / ml_results / users
 */
const { DatabaseSync } = require("node:sqlite");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const DB_PATH = process.env.DB_PATH || path.join(__dirname, "..", "data", "nsea.db");
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

const db = new DatabaseSync(DB_PATH);
db.exec("PRAGMA journal_mode = WAL;");
db.exec("PRAGMA foreign_keys = ON;");

// 建表
db.exec(`
  CREATE TABLE IF NOT EXISTS observations (
    observation_id TEXT PRIMARY KEY,
    cn_name TEXT,
    en_name TEXT,
    latitude REAL,
    longitude REAL,
    observed_on TEXT,
    source TEXT,
    url TEXT,
    raw_json TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS run_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_type TEXT NOT NULL,        -- 'crawler' | 'ml'
    status TEXT NOT NULL,           -- 'running' | 'success' | 'failed'
    started_at TEXT NOT NULL,
    finished_at TEXT,
    record_count INTEGER,
    error TEXT,
    metadata TEXT
  );

  CREATE TABLE IF NOT EXISTS ml_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    module TEXT NOT NULL,           -- sdm / forecast / hotspot / climate / interpret / ehi
    species TEXT,
    result_json TEXT NOT NULL,
    run_log_id INTEGER,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (run_log_id) REFERENCES run_log(id)
  );

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    email TEXT,
    role TEXT DEFAULT 'visitor',
    created_at TEXT DEFAULT (datetime('now'))
  );
`);

// 索引
db.exec(`
  CREATE INDEX IF NOT EXISTS idx_obs_cn_name ON observations(cn_name);
  CREATE INDEX IF NOT EXISTS idx_obs_observed_on ON observations(observed_on);
  CREATE INDEX IF NOT EXISTS idx_run_log_type ON run_log(task_type);
  CREATE INDEX IF NOT EXISTS idx_ml_module ON ml_results(module);
`);

// 初始化默认用户
function seedUsers() {
  const stmt = db.prepare("INSERT OR IGNORE INTO users (id, username, password, role) VALUES (?, ?, ?, ?)");
  stmt.run(1, "admin", "admin123", "admin");
  stmt.run(2, "visitor", "visitor123", "visitor");
}
seedUsers();

// ============ observations ============
function makeObsId(o) {
  if (o.id) return String(o.id);
  const raw = `${o.source || ""}|${o.cn_name || o.name || ""}|${o.observed_on || o.time_observed_at || ""}|${o.latitude ?? o.lat ?? ""}|${o.longitude ?? o.lng ?? ""}`;
  return crypto.createHash("md5").update(raw).digest("hex");
}

function upsertObservations(list) {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO observations
      (observation_id, cn_name, en_name, latitude, longitude, observed_on, source, url, raw_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  let inserted = 0;
  for (const o of list) {
    const obsId = makeObsId(o);
    stmt.run(
      obsId,
      o.cn_name || o.name || "",
      o.en_name || o.sci_name || o.species_guess || "",
      o.latitude ?? o.lat ?? null,
      o.longitude ?? o.lng ?? null,
      o.observed_on || o.time_observed_at || null,
      o.source || "inaturalist",
      o.url || o.uri || "",
      JSON.stringify(o)
    );
    inserted++;
  }
  return inserted;
}

function getObservations(limit = 5000) {
  const stmt = db.prepare("SELECT * FROM observations ORDER BY observed_on DESC LIMIT ?");
  return stmt.all(limit);
}

function countObservations() {
  return db.prepare("SELECT COUNT(*) AS c FROM observations").get().c;
}

function getObsStats() {
  const total = countObservations();
  const china = db.prepare(
    "SELECT COUNT(*) AS c FROM observations WHERE latitude BETWEEN 18 AND 54 AND longitude BETWEEN 73 AND 135"
  ).get().c;
  const bySpecies = db.prepare(
    "SELECT cn_name, COUNT(*) AS c FROM observations GROUP BY cn_name ORDER BY c DESC"
  ).all();
  const bySource = db.prepare(
    "SELECT source, COUNT(*) AS c FROM observations GROUP BY source"
  ).all();
  const byMonth = db.prepare(
    "SELECT substr(observed_on,1,7) AS m, COUNT(*) AS c FROM observations WHERE observed_on IS NOT NULL GROUP BY m ORDER BY m"
  ).all();
  return { total, china, by_species: Object.fromEntries(bySpecies.map(r => [r.cn_name, r.c])), by_source: Object.fromEntries(bySource.map(r => [r.source, r.c])), by_month: Object.fromEntries(byMonth.map(r => [r.m, r.c])) };
}

// ============ run_log ============
function startRunLog(taskType, metadata = null) {
  const stmt = db.prepare(
    "INSERT INTO run_log (task_type, status, started_at, metadata) VALUES (?, 'running', ?, ?)"
  );
  const info = stmt.run(taskType, new Date().toISOString(), metadata ? JSON.stringify(metadata) : null);
  return info.lastInsertRowid;
}

function finishRunLog(id, status, recordCount = null, error = null) {
  const stmt = db.prepare(
    "UPDATE run_log SET status = ?, finished_at = ?, record_count = ?, error = ? WHERE id = ?"
  );
  stmt.run(status, new Date().toISOString(), recordCount, error, id);
}

function getLastRunLog(taskType) {
  return db.prepare(
    "SELECT * FROM run_log WHERE task_type = ? ORDER BY id DESC LIMIT 1"
  ).get(taskType);
}

function getRunLogs(limit = 20) {
  return db.prepare("SELECT * FROM run_log ORDER BY id DESC LIMIT ?").all(limit);
}

// ============ ml_results ============
function saveMLResult(module, species, resultJson, runLogId = null) {
  const stmt = db.prepare(
    "INSERT INTO ml_results (module, species, result_json, run_log_id) VALUES (?, ?, ?, ?)"
  );
  stmt.run(module, species || null, JSON.stringify(resultJson), runLogId);
}

function getLatestMLResult(module, species = null) {
  let stmt;
  if (species) {
    stmt = db.prepare(
      "SELECT result_json FROM ml_results WHERE module = ? AND species = ? ORDER BY id DESC LIMIT 1"
    );
    const row = stmt.get(module, species);
    return row ? JSON.parse(row.result_json) : null;
  }
  // 返回所有物种的该模块最新结果
  const rows = db.prepare(
    "SELECT species, result_json FROM ml_results WHERE module = ? ORDER BY id DESC"
  ).all(module);
  const out = {};
  for (const r of rows) {
    if (r.species && out[r.species] === undefined) {
      out[r.species] = JSON.parse(r.result_json);
    }
  }
  return out;
}

// ============ users ============
function findUser(username, password) {
  return db.prepare("SELECT id, username, role FROM users WHERE username = ? AND password = ?").get(username, password);
}

function findUserByUsername(username) {
  return db.prepare("SELECT id, username, email, role FROM users WHERE username = ?").get(username);
}

function createUser(username, password, email, role) {
  const stmt = db.prepare("INSERT INTO users (username, password, email, role) VALUES (?, ?, ?, ?)");
  const info = stmt.run(username, password, email || "", role || "visitor");
  return { id: info.lastInsertRowid, username, role: role || "visitor" };
}

// 健康检查：DB 是否连通
function healthCheck() {
  try {
    db.prepare("SELECT 1").get();
    return { ok: true, observations: countObservations() };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

module.exports = {
  db,
  upsertObservations,
  getObservations,
  countObservations,
  getObsStats,
  startRunLog,
  finishRunLog,
  getLastRunLog,
  getRunLogs,
  saveMLResult,
  getLatestMLResult,
  findUser,
  findUserByUsername,
  createUser,
  healthCheck,
};
