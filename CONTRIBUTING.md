# 贡献指南

感谢你对自然感官生态档案库的关注！欢迎提交 Issue 和 Pull Request。

## 快速开始

```bash
# 1. 克隆仓库
git clone https://github.com/bazhuayuweijing/natural-sensory-ecology-archive
cd natural-sensory-ecology-archive

# 2. 安装依赖
npm install
pip install -r backend/ml/requirements.txt

# 3. 启动开发环境（前后端同时）
npm run dev:all

# 4. 运行测试
npm test
```

## 开发规范

### 代码风格
- 前端：TypeScript + React，遵循 `tsconfig.json` 配置
- 后端：CommonJS (`.cjs`)，Node 22+
- 运行 `npm run check` 确保类型检查通过

### 提交规范
使用 [Conventional Commits](https://www.conventionalcommits.org/) 格式：

```
feat: 新增物种识别功能
fix: 修复 ML 管道超时问题
docs: 更新 README 部署说明
refactor: 重构数据层为 SQLite
test: 添加 ML schema 测试
```

### 分支策略
- `main`：生产分支，始终可运行
- 功能开发：从 `main` 切出 `feat/xxx` 分支
- Bug 修复：从 `main` 切出 `fix/xxx` 分支

## 提交流程

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feat/amazing-feature`)
3. 提交改动 (`git commit -m 'feat: add amazing feature'`)
4. 推送到分支 (`git push origin feat/amazing-feature`)
5. 开启 Pull Request

## PR 要求

- 关联 Issue（如适用）
- 通过 CI（`npm run check && npm run build && npm test`）
- 简要说明改动内容和测试方式

## 项目结构

```
├── src/              # 前端 React 代码
├── backend/
│   ├── server/       # Express 后端 + SQLite
│   ├── ml/           # Python 机器学习管道
│   └── crawler/      # 数据爬虫
├── data/             # 种子数据（JSON）
└── docs/             # 项目文档
```

## 有问题？

欢迎开 [Issue](https://github.com/bazhuayuweijing/natural-sensory-ecology-archive/issues) 讨论。
