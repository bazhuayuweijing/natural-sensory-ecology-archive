# 🌿 自然感官生态档案库

> 无人机驱动的多维度自然记录与交互平台 — 用科技感知自然，用数据守护生态

融合 **视觉影像、生物声波、环境气味** 三模感官采集，结合 **机器学习生态分析** 与 **大模型报告生成**，构建可交互的濒危物种生态档案。为科研监测、科普教育、生态保护提供立体化数据支持。

---

## ✨ 核心功能

### 🗺️ 生态档案库
- **珲春东北虎栖息地地图**：基于 OpenStreetMap 真实底图，101 个 GPS 监测位点，每个位点附带发现日期、事件经过、科研意义
- **全球物种观察点**：iNaturalist + GBIF 合并数据，真实全球分布展示
- **物种感官三联档案**：每个物种的视觉 / 听觉 / 嗅觉特征

### 📊 数据总览
- 全球观察记录、中国区域记录、监测物种、珲春位点等核心指标
- 近 12 个月趋势、栖息地分布、物种分布、数据源分布图表
- **数据洞察摘要**：每个图表附带基于真实数据计算的文字解读

### 🤖 AI 模型中心（需登录）
8 个机器学习模块：
| 模块 | 说明 |
|------|------|
| 生态健康指数 (EHI) | 雷达图综合评估栖息地健康，给出保护建议 |
| 物种分布模型 (SDM) | Gradient Boosting 预测物种适宜分布区 |
| 时序趋势预测 | Holt-Winters 预测未来观察趋势 |
| 时空热点检测 | DBSCAN 聚类识别生物聚集热点 |
| 环境因子关联 | 分析气候因子与观察数的相关性 |
| 模型可解释性 | Permutation Importance + 偏依赖图 (PDP) |
| AI 分析报告 | 讯飞星火大模型生成物种保护简报 |
| 图片物种识别 | TensorFlow.js + MobileNetV2 前端推理 |

### 🎧 感官体验
- 沉浸式视听嗅三联播放
- **Web Audio API 实时合成环境音效**：松涛、流水、鸟鸣、鹤鸣、蛙鸣、虫鸣、长臂猿晨鸣
- 三场景音景：珲春针叶林晨雾 / 湿地日落 / 雨林树冠层
- 感官开关联动音量

### 🚁 无人机监测
- 8 架无人机机群实时状态（电量、传感器质量、任务）
- 视觉 / 听觉 / 嗅觉三模传感器质量监控

---

## 🛠️ 技术栈

| 层 | 技术 |
|----|------|
| 前端 | React 18 + TypeScript + Vite + Tailwind CSS |
| 地图 | Leaflet + react-leaflet + OpenStreetMap |
| 图表 | Recharts |
| 状态管理 | Zustand（localStorage 持久化） |
| 深度学习 | TensorFlow.js + MobileNetV2 |
| 后端 | Express (Node.js) |
| 机器学习 | Python + scikit-learn + statsmodels + xgboost |
| 大模型 | 讯飞星火 Spark-X（OpenAI 兼容接口） |
| 爬虫 | Python + requests（iNaturalist / GBIF / Wikipedia） |

---

## 📁 项目结构

```
自然感官生态档案库/
├── src/                    # 前端源码
│   ├── pages/              # 页面（Home/Dashboard/Archive/MLHub/Experience 等）
│   ├── components/         # 组件（Layout/ui/ProtectedRoute）
│   ├── data/               # 静态数据（物种、老虎位点、爬虫数据）
│   ├── hooks/              # 自定义 hooks
│   ├── store/              # Zustand 状态管理
│   └── utils/              # 工具（环境音合成等）
├── backend/                # 后端与脚本
│   ├── server/             # Express 后端
│   │   └── index.cjs
│   ├── ml/                 # Python 机器学习管道
│   │   ├── pipeline.py     # 主管道（SDM/预测/热点/EHI/可解释性）
│   │   ├── requirements.txt
│   │   └── output/         # ML 输出（.gitignore，需重新生成）
│   └── crawler/            # 数据爬虫
│       ├── nsea_crawler.py
│       ├── config.py       # 目标物种配置
│       └── output/         # 爬虫输出（.gitignore，需重新生成）
├── data/                   # 原始数据
├── assets/                 # 图片资源
├── docs/                   # 项目文档
└── .env.example            # 环境变量模板
```

---

## 🚀 快速开始

### 环境要求
- Node.js >= 18
- Python >= 3.10

### 1. 安装依赖

```bash
npm install
```

### 2. 启动前端开发服务器

```bash
npm run dev
```

访问 http://localhost:5173

### 3. 启动后端（ML 数据 + LLM 报告）

```bash
npm run server
```

后端运行在 http://localhost:4000

### 4. 一键启动前后端

```bash
npm run dev:all
```

---

## 🔧 环境变量配置

复制 `.env.example` 为 `.env` 并填入你的配置：

```bash
cp .env.example .env
```

| 变量 | 说明 |
|------|------|
| `SPARK_API_KEY` | 讯飞星火 API Key，用于 AI 分析报告模块。在 [讯飞开放平台](https://www.xfyun.cn/) 申请 |
| `SPARK_MODEL` | 模型名称，默认 `spark-x2.5-1.7b` |
| `PORT` | 后端端口，默认 `4000` |

> 不配置 `SPARK_API_KEY` 时，AI 报告模块会提示未配置，其余功能正常使用。

---

## 🧠 机器学习管道

### 安装 Python 依赖

```bash
cd backend/ml
pip install -r requirements.txt
```

### 运行全部分析

```bash
cd backend/ml
python pipeline.py
```

### 运行单个模块

```bash
cd backend/ml
python pipeline.py sdm        # 物种分布模型
python pipeline.py forecast   # 时序趋势预测
python pipeline.py hotspot    # 时空热点检测
python pipeline.py climate    # 环境因子关联
python pipeline.py interpret  # 模型可解释性
python pipeline.py ehi        # 生态健康指数
```

输出结果保存在 `backend/ml/output/` 目录，后端会自动读取。

---

## 🕷️ 数据爬虫

爬取 iNaturalist、GBIF、Wikipedia 的物种观察数据：

```bash
cd backend/crawler
pip install requests pandas
python nsea_crawler.py
```

目标物种在 `backend/crawler/config.py` 中配置。

---

## 👤 测试账号

| 邮箱 | 密码 |
|------|------|
| `admin@natural-eco.org` | `eco2026` |

也可自行注册新账号。

---

## 📄 许可证

MIT License

---

## 🙏 数据来源

- [iNaturalist](https://www.inaturalist.org/) — 全球公民科学观察数据
- [GBIF](https://www.gbif.org/) — 全球生物多样性信息网络
- [Wikipedia](https://www.wikipedia.org/) — 物种百科信息
- OpenStreetMap — 地图底图
