/**
 * 后端 API 与登录 E2E 测试
 * 使用 Node 内置 node:test 运行器，直接启动 server 进程测试。
 * 用法: node --test backend/server/test_api.test.js
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");
const path = require("node:path");

const BASE = "http://localhost:4000";
const SERVER_FILE = path.join(__dirname, "index.cjs");

let serverProc;
let token;

test.before(async () => {
  await new Promise((resolve, reject) => {
    serverProc = spawn("node", [SERVER_FILE], {
      env: { ...process.env, PORT: "4000" },
      stdio: "ignore",
    });
    let retries = 0;
    const tryConnect = async () => {
      try {
        await fetch(`${BASE}/api/health`);
        resolve();
      } catch (e) {
        retries++;
        if (retries > 30) reject(new Error("server 启动超时"));
        else setTimeout(tryConnect, 300);
      }
    };
    tryConnect();
  });
});

test.after(() => {
  if (serverProc) serverProc.kill();
});

// 1. /api/health
test("GET /api/health 返回 200 + ok", async () => {
  const res = await fetch(`${BASE}/api/health`);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.status, "ok");
});

// 2. 登录成功
test("POST /api/login 正确密码返回 token", async () => {
  const res = await fetch(`${BASE}/api/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "admin", password: "admin123" }),
  });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.success, true);
  assert.ok(body.token, "应返回 token");
  assert.ok(body.user, "应返回 user");
  token = body.token;
});

// 3. 登录失败
test("POST /api/login 错误密码返回 401", async () => {
  const res = await fetch(`${BASE}/api/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "admin", password: "wrong" }),
  });
  assert.equal(res.status, 401);
});

// 4. ML 接口无 token → 401
test("GET /api/ml/summary 无 token 返回 401", async () => {
  const res = await fetch(`${BASE}/api/ml/summary`);
  assert.equal(res.status, 401);
});

// 5. ML 接口带 token → 200 + 6 模块
test("GET /api/ml/summary 带 token 返回 6 模块", async () => {
  const res = await fetch(`${BASE}/api/ml/summary`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert.equal(res.status, 200);
  const body = await res.json();
  const expected = ["sdm", "forecast", "hotspot", "climate", "interpret", "ehi"];
  for (const key of expected) {
    assert.ok(body[key], `缺少模块: ${key}`);
  }
});

// 6. 篡改 token → 401（模拟 DevTools 改 localStorage）
test("篡改 token 返回 401", async () => {
  const res = await fetch(`${BASE}/api/ml/summary`, {
    headers: { Authorization: "Bearer fake.token.value" },
  });
  assert.equal(res.status, 401);
});
