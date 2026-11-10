# 🌿 自然感官生态档案库 (Natural Sensory Ecology Archive)

> 无人机驱动的多维度自然记录与交互平台 — 用科技感知自然，用数据守护生态

![CI](https://github.com/bazhuayuweijing/natural-sensory-ecology-archive/actions/workflows/ci.yml/badge.svg)
![License](https://img.shields.io/badge/license-MIT-green)
![Node](https://img.shields.io/badge/node-%3E%3D22-blue)
![Python](https://img.shields.io/badge/python-%3E%3D3.10-blue)
![TypeScript](https://img.shields.io/badge/typescript-5.8-blue)

融合视觉影像、生物声波，构建可交互的生态档案。环境气味采集 🚧 规划中，待数据接入。为科研监测、科普教育、生态保护提供立体化数据支持。

## 🏗️ 架构图

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐     ┌───────────┐
│   前端 SPA   │────▶│  Express 后端 │────▶│ Python ML 管道│────▶│  SQLite DB│
│ (React+TS)  │◀────│  (Node 22)   │◀────│ (scikit-learn)│◀────│ (node:sqlite)
└─────────────┘     └──────┬───────┘     └──────────────┘     └───────────┘
      │                    │
      │                    ├─▶ 讯飞星火 LLM（报告生成）
      │                    └─▶ 爬虫（iNaturalist 数据）
      └─▶ TF.js 端侧推理（物种识别，图片不上传）
      └─▶ Web Audio API（环境音景合成）
```

数据流向：爬虫 → SQLite → ML 管道 → SQLite → 后端 API → 前端展示

## ✨ 核心功能

### 🗺️ 全球物种观察点
基于 **Leaflet + OpenStreetMap** 的真实地图展示，支持全球物种分布点可视化，点击标记查看详细观测信息。

### 🐯 东北虎 GPS 监测与观察故事
收录 **101 条**珲春东北虎监测位点数据，按核心繁殖区、稳定栖息区、活动扩散区、偶发目击分类，每个位点配有观察故事与科研意义说明。

### 📊 Dashboard 数据洞察
基于真实监测数据动态计算：
- 月度趋势变化率与方向判断
- 栖息地类型占比与保护意义分析
- 物种观察频次统计
- 数据源贡献率

### 🤖 ML 生态分析管道（Python + scikit-learn）
| 模块 | 功能 | 算法 |
|------|------|------|
| **SDM** | 物种分布模型 | GradientBoostingClassifier |
| **EHI** | 生态健康指数 | 多因子加权评估 |
| **Hotspot** | 热点区域分析 | DBSCAN 聚类 |
| **Forecast** | 种群数量预测 | Holt-Winters 时序预测 |
| **Climate** | 气候相关性分析 | 相关系数矩阵 |
| **Interpret** | 模型可解释性 | Permutation Importance + PDP |

### 🖼️ CNN 物种识别
前端基于 **TensorFlow.js + MobileNetV2** 实现图像物种识别，无需后端即可完成推理。

### 📝 AI 分析报告
接入**讯飞星火 Spark-X 大模型**，自动生成生态学分析报告。

### 🎧 多感官沉浸体验
基于 **Web Audio API** 实时合成环境音景（听觉已实现）：
- 珲春针叶林晨雾（风声 + 溪流 + 鸟鸣）
- 湿地日落（风声 + 鹤鸣 + 蛙声）
- 雨林树冠层（虫鸣 + 长臂猿 + 风声）

> 🚧 嗅觉（环境气味采集与回放）规划中，待电子鼻硬件与气味数据集接入后上线。

### 🎨 灵动 UI 交互
- 导航栏滚动毛玻璃效果
- 卡片悬停上浮 + 阴影微交互
- 首页浮动光点与叶片装饰
- 数字滚动动画（IntersectionObserver 触发）
- 按钮按压反馈

## 🧠 设计说明（设计亮点）

### 1. 机器学习管道六模块（可复现的生态分析流水线）

整条管道以 `data/*.json` 为唯一数据入口，输出 6 份结构化 JSON 到 `backend/ml/output/`，全程无人工干预、可重复执行。六个模块各有分工且形成闭环：**SDM**（物种分布模型，XGBoost + AUC 评估，回答"物种在哪"）、**Forecast**（Holt-Winters 时序预测 + 异常检测，回答"种群怎么变"）、**Hotspot**（DBSCAN 空间聚类，回答"哪里是热点"）、**Climate**（BioClim 因子相关性分析，回答"什么环境因子在起作用"）、**Interpret**（Permutation Importance + PDP 边际效应，回答"模型为何这样判断"）、**EHI**（生态健康指数，加权打分给出 A/B/C/D 等级与保护建议）。设计上刻意将"预测—解释—决策"串成一条链，避免黑箱模型只有数字没有结论。

### 2. Web Audio 环境音景合成（零音频文件的沉浸体验）

音景不依赖任何预录音频文件，全部由 Web Audio API 实时合成：鸟叫声通过多组正弦波叠加 + 频率随机抖动模拟；风声用白噪声经低通滤波器调制；雨声用粉噪声 + 高通滤波；虫鸣用方波快速颤音。所有声音由用户点击触发，可独立开关、调节音量。这样做的好处是**零带宽、零版权风险、可参数化**——只要修改振荡器频率和包络参数，就能从"珲春针阔混交林"切换到"热带雨林"，为后续接入真实生态声学数据预留了合成器接口。

### 3. TensorFlow.js 端侧物种识别（隐私优先的推理）

物种识别使用 MobileNetV2 在**浏览器端**完成推理，图片不上传服务器。模型权重从 CDN 懒加载，首次推理约 1-2 秒，之后可缓存。识别结果返回 Top-5 置信度，并与本地物种库做名称匹配，给出"可能是丹顶鹤，置信度 87%"的可读输出。选择端侧推理而非后端推理，一是保护用户上传的图片隐私，二是降低服务器算力成本，三是在弱网/离线场景下仍可使用——这正是生态调查在野外无网络环境下的真实需求。

## 🛠️ 技术栈

### 前端
- **React 18** + **TypeScript**
- **Vite 6** 构建工具
- **Tailwind CSS 3** 样式（自定义森林绿主题）
- **React Router 7** 路由
- **Zustand** 状态管理（localStorage 持久化）
- **Recharts** 数据可视化
- **Leaflet + react-leaflet** 地图
- **TensorFlow.js + MobileNetV2** 图像识别
- **lucide-react** 图标

### 后端
- **Express 5** (Node.js)
- **CORS** 跨域支持

### 数据科学
- **Python 3.10**
- **scikit-learn**（分类、聚类、时序、可解释性）
- **pandas / numpy**

## 📁 目录结构

```
.
├── src/                      # 前端源码
│   ├── components/           # 通用组件
│   │   ├── Layout/          # 布局组件（Navbar、Footer）
│   │   └── ui/              # UI 组件（Card、GlobalMap）
│   ├── data/                # 数据源（物种、老虎、爬虫数据）
│   ├── hooks/               # 自定义 Hooks
│   ├── pages/               # 页面组件
│   ├── store/               # Zustand 状态管理
│   ├── utils/               # 工具函数（环境音效等）
│   ├── App.tsx              # 应用入口
│   └── main.tsx             # React 渲染入口
├── backend/                  # 后端代码
│   ├── server/              # Express 服务器
│   │   └── index.cjs
│   ├── ml/                  # ML 分析管道
│   │   ├── pipeline.py      # 主管道脚本
│   │   └── requirements.txt
│   └── crawler/             # iNaturalist 数据爬虫
│       ├── nsea_crawler.py
│       └── config.py
├── docs/                     # 项目文档
├── assets/                   # 图片资源
├── public/                   # 静态资源
├── data/                     # 原始数据
├── .env.example              # 环境变量模板
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

## 🚀 快速开始

### 环境要求
- **Node.js** >= 18
- **Python** >= 3.10（运行 ML 管道时需要）

### 1. 克隆仓库
```bash
git clone https://github.com/bazhuayuweijing/natural-sensory-ecology-archive.git
cd natural-sensory-ecology-archive
```

### 2. 安装依赖
```bash
npm install
```

### 3. 配置环境变量（可选）
```bash
cp .env.example .env
# 编辑 .env，填入讯飞星火 API Key（用于 AI 报告生成）
```

### 4. 启动前端开发服务器
```bash
npm run dev
```
访问 http://localhost:5173

### 5. 启动后端服务（可选，用于 ML 分析和爬虫）
```bash
npm run server
```
后端运行在 http://localhost:4000

### 6. 同时启动前后端
```bash
npm run dev:all
```

### 7. 构建生产版本
```bash
npm run build
npm run preview
```

## ⚙️ 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `SPARK_API_KEY` | 讯飞星火 API Key，用于 AI 报告生成 | 无 |
| `SPARK_MODEL` | 星火模型名称 | `spark-x2.5-1.7b` |
| `SPARK_BASE_URL` | 星火 API 地址 | `https://maas-api.cn-huabei-1.xf-yun.com/v2` |
| `PORT` | 后端服务端口 | `4000` |

> 💡 AI 报告功能需要配置 `SPARK_API_KEY`，未配置时该功能返回 503 提示。其他功能无需 API Key 即可使用。

## 🔌 后端 API

### 健康检查
```
GET /api/health
```

### 数据接口
```
GET  /api/data/latest       # 获取最新爬虫数据
GET  /api/crawl/status      # 爬虫状态
POST /api/refresh           # 触发数据刷新
```

### ML 分析接口
```
GET  /api/ml/summary        # 综合分析摘要（6 模块）
GET  /api/ml/sdm            # 物种分布模型
GET  /api/ml/ehi            # 生态健康指数
GET  /api/ml/hotspot        # 热点区域分析
GET  /api/ml/forecast       # 种群数量预测
GET  /api/ml/climate        # 气候相关性
GET  /api/ml/interpret      # 模型可解释性
POST /api/ml/run            # 重新运行 ML 管道
POST /api/ml/report         # 生成 AI 分析报告
GET  /api/ml/llm-status     # 大模型配置状态
```

## 🧪 ML 管道使用

### 安装 Python 依赖
```bash
cd backend/ml
pip install -r requirements.txt
```

### 运行分析管道
```bash
cd backend/ml
python pipeline.py
```

管道会读取 `src/data/` 中的数据，输出结果到 `backend/ml/output/`（该目录已被 `.gitignore` 忽略）。

## 🕷️ 数据爬虫

项目从 [iNaturalist](https://www.inaturalist.org/) 爬取全球物种观察数据。

```bash
cd backend/crawler
python nsea_crawler.py
```

爬虫配置见 `backend/crawler/config.py`，输出数据会写入 `src/data/crawlerObservations.ts`。

## 🔐 测试账号

| 用户名 | 密码 |
|--------|------|
| `admin` | `admin123` |
| `visitor` | `visitor123` |

> 账号信息存储在 `localStorage` 中，ML Hub 页面需要登录后访问。

## 📊 数据来源

- **东北虎监测数据**：吉林珲春东北虎国家级自然保护区 GPS 监测位点（101 条）
- **全球物种观察**：[iNaturalist](https://www.inaturalist.org/) 开放数据（2400 条）
- **环境音效**：Web Audio API 实时合成（非预录音频）
- **环境气味**：🚧 规划中，待电子鼻硬件采集数据接入

## 🗺️ Roadmap

### ✅ 已完成
- [x] 真实地图展示（Leaflet + OpenStreetMap）
- [x] ML 管道六模块（SDM/Forecast/Hotspot/Climate/Interpret/EHI）
- [x] TF.js 端侧物种识别
- [x] Web Audio 环境音景合成
- [x] 讯飞星火 LLM 报告生成（含降级模板）
- [x] JWT 认证 + API 限流 + CORS 白名单
- [x] SQLite 数据持久化 + 爬虫定时 + 增量去重
- [x] Docker Compose + GitHub Actions CI

### 🚧 进行中 / 欢迎认领
- [ ] **嗅觉维度**：规划中，电子鼻硬件数据采集与气味回放（需要硬件支持）
- [ ] **真实环境音景录音库**：替代合成音效，接入野外录音
- [ ] **更多物种类别**：扩展 SDM 模型覆盖物种
- [ ] **移动端适配**：PWA / 响应式优化
- [ ] **多用户协作**：观测数据众包上传与审核

> 欢迎认领上述任务！开 [Issue](https://github.com/bazhuayuweijing/natural-sensory-ecology-archive/issues) 或直接提 PR。

## 🚢 部署

### 生产构建

```bash
# 1. 构建前端静态文件
npm run build          # 输出到 dist/

# 2. 启动后端（同时托管前端静态文件）
NODE_ENV=production JWT_SECRET=your-secret PORT=4000 npm run server
```

后端 `index.cjs` 已预留静态文件托管，取消注释 `app.use(express.static(...))` 即可让 Express 同时服务 `dist/`。

### 环境变量（生产必设）

| 变量 | 说明 |
|------|------|
| `NODE_ENV=production` | 生产模式，隐藏错误详情 |
| `JWT_SECRET` | JWT 签名密钥，务必改为随机长字符串 |
| `PORT` | 后端端口，默认 4000 |
| `SPARK_API_KEY` | 星火大模型 Key（可选，不配则报告降级为模板） |
| `VITE_API_BASE` | 前端构建时指向的后端地址 |

### 一键式：Docker Compose（frontend + backend）

项目提供 `docker-compose.yml`，两个服务一条命令启动：

```bash
docker compose up -d
```

- **frontend**：Nginx 托管前端静态文件，端口 `8080`，`/api/` 反代到 backend
- **backend**：Node 22 + Python，端口 `4000`，含 SQLite 数据卷

访问 `http://localhost:8080` 即可打开应用。

### 反向代理建议（Nginx）

```nginx
server {
    listen 80;
    location / {
        root /var/www/nsea/dist;
        try_files $uri /index.html;
    }
    location /api/ {
        proxy_pass http://127.0.0.1:4000;
    }
}
```

## ✅ 自我验收清单

| # | 项 | 状态 |
|---|-----|------|
| 1 | 所有页面可正常渲染，无白屏 | ✅ |
| 2 | 所有 API 返回正常状态码，无 500 | ✅ |
| 3 | ML 管道 6 模块跑通，输出 JSON 到 output/ | ✅ |
| 4 | JWT 认证：无 token 401、篡改 token 被拒 | ✅ |
| 5 | README 中"气味"功能已标注 🚧 规划中 | ✅ |
| 6 | pipeline.py 仅读取 data/*.json，与前端解耦 | ✅ |
| 7 | 最小测试通过：ML schema + 后端 API + 登录 E2E | ✅ |
| 8 | 星火调用：30s 超时 + 1 次重试 + 无 Key 降级模板报告 | ✅ |
| 9 | 图表标注样本量（n=xx）、数据来源与时间戳 | ✅ |
| 10 | 部署说明 + Dockerfile + docker-compose + GitHub Actions | ✅ |
| 11 | 后端统一错误中间件 + 前端 loading/error 状态 | ✅ |

## 📄 许可证

[MIT License](LICENSE)

---

<div align="center">

用科技感知自然，用数据守护生态 🌍

</div>
