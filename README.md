# 🌿 自然感官生态档案库 (Natural Sensory Ecology Archive)

> 无人机驱动的多维度自然记录与交互平台 — 用科技感知自然，用数据守护生态

融合视觉影像、生物声波与环境气味，构建可交互的生态档案。为科研监测、科普教育、生态保护提供立体化数据支持。

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

### 🎧 五感沉浸体验
基于 **Web Audio API** 实时合成环境音景：
- 珲春针叶林晨雾（风声 + 溪流 + 鸟鸣）
- 湿地日落（风声 + 鹤鸣 + 蛙声）
- 雨林树冠层（虫鸣 + 长臂猿 + 风声）

### 🎨 灵动 UI 交互
- 导航栏滚动毛玻璃效果
- 卡片悬停上浮 + 阴影微交互
- 首页浮动光点与叶片装饰
- 数字滚动动画（IntersectionObserver 触发）
- 按钮按压反馈

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

- **东北虎监测数据**：吉林珲春东北虎国家级自然保护区 GPS 监测位点
- **全球物种观察**：[iNaturalist](https://www.inaturalist.org/) 开放数据
- **环境音效**：Web Audio API 实时合成（非预录音频）

## 📄 许可证

[MIT License](LICENSE)

---

<div align="center">

用科技感知自然，用数据守护生态 🌍

</div>
