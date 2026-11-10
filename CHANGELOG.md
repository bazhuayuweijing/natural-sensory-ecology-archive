# 更新日志

本项目遵循 [Keep a Changelog](https://keepachangelog.com/) 规范，版本号遵循 [Semantic Versioning](https://semver.org/lang/zh-CN/)。

## [Unreleased]

### 计划中
- 🚧 嗅觉维度：电子鼻硬件数据采集与回放
- 真实环境音景录音库
- 更多物种类别的 SDM 模型

## [0.2.0] — 2026-11-09

### 新增
- **数据层升级**：引入 SQLite（Node 内置 `node:sqlite`），存储观测数据、ML 输出、运行日志
- **爬虫定时化**：`node-cron` 每天凌晨 3 点自动爬取，每周一凌晨 4 点自动跑 ML
- **增量更新**：按 observation_id UPSERT 去重，重复跑不产生重复记录
- **run_log 表**：每次爬虫/ML 运行记录时间、条数、状态
- **ML 管道加锁**：重复请求返回 409，连点只跑 1 次
- **API 限流**：`express-rate-limit`，全局 60 次/分钟，ML/报告 5 次/分钟
- **CORS 白名单**：只允许配置的前端域名
- **健康检查增强**：返回 DB 连通状态、ML 输出时间、爬虫/ML 最后运行状态
- **Docker Compose**：frontend + backend 两个服务，`docker compose up` 一键启动
- **开源基础设施**：CONTRIBUTING.md、Issue/PR 模板、CHANGELOG.md

### 安全
- JWT 认证（HS256），ML 接口需登录
- 星火 API Key 仅存后端 env，不下发前端

## [0.1.0] — 2026-11-01

### 新增
- 前端 React + TypeScript + Vite 基础架构
- 后端 Express API
- Python ML 管道六模块（SDM/Forecast/Hotspot/Climate/Interpret/EHI）
- TF.js 端侧物种识别（MobileNetV2）
- Web Audio API 环境音景合成
- 讯飞星火 LLM 报告生成（含降级模板）
- 真实地图（Leaflet + OpenStreetMap）
- 登录/注册 + JWT 认证
