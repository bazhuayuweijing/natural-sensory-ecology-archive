import { useEffect, useRef, useState } from "react";
import {
  Brain, Zap, AlertTriangle, TrendingUp, MapPin, Flame,
  Activity, Sparkles, RefreshCw, ChevronRight, Leaf, Thermometer,
  Droplet, Mountain, Trees, AlertCircle, CheckCircle, Radar,
  FileText, Camera, Upload, Search, X, HeartPulse,
  Lightbulb, Shield, Target, Microscope
} from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, AreaChart, Area,
  ScatterChart, Scatter, ZAxis, Cell, Legend,
  RadarChart, Radar as RechartsRadar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from "recharts";
import Card from "@/components/ui/Card";
import GlobalMap, { type MapPoint } from "@/components/ui/GlobalMap";

// API 基址（和 server/index.cjs 端口一致）
const API_BASE = "http://localhost:4000";

interface MLData {
  sdm?: Record<string, any>;
  forecast?: Record<string, any>;
  hotspot?: Record<string, any>;
  climate?: Record<string, any>;
  interpret?: Record<string, any>;
  ehi?: Record<string, any>;
}

const SPECIES_COLORS: Record<string, string> = {
  东北虎: "#DC2626", 丹顶鹤: "#1B5E3F", 白头鹤: "#7CB892",
  梅花鹿: "#C9A961", 白手长臂猿: "#5E9A76", 远东豹: "#EA580C",
};

export default function MLHub() {
  const [data, setData] = useState<MLData>({});
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [tab, setTab] = useState<"ehi" | "sdm" | "forecast" | "hotspot" | "climate" | "interpret" | "report" | "identify">("ehi");
  const [selectedSpecies, setSelectedSpecies] = useState<string>("");

  // AI 报告状态
  const [reportLoading, setReportLoading] = useState(false);
  const [reportContent, setReportContent] = useState("");
  const [llmStatus, setLlmStatus] = useState<{ configured: boolean; model: string; hint: string } | null>(null);

  // 图片识别状态
  const [identifyLoading, setIdentifyLoading] = useState(false);
  const [identifyResult, setIdentifyResult] = useState<any>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/ml/summary`);
      const json = await res.json();
      setData(json);
      // 默认选中第一个有数据的物种
      if (!selectedSpecies) {
        const first = Object.keys(json.sdm || {})[0]
          || Object.keys(json.forecast || {})[0]
          || Object.keys(json.hotspot || {})[0];
        if (first) setSelectedSpecies(first);
      }
    } catch (e) {
      console.error("加载 ML 数据失败:", e);
    }
    setLoading(false);
  };

  const runML = async () => {
    setRunning(true);
    try {
      await fetch(`${API_BASE}/api/ml/run`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      await loadData();
    } finally {
      setRunning(false);
    }
  };

  useEffect(() => { loadData(); checkLlm(); }, []);

  const checkLlm = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/ml/llm-status`);
      setLlmStatus(await res.json());
    } catch {}
  };

  // ============ LLM 自动报告 ============
  const generateReport = async () => {
    if (!selectedSpecies) return;
    setReportLoading(true);
    setReportContent("");
    try {
      const res = await fetch(`${API_BASE}/api/ml/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ species: selectedSpecies }),
      });
      const json = await res.json();
      if (json.success) setReportContent(json.report);
      else setReportContent(`⚠️ 报告生成失败: ${json.detail || json.error || "未知错误"}\n\n提示：${json.hint || ""}`);
    } catch (e: any) {
      setReportContent(`⚠️ 请求失败: ${e.message}`);
    }
    setReportLoading(false);
  };

  // ============ CNN 图片识别 (TF.js + MobileNet) ============
  const identifyImage = async (file: File) => {
    setIdentifyLoading(true);
    setIdentifyResult(null);
    setPreviewImage(URL.createObjectURL(file));
    try {
      // 动态加载 TF.js 和 MobileNet
      const tf = await import("@tensorflow/tfjs");
      const mobilenetModule: any = await import("@tensorflow-models/mobilenet");
      const model = await mobilenetModule.load({ version: 2, alpha: 1.0 });

      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = URL.createObjectURL(file);
      await new Promise<void>((res) => { img.onload = () => res(); });

      const predictions = await model.classify(img);

      // 把 ImageNet 类别映射到我们的物种
      const SPECIES_KEYWORDS: Record<string, string[]> = {
        "东北虎": ["tiger", "tabby", "lynx", "leopard", "snow leopard"],
        "远东豹": ["leopard", "snow leopard"],
        "丹顶鹤": ["crane", "heron", "stork", "pelican"],
        "白头鹤": ["crane", "heron"],
        "梅花鹿": ["deer", "elk", "stag", "caribou"],
        "白手长臂猿": ["gibbon", "ape", "monkey", "chimpanzee"],
      };

      const matched: { species: string; confidence: number; raw: any }[] = [];
      for (const pred of predictions) {
        const lower = pred.className.toLowerCase();
        for (const [sp, kws] of Object.entries(SPECIES_KEYWORDS)) {
          if (kws.some((kw) => lower.includes(kw))) {
            matched.push({ species: sp, confidence: pred.probability, raw: pred });
          }
        }
      }

      setIdentifyResult({
        top5: predictions.slice(0, 5),
        matched,
        bestMatch: matched.sort((a, b) => b.confidence - a.confidence)[0] || null,
      });
    } catch (e: any) {
      setIdentifyResult({ error: e.message || String(e) });
    }
    setIdentifyLoading(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) identifyImage(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) identifyImage(file);
  };

  const speciesList = Object.keys(data.sdm || data.forecast || data.hotspot || {});
  const currentSdm = data.sdm?.[selectedSpecies];
  const currentForecast = data.forecast?.[selectedSpecies];
  const currentHotspot = data.hotspot?.[selectedSpecies];
  const currentClimate = data.climate?.[selectedSpecies];

  return (
    <div className="bg-cream min-h-screen py-10">
      <div className="container">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-forest-700 to-moss-600 flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-serif text-3xl font-semibold text-forest-900">
                生态数据科学分析中心
              </h1>
              <p className="text-forest-500 text-sm mt-0.5">
                XGBoost 物种分布模型 · 时序预测 · DBSCAN 热点检测 · 环境因子关联
              </p>
            </div>
          </div>
          <button
            onClick={runML} disabled={running}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-forest-700 text-white text-sm font-medium hover:bg-forest-800 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${running ? "animate-spin" : ""}`} />
            {running ? "模型训练中..." : "重新训练模型"}
          </button>
        </div>

        {/* 模型卡片概览 */}
        <div className="grid lg:grid-cols-4 gap-4 mb-8">
          <ModelCard
            icon={<HeartPulse className="w-5 h-5" />}
            title="生态健康指数" subtitle="EHI 综合评分"
            value={Object.keys(data.ehi || {}).length + " 个物种"}
            hint="种群趋势+栖息地+威胁 综合评级" active={tab === "ehi"} onClick={() => setTab("ehi")}
          />
          <ModelCard
            icon={<MapPin className="w-5 h-5" />}
            title="物种分布模型" subtitle="XGBoost SDM"
            value={Object.keys(data.sdm || {}).length + " 个物种"}
            hint="AUC 0.80 - 0.96" active={tab === "sdm"} onClick={() => setTab("sdm")}
          />
          <ModelCard
            icon={<TrendingUp className="w-5 h-5" />}
            title="时序趋势预测" subtitle="Holt-Winters"
            value={Object.keys(data.forecast || {}).length + " 条序列"}
            hint="异常检测 + 12 周预测" active={tab === "forecast"} onClick={() => setTab("forecast")}
          />
          <ModelCard
            icon={<Flame className="w-5 h-5" />}
            title="时空热点检测" subtitle="DBSCAN 聚类"
            value={Object.keys(data.hotspot || {}).length + " 个物种"}
            hint="自动发现活跃区域" active={tab === "hotspot"} onClick={() => setTab("hotspot")}
          />
          <ModelCard
            icon={<Thermometer className="w-5 h-5" />}
            title="环境因子关联" subtitle="特征重要性"
            value={Object.keys(data.climate || {}).length + " 个物种"}
            hint="理解物种生态位" active={tab === "climate"} onClick={() => setTab("climate")}
          />
          <ModelCard
            icon={<Lightbulb className="w-5 h-5" />}
            title="模型可解释性" subtitle="Permutation + PDP"
            value={Object.keys(data.interpret || {}).length + " 个物种"}
            hint="特征贡献分解与边际效应" active={tab === "interpret"} onClick={() => setTab("interpret")}
          />
          <ModelCard
            icon={<FileText className="w-5 h-5" />}
            title="AI 分析报告" subtitle="大模型自动生成"
            value={llmStatus?.configured ? "已激活" : "待激活"}
            hint={llmStatus?.model || "讯飞星火 Spark-X"}
            active={tab === "report"} onClick={() => setTab("report")}
          />
          <ModelCard
            icon={<Camera className="w-5 h-5" />}
            title="图片物种识别" subtitle="CNN + MobileNet"
            value="实时推理"
            hint="上传动物照片自动识别"
            active={tab === "identify"} onClick={() => setTab("identify")}
          />
        </div>

        {/* 物种选择器 */}
        {speciesList.length > 0 && (
          <div className="flex items-center gap-3 mb-6 flex-wrap">
            <span className="text-sm text-forest-500 font-medium">选择物种:</span>
            {speciesList.map((sp) => (
              <button
                key={sp}
                onClick={() => setSelectedSpecies(sp)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  selectedSpecies === sp
                    ? "bg-forest-700 text-white border-forest-700"
                    : "bg-white text-forest-700 border-forest-200 hover:border-forest-400"
                }`}
              >
                {sp}
              </button>
            ))}
          </div>
        )}

        {/* 加载态 */}
        {loading && (
          <Card className="p-12 text-center">
            <div className="inline-flex items-center gap-3 text-forest-500">
              <RefreshCw className="w-5 h-5 animate-spin" />
              正在加载 ML 分析结果...
            </div>
          </Card>
        )}

        {/* ===== SDM: 物种分布模型 ===== */}
        {!loading && tab === "sdm" && currentSdm && <SDMView data={currentSdm} species={selectedSpecies} />}

        {/* ===== 时序预测 ===== */}
        {!loading && tab === "forecast" && currentForecast && <ForecastView data={currentForecast} species={selectedSpecies} />}

        {/* ===== 热点检测 ===== */}
        {!loading && tab === "hotspot" && currentHotspot && <HotspotView data={currentHotspot} species={selectedSpecies} />}

        {/* ===== 环境因子关联 ===== */}
        {!loading && tab === "climate" && currentClimate && <ClimateView data={currentClimate} species={selectedSpecies} />}

        {/* ===== EHI 生态健康指数 ===== */}
        {!loading && tab === "ehi" && <EHIView data={data.ehi} species={selectedSpecies} />}

        {/* ===== 模型可解释性 ===== */}
        {!loading && tab === "interpret" && data.interpret?.[selectedSpecies] && (
          <InterpretView data={data.interpret[selectedSpecies]} species={selectedSpecies} />
        )}

        {/* ===== AI 自动报告 ===== */}
        {!loading && tab === "report" && currentSdm && (
          <AIReportView
            species={selectedSpecies}
            llmStatus={llmStatus}
            loading={reportLoading}
            content={reportContent}
            onGenerate={generateReport}
          />
        )}

        {/* ===== 图片物种识别 ===== */}
        {!loading && tab === "identify" && (
          <IdentifyView
            loading={identifyLoading}
            result={identifyResult}
            previewImage={previewImage}
            onPick={() => imageInputRef.current?.click()}
            onDrop={handleDrop}
            onClear={() => { setIdentifyResult(null); setPreviewImage(null); }}
            imageInputRef={imageInputRef}
            onFileChange={handleFileChange}
          />
        )}

        {!loading && !currentSdm && !currentForecast && !currentHotspot && (
          <Card className="p-12 text-center">
            <Brain className="w-10 h-10 text-forest-300 mx-auto mb-3" />
            <p className="text-forest-500">尚未生成 ML 分析结果，点击上方「重新训练模型」开始。</p>
          </Card>
        )}
      </div>
    </div>
  );
}

// ============================================================
// 子组件
// ============================================================

function ModelCard({ icon, title, subtitle, value, hint, active, onClick }: any) {
  return (
    <button onClick={onClick} className="text-left">
      <Card className={`p-5 transition-all hover:-translate-y-1 ${active ? "ring-2 ring-forest-500" : ""}`}>
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${active ? "bg-forest-700 text-white" : "bg-forest-100 text-forest-600"}`}>
            {icon}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-forest-900">{title}</h3>
            <p className="text-xs text-forest-400 mb-2">{subtitle}</p>
            <p className="font-serif text-xl font-semibold text-forest-800">{value}</p>
            <p className="text-xs text-forest-500 mt-1">{hint}</p>
          </div>
        </div>
      </Card>
    </button>
  );
}

// ============ SDM 物种分布模型视图 ============
function SDMView({ data, species }: { data: any; species: string }) {
  const h = data.heatmap;
  const color = SPECIES_COLORS[species] || "#1B5E3F";

  return (
    <div className="grid lg:grid-cols-3 gap-5">
      {/* 左: 模型性能 */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-5 h-5 text-forest-600" />
          <h3 className="font-serif text-lg font-semibold text-forest-900">
            {species} · 分布模型性能
          </h3>
        </div>
        <div className="space-y-4">
          <MetricRow label="模型算法" value="GradientBoosting" />
          <MetricRow label="训练样本" value={`${data.n_observations} present × 背景点`} />
          <MetricRow label="AUC (ROC)" value={data.auc.toString()} accent={data.auc > 0.9 ? "#1B5E3F" : data.auc > 0.8 ? "#C9A961" : "#DC2626"} />
          <MetricRow label="分类准确率" value={data.accuracy.toString()} accent="#5E9A76" />
          <MetricRow label="特征数量" value="13 维" />
        </div>

        <div className="mt-6 pt-6 border-t border-forest-100">
          <h4 className="text-sm font-medium text-forest-700 mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            Top 5 关键环境因子
          </h4>
          <div className="space-y-2">
            {data.top_features.map((f: any, i: number) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-xs font-mono text-forest-400 w-4">#{i + 1}</span>
                <span className="text-xs text-forest-600 w-20">{f.name}</span>
                <div className="flex-1 h-2 bg-forest-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${f.importance * 100}%`, background: color }} />
                </div>
                <span className="text-xs font-mono text-forest-500 w-12 text-right">{(f.importance * 100).toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* 右: 分布热力图 */}
      <Card className="p-0 overflow-hidden lg:col-span-2">
        <div className="p-6 border-b border-forest-100">
          <h3 className="font-serif text-lg font-semibold text-forest-900">
            物种存在概率热力图 (预测输出)
          </h3>
          <p className="text-xs text-forest-500 mt-1">
            网格 {h.grid_size}×{h.grid_size} · 红=高概率栖息地 · 蓝=低概率
          </p>
        </div>
        <div className="relative p-6 bg-gradient-to-br from-sky-50 to-forest-50">
          <HeatmapGrid heatmap={h} species={species} color={color} />
        </div>
      </Card>
    </div>
  );
}

// ============ 热力图网格渲染 ============
function HeatmapGrid({ heatmap, species, color }: any) {
  const { values, lats, lngs } = heatmap;
  const size = values.length;
  const maxV = Math.max(...values.flat());
  const minV = Math.min(...values.flat());

  const colorScale = (v: number) => {
    const t = (v - minV) / (maxV - minV + 0.001);
    // 蓝→绿→黄→红
    const r = Math.round(30 + t * 225);
    const g = Math.round(30 + (1 - Math.abs(t - 0.5) * 2) * 200);
    const b = Math.round(80 + (1 - t) * 100);
    return `rgba(${r}, ${g}, ${b}, ${0.3 + t * 0.65})`;
  };

  return (
    <div className="relative">
      <div
        className="grid gap-0.5 rounded-lg overflow-hidden border border-forest-200"
        style={{
          gridTemplateColumns: `repeat(${size}, 1fr)`,
          aspectRatio: "1",
          maxWidth: 560,
          margin: "0 auto",
        }}
      >
        {values.flatMap((row: number[], i: number) =>
          row.map((v, j) => (
            <div
              key={`${i}-${j}`}
              title={`概率 ${(v * 100).toFixed(1)}% | Lat ${lats[i].toFixed(2)} | Lng ${lngs[j].toFixed(2)}`}
              style={{ background: colorScale(v) }}
              className="hover:ring-2 hover:ring-white transition-all cursor-pointer"
            />
          ))
        )}
      </div>
      {/* 图例 */}
      <div className="flex items-center justify-center gap-2 mt-4 text-xs text-forest-500">
        <span>低概率</span>
        <div className="h-2 w-32 rounded-full" style={{ background: "linear-gradient(to right, #1E40AF, #16A34A, #EAB308, #DC2626)" }} />
        <span>高概率 (适合栖息)</span>
      </div>
      <div className="text-center text-xs text-forest-400 mt-2">
        {species} · 预测范围 {heatmap.lat_min.toFixed(1)}°~{heatmap.lat_max.toFixed(1)}°N, {heatmap.lng_min.toFixed(1)}°~{heatmap.lng_max.toFixed(1)}°E
      </div>
    </div>
  );
}

// ============ 时序预测视图 ============
function ForecastView({ data, species }: { data: any; species: string }) {
  const color = SPECIES_COLORS[species] || "#1B5E3F";
  const trendColor = data.trend_direction === "上升" ? "#16A34A" : data.trend_direction === "下降" ? "#DC2626" : "#64748B";

  // 合并历史 + 预测到一个连续序列
  const history = data.history || [];
  const forecast = data.forecast || [];
  const lastHistDate = history.length ? new Date(history[history.length - 1].date) : new Date();
  const combined = [
    ...history.map((h: any) => ({ date: h.date, count: h.count, type: "历史" })),
    ...forecast.map((f: any, i: number) => {
      const d = new Date(lastHistDate);
      d.setDate(d.getDate() + i * 7);
      return { date: d.toISOString().slice(0, 10), count: f.predicted, type: "预测" };
    }),
  ];

  return (
    <div className="grid lg:grid-cols-3 gap-5">
      <Card className="p-6 lg:col-span-2">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-serif text-lg font-semibold text-forest-900">
            {species} · 观察趋势 + 12 周预测
          </h3>
          <div className="flex gap-2 text-xs">
            <span className="flex items-center gap-1"><span className="w-3 h-1 bg-forest-600" /> 历史</span>
            <span className="flex items-center gap-1"><span className="w-3 h-1 bg-amber-500" /> 预测</span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={combined} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id={`g-${species}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.4} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#DDEBE0" />
            <XAxis dataKey="date" stroke="#5E9A76" fontSize={11} tick={{ fontSize: 10 }} />
            <YAxis stroke="#5E9A76" fontSize={12} allowDecimals={false} />
            <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #DDEBE0" }} />
            <Area
              type="monotone" dataKey="count" stroke={color} strokeWidth={2.5}
              fillOpacity={1} fill={`url(#g-${species})`}
              dot={false}
              activeDot={{ r: 5 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Radar className="w-5 h-5 text-forest-600" />
          <h3 className="font-serif text-lg font-semibold text-forest-900">趋势洞察</h3>
        </div>

        <div className={`p-4 rounded-xl mb-4 ${data.trend_direction === "上升" ? "bg-green-50" : data.trend_direction === "下降" ? "bg-red-50" : "bg-forest-50"}`}>
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className={`w-4 h-4`} style={{ color: trendColor }} />
            <span className="font-semibold text-sm" style={{ color: trendColor }}>
              {data.trend_direction}趋势
            </span>
          </div>
          <p className="text-2xl font-serif font-semibold" style={{ color: trendColor }}>
            {data.trend_pct > 0 ? "+" : ""}{data.trend_pct}%
          </p>
          <p className="text-xs text-forest-500 mt-1">近 4 周 vs 上 4 周</p>
        </div>

        <div className="space-y-3">
          <h4 className="text-sm font-medium text-forest-700 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            异常检测 ({data.anomaly_count} 个)
          </h4>
          {data.anomalies?.slice(0, 5).map((a: any, i: number) => (
            <div key={i} className="flex items-center gap-2 text-xs p-2 rounded-lg bg-amber-50 border border-amber-100">
              <AlertCircle className={`w-3.5 h-3.5 ${a.severity === "high" ? "text-red-500" : "text-amber-500"}`} />
              <div className="flex-1">
                <span className="font-medium text-forest-800">{a.date}</span>
                <span className="text-forest-500 ml-2">观察 {a.actual} 次 (预期 {a.expected})</span>
              </div>
            </div>
          ))}
          {(!data.anomalies || data.anomalies.length === 0) && (
            <p className="text-xs text-forest-500 flex items-center gap-2">
              <CheckCircle className="w-3.5 h-3.5 text-green-500" /> 该时期无显著异常
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}

// ============ 热点检测视图 ============
function HotspotView({ data, species }: { data: any; species: string }) {
  const color = SPECIES_COLORS[species] || "#1B5E3F";
  const clusterPoints: MapPoint[] = (data.clusters || []).map((c: any, i: number) => ({
    id: i, lat: c.center_lat, lng: c.center_lng, color,
    title: `热点集群 ${c.cluster_id + 1}`,
    subtitle: `${c.count} 个观察点`,
    extra: `半径 ${c.radius_km} km`,
    size: 4 + Math.min(c.count / 5, 10),
  }));

  return (
    <div className="grid lg:grid-cols-3 gap-5">
      <Card className="p-6 lg:col-span-2">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-serif text-lg font-semibold text-forest-900">
              {species} · 时空热点聚类
            </h3>
            <p className="text-xs text-forest-500 mt-1">
              DBSCAN 算法 · eps=0.5° · 至少 5 个点构成集群
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-serif font-semibold text-forest-800">{data.n_clusters}</p>
            <p className="text-xs text-forest-500">活跃热点区域</p>
          </div>
        </div>
        <GlobalMap points={clusterPoints} height={380} world />
      </Card>

      <Card className="p-6">
        <h3 className="font-serif text-lg font-semibold text-forest-900 mb-4">热点详情</h3>
        <div className="space-y-3">
          {(data.clusters || []).map((c: any, i: number) => (
            <div key={i} className="p-3 rounded-xl border border-forest-100 bg-forest-50/50">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: color }}>
                    {c.cluster_id + 1}
                  </div>
                  <span className="font-medium text-sm text-forest-800">集群 {c.cluster_id + 1}</span>
                </div>
                <span className="text-sm font-semibold text-forest-700">{c.count} 点</span>
              </div>
              <div className="text-xs text-forest-500 space-y-0.5 font-mono">
                <div>中心: {c.center_lat.toFixed(3)}°N, {c.center_lng.toFixed(3)}°E</div>
                <div>半径: {c.radius_km} km</div>
              </div>
            </div>
          ))}
          {(!data.clusters || data.clusters.length === 0) && (
            <p className="text-sm text-forest-500">未检测到显著热点集群。</p>
          )}
        </div>

        <div className="mt-6 pt-6 border-t border-forest-100">
          <h4 className="text-sm font-medium text-forest-700 mb-3">时间变化趋势</h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-red-50">
              <p className="text-xs text-red-600 mb-1">2024 年及以前</p>
              <p className="text-xl font-serif font-semibold text-red-700">{data.before_count}</p>
            </div>
            <div className="p-3 rounded-lg bg-green-50">
              <p className="text-xs text-green-600 mb-1">2025 年及以后</p>
              <p className="text-xl font-serif font-semibold text-green-700">{data.after_count}</p>
            </div>
          </div>
          <div className="mt-3 text-center">
            <span className="text-xs text-forest-500">变化率 </span>
            <span className={`text-sm font-semibold ${data.growth_rate > 0 ? "text-green-600" : "text-red-600"}`}>
              {data.growth_rate > 0 ? "+" : ""}{data.growth_rate}%
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ============ 环境因子关联视图 ============
function ClimateView({ data, species }: { data: any; species: string }) {
  const color = SPECIES_COLORS[species] || "#1B5E3F";

  const featureIcons: Record<string, any> = {
    bio1: <Thermometer className="w-4 h-4" />,
    bio4: <Activity className="w-4 h-4" />,
    bio12: <Droplet className="w-4 h-4" />,
    elevation: <Mountain className="w-4 h-4" />,
    ndvi: <Leaf className="w-4 h-4" />,
    forest_pct: <Trees className="w-4 h-4" />,
    wetland_pct: <Droplet className="w-4 h-4" />,
    human_impact: <AlertTriangle className="w-4 h-4" />,
  };

  return (
    <div className="grid lg:grid-cols-2 gap-5">
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-amber-500" />
          <h3 className="font-serif text-lg font-semibold text-forest-900">
            {species} · 生态位解释
          </h3>
        </div>

        <div className="p-5 rounded-xl mb-4" style={{ background: `${color}10`, border: `1px solid ${color}30` }}>
          <p className="text-sm text-forest-800 leading-relaxed">
            {data.interpretation}
          </p>
        </div>

        <div className="space-y-4">
          <InsightRow
            icon={<Brain className="w-4 h-4" />}
            label="模型 A"
            value={data.model_auc.toFixed(3)}
            hint="AUC → 越高越能区分存在/不存在"
          />
          <InsightRow
            icon={<Leaf className="w-4 h-4" />}
            label="生态位宽度"
            value={data.niche_breadth}
            hint="广布种: 适应多种环境 · 狭域种: 栖息地专一"
          />
          <InsightRow
            icon={<Thermometer className="w-4 h-4" />}
            label="主要驱动因子"
            value={data.top_driver}
            hint={`重要性 ${(data.top_driver_importance * 100).toFixed(1)}%`}
          />
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="font-serif text-lg font-semibold text-forest-900 mb-4">
          综合驱动因子排名
        </h3>
        <p className="text-xs text-forest-500 mb-5">
          基于 XGBoost 模型特征重要性分析，权重总和为 100%
        </p>
        <div className="space-y-3">
          {data.primary_drivers.map((d: string, i: number) => {
            // 从 "bio12 (重要性 23.4%)" 提取
            const m = d.match(/(.+?)\s*\(.*?([\d.]+)%/);
            const name = m?.[1].trim() || d;
            const pct = parseFloat(m?.[2] || "0");
            return (
              <div key={i} className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${i === 0 ? "bg-amber-500 text-white" : i === 1 ? "bg-forest-500 text-white" : "bg-forest-100 text-forest-600"}`}>
                  {featureIcons[name] || <Activity className="w-4 h-4" />}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-forest-800">{name}</span>
                    <span className="text-xs font-mono text-forest-600">{pct.toFixed(1)}%</span>
                  </div>
                  <div className="h-2 bg-forest-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${Math.min(pct * 3, 100)}%`, background: color }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 p-4 rounded-xl bg-forest-50 border border-forest-100">
          <h4 className="text-xs font-medium text-forest-600 mb-2 flex items-center gap-1">
            <ChevronRight className="w-3 h-3" />
            建议解读
          </h4>
          <ul className="text-xs text-forest-600 space-y-1 leading-relaxed">
            <li>• 若<b>bio12 (年降水)</b> 排第一 → 该物种对水源依赖强，保护策略需优先关注湿地</li>
            <li>• 若<b>human_impact</b> 排第一 → 该物种受人类活动干扰显著，需要建立生态缓冲区</li>
            <li>• 若<b>elevation</b> 排第一 → 该物种有特定海拔偏好，需保护垂直带谱完整性</li>
          </ul>
        </div>
      </Card>
    </div>
  );
}

// ============ 小工具组件 ============
function MetricRow({ label, value, accent = "#1B5E3F" }: { label: string; value: string; accent?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-forest-500">{label}</span>
      <span className="font-mono text-sm font-semibold" style={{ color: accent }}>{value}</span>
    </div>
  );
}

function InsightRow({ icon, label, value, hint }: any) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-forest-100 text-forest-600 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="flex-1">
        <div className="flex justify-between items-baseline">
          <span className="text-xs text-forest-500">{label}</span>
          <span className="font-semibold text-sm text-forest-800">{value}</span>
        </div>
        <p className="text-xs text-forest-400 mt-0.5">{hint}</p>
      </div>
    </div>
  );
}

// ============ AI 自动报告 ============
function AIReportView({ species, llmStatus, loading, content, onGenerate }: any) {
  const reportAvailable = content && !content.startsWith("⚠️");

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-forest-600" />
          <h3 className="font-serif text-lg font-semibold text-forest-900">
            {species} · AI 自动分析报告
          </h3>
          <span className="text-xs px-2 py-0.5 rounded-full bg-moss-100 text-forest-700 font-medium border border-moss-200">
            {llmStatus?.model || "Spark-X"}
          </span>
        </div>
        <button
          onClick={onGenerate} disabled={loading || !llmStatus?.configured}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-forest-600 to-moss-500 text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-all shadow-soft"
        >
          {loading ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          {loading ? "正在分析..." : "一键生成报告"}
        </button>
      </div>

      {!llmStatus?.configured && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 mb-4">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800">
              <p className="font-medium mb-1">LLM 功能需要配置 API Key</p>
              <p className="text-xs text-amber-700">
                在服务器端设置环境变量 <code className="bg-amber-100 px-1 rounded">SPARK_API_KEY</code>
                后重启。当前 Key 未激活，可先在讯飞开放平台领取免费额度。
              </p>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="p-12 text-center">
          <RefreshCw className="w-8 h-8 text-forest-400 animate-spin mx-auto mb-3" />
          <p className="text-forest-500">大模型正在分析 ML 结果并撰写报告...</p>
          <p className="text-xs text-forest-400 mt-2">预计 15-30 秒</p>
        </div>
      )}

      {!loading && content && (
        <div className="prose prose-sm max-w-none">
          {reportAvailable ? (
            <MarkdownRender content={content} />
          ) : (
            <pre className="whitespace-pre-wrap text-sm text-amber-700 bg-amber-50 p-4 rounded-lg border border-amber-200 font-sans leading-relaxed">
              {content}
            </pre>
          )}
        </div>
      )}

      {!loading && !content && (
        <div className="p-12 text-center border-2 border-dashed border-forest-200 rounded-xl">
          <Sparkles className="w-10 h-10 text-forest-300 mx-auto mb-3" />
          <p className="text-forest-500 mb-2">点击上方按钮，大模型会基于 4 个 ML 模块的分析结果</p>
          <p className="text-forest-500">自动生成一份 Markdown 格式的物种分析简报</p>
        </div>
      )}
    </Card>
  );
}

// 极简 Markdown 渲染（不引第三方依赖）
function MarkdownRender({ content }: { content: string }) {
  const lines = content.split("\n");
  const elements: any[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith("### ")) {
      elements.push(<h3 key={i} className="font-serif text-base font-semibold text-forest-800 mt-4 mb-2">{line.slice(4)}</h3>);
    } else if (line.startsWith("## ")) {
      elements.push(<h2 key={i} className="font-serif text-lg font-semibold text-forest-900 mt-5 mb-2">{line.slice(3)}</h2>);
    } else if (line.startsWith("# ")) {
      elements.push(<h1 key={i} className="font-serif text-xl font-semibold text-forest-900 mt-6 mb-3 pb-2 border-b border-forest-200">{line.slice(2)}</h1>);
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      const items: string[] = [];
      while (i < lines.length && (lines[i].startsWith("- ") || lines[i].startsWith("* "))) {
        items.push(lines[i].slice(2));
        i++;
      }
      elements.push(
        <ul key={"ul-" + i} className="list-disc pl-6 my-2 space-y-1">
          {items.map((t, j) => (
            <li key={j} className="text-sm text-forest-700">{renderInline(t)}</li>
          ))}
        </ul>
      );
      continue;
    } else if (/^\d+\.\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s/, ""));
        i++;
      }
      elements.push(
        <ol key={"ol-" + i} className="list-decimal pl-6 my-2 space-y-1">
          {items.map((t, j) => (
            <li key={j} className="text-sm text-forest-700">{renderInline(t)}</li>
          ))}
        </ol>
      );
      continue;
    } else if (line.trim() === "") {
      elements.push(<div key={"e-" + i} className="h-2" />);
    } else {
      elements.push(<p key={i} className="text-sm text-forest-700 leading-relaxed">{renderInline(line)}</p>);
    }
    i++;
  }

  return <div className="space-y-1">{elements}</div>;
}

function renderInline(text: string) {
  // **bold** 和 *italic*
  const parts: any[] = [];
  const regex = /\*\*(.+?)\*\*|\*(.+?)\*/g;
  let lastIdx = 0;
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIdx) parts.push(text.slice(lastIdx, match.index));
    if (match[1]) parts.push(<strong key={match.index} className="font-semibold text-forest-900">{match[1]}</strong>);
    else if (match[2]) parts.push(<em key={match.index} className="italic text-forest-800">{match[2]}</em>);
    lastIdx = regex.lastIndex;
  }
  if (lastIdx < text.length) parts.push(text.slice(lastIdx));
  return parts.length ? parts : text;
}

// ============ CNN 图片物种识别 ============
function IdentifyView({ loading, result, previewImage, onPick, onDrop, onClear, imageInputRef, onFileChange }: any) {
  return (
    <div className="grid lg:grid-cols-2 gap-5">
      {/* 左: 上传区域 */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Upload className="w-5 h-5 text-forest-600" />
          <h3 className="font-serif text-lg font-semibold text-forest-900">
            上传动物照片
          </h3>
        </div>
        <p className="text-xs text-forest-500 mb-4">
          基于 TensorFlow.js + MobileNetV2 在浏览器端实时推理（纯前端，不上传服务器）
        </p>

        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onFileChange}
        />

        {!previewImage ? (
          <div
            onClick={onPick}
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDrop}
            className="border-2 border-dashed border-forest-300 rounded-xl p-12 text-center cursor-pointer hover:border-forest-500 hover:bg-forest-50/50 transition-colors"
          >
            <Camera className="w-12 h-12 text-forest-300 mx-auto mb-3" />
            <p className="text-forest-600 font-medium mb-1">点击选择或拖拽图片到这里</p>
            <p className="text-xs text-forest-400">支持 JPG / PNG / WEBP · 建议清晰的动物特写</p>
          </div>
        ) : (
          <div className="relative">
            <img src={previewImage} alt="预览" className="w-full rounded-xl border border-forest-200" />
            <button
              onClick={onClear}
              className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </Card>

      {/* 右: 识别结果 */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Search className="w-5 h-5 text-forest-600" />
          <h3 className="font-serif text-lg font-semibold text-forest-900">
            识别结果
          </h3>
        </div>

        {loading && (
          <div className="p-12 text-center">
            <RefreshCw className="w-8 h-8 text-forest-400 animate-spin mx-auto mb-3" />
            <p className="text-forest-500">正在加载 MobileNet 模型（首次约 5MB）...</p>
            <p className="text-xs text-forest-400 mt-2">下载模型中，首次加载需要几秒</p>
          </div>
        )}

        {!loading && result?.error && (
          <div className="p-4 rounded-lg bg-red-50 border border-red-200">
            <p className="text-sm text-red-700">⚠️ {result.error}</p>
          </div>
        )}

        {!loading && result && !result.error && (
          <div className="space-y-5">
            {/* 最佳匹配到我们物种库 */}
            {result.bestMatch ? (
              <div className="p-5 rounded-xl bg-gradient-to-br from-forest-50 to-moss-50 border border-forest-200">
                <p className="text-xs text-forest-500 mb-1">🎯 匹配到物种库</p>
                <p className="text-2xl font-serif font-semibold text-forest-900 mb-1">
                  {result.bestMatch.species}
                </p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-white rounded-full overflow-hidden">
                    <div
                      className="h-full bg-forest-600 rounded-full"
                      style={{ width: `${result.bestMatch.confidence * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-forest-700">
                    {(result.bestMatch.confidence * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
                <p className="text-sm text-amber-800">
                  图片识别结果未匹配到我们监测的 6 个物种。但下面有 MobileNet 的完整 Top-5 预测供参考。
                </p>
              </div>
            )}

            {/* Top 5 原始预测 */}
            <div>
              <p className="text-xs text-forest-500 mb-2 font-medium">MobileNet Top-5 预测</p>
              <div className="space-y-2">
                {result.top5.map((p: any, i: number) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${i === 0 ? "bg-amber-400 text-white" : "bg-forest-100 text-forest-600"}`}>
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-forest-800 truncate">{p.className}</p>
                      <div className="h-1.5 bg-forest-100 rounded-full overflow-hidden mt-1">
                        <div className="h-full bg-forest-500 rounded-full" style={{ width: `${p.probability * 100}%` }} />
                      </div>
                    </div>
                    <span className="text-xs font-mono text-forest-600 w-12 text-right">
                      {(p.probability * 100).toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* 说明 */}
            <div className="text-xs text-forest-400 leading-relaxed p-3 bg-forest-50 rounded-lg">
              💡 MobileNet 是在 ImageNet 1000 类上训练的通用模型。对于濒危物种（如东北虎、丹顶鹤），
              建议用领域特定数据集微调的专用分类器以获得更高准确率。
              我们也可以基于爬虫采集的照片进一步训练专属 CNN 模型。
            </div>
          </div>
        )}

        {!loading && !result && (
          <div className="p-12 text-center border-2 border-dashed border-forest-200 rounded-xl">
            <Search className="w-10 h-10 text-forest-300 mx-auto mb-3" />
            <p className="text-forest-500">上传一张动物照片开始识别</p>
          </div>
        )}
      </Card>
    </div>
  );
}

// ============================================================
// EHI 生态健康指数视图
// ============================================================
function EHIView({ data, species }: { data?: Record<string, any>; species: string }) {
  if (!data) return null;

  const speciesList = Object.keys(data);
  const current = data[species] || data[speciesList[0]];
  if (!current) return null;

  const { ehi_score, grade, status, scores, weakest_name, recommendation } = current;

  // 评级颜色
  const gradeColor: Record<string, string> = {
    A: "#16A34A", B: "#C9A961", C: "#EA580C", D: "#DC2626",
  };
  const gradeBg: Record<string, string> = {
    A: "bg-green-50 border-green-200", B: "bg-amber-50 border-amber-200",
    C: "bg-orange-50 border-orange-200", D: "bg-red-50 border-red-200",
  };
  const gradeText: Record<string, string> = {
    A: "text-green-700", B: "text-amber-700", C: "text-orange-700", D: "text-red-700",
  };

  // 雷达图数据
  const radarData = [
    { dim: "种群趋势", score: scores.trend, full: 100 },
    { dim: "分布适宜", score: scores.suitability, full: 100 },
    { dim: "栖息地完整", score: scores.habitat, full: 100 },
    { dim: "环境威胁", score: scores.threat, full: 100 },
  ];

  return (
    <div className="space-y-5">
      {/* 所有物种对比条 */}
      <Card className="p-6">
        <h3 className="font-serif text-lg font-semibold text-forest-900 mb-4">
          📊 所有物种生态健康指数对比
        </h3>
        <div className="space-y-3">
          {speciesList.map((sp) => {
            const d = data[sp];
            const c = gradeColor[d.grade] || "#5E9A76";
            return (
              <div key={sp} className="flex items-center gap-4">
                <span className="text-sm font-medium text-forest-800 w-28 shrink-0">{sp}</span>
                <div className="flex-1 h-6 bg-forest-100 rounded-full overflow-hidden relative">
                  <div className="h-full rounded-full transition-all" style={{ width: `${d.ehi_score}%`, background: c }} />
                  <span className="absolute inset-0 flex items-center justify-end pr-3 text-xs font-bold text-white drop-shadow">
                    {d.ehi_score}
                  </span>
                </div>
                <span className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-lg shrink-0`} style={{ background: c }}>
                  {d.grade}
                </span>
              </div>
            );
          })}
        </div>
      </Card>

      {/* 当前物种详情 */}
      <div className="grid lg:grid-cols-3 gap-5">
        {/* 左: 大分数 + 评级 */}
        <Card className={`p-6 border-2 ${gradeBg[grade]}`}>
          <p className="text-sm text-forest-500 mb-2">{species} · 生态健康指数</p>
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="text-7xl font-serif font-bold" style={{ color: gradeColor[grade] }}>
                {ehi_score}
              </div>
              <p className="text-xs text-forest-400 mt-1">满分 100</p>
            </div>
            <div>
              <div className={`text-5xl font-serif font-bold ${gradeText[grade]}`}>{grade}</div>
              <p className={`text-sm ${gradeText[grade]} mt-1`}>{status}</p>
            </div>
          </div>
          <div className="mt-4 p-3 rounded-lg bg-white/60 border border-white">
            <div className="flex items-center gap-2 text-sm text-forest-700">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
              <span><b>主要短板：</b>{weakest_name}</span>
            </div>
          </div>
        </Card>

        {/* 中: 雷达图 */}
        <Card className="p-6">
          <h3 className="font-serif text-base font-semibold text-forest-900 mb-3">
            四维雷达图
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#BBD7C2" />
              <PolarAngleAxis dataKey="dim" tick={{ fontSize: 12, fill: "#1B5E3F" }} />
              <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10 }} />
              <RechartsRadar name="得分" dataKey="score" stroke="#1B5E3F" fill="#3D7E57" fillOpacity={0.5} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </Card>

        {/* 右: 四维度分数条 */}
        <Card className="p-6">
          <h3 className="font-serif text-base font-semibold text-forest-900 mb-3">
            各维度得分
          </h3>
          <div className="space-y-4">
            {[
              { k: "trend", name: "种群趋势", icon: TrendingUp, w: "权重 30%" },
              { k: "suitability", name: "分布适宜", icon: MapPin, w: "权重 25%" },
              { k: "habitat", name: "栖息地完整", icon: Shield, w: "权重 25%" },
              { k: "threat", name: "环境威胁", icon: AlertTriangle, w: "权重 20%" },
            ].map(({ k, name, icon: Icon, w }) => {
              const v = scores[k];
              const color = v >= 70 ? "#16A34A" : v >= 50 ? "#C9A961" : "#DC2626";
              return (
                <div key={k}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <Icon className="w-3.5 h-3.5 text-forest-500" />
                      <span className="text-xs text-forest-700 font-medium">{name}</span>
                    </div>
                    <span className="text-xs text-forest-400">{w}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2.5 bg-forest-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${v}%`, background: color }} />
                    </div>
                    <span className="text-sm font-serif font-bold w-10 text-right" style={{ color }}>{v}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* 保护建议 */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-5 h-5 text-forest-600" />
          <h3 className="font-serif text-lg font-semibold text-forest-900">
            针对性保护建议
          </h3>
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          {recommendation.map((rec: string, i: number) => (
            <div key={i} className="p-4 rounded-xl bg-forest-50 border border-forest-100 flex gap-3">
              <span className="w-6 h-6 rounded-full bg-forest-700 text-white text-xs font-bold flex items-center justify-center shrink-0">
                {i + 1}
              </span>
              <p className="text-sm text-forest-700 leading-relaxed">{rec}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ============================================================
// 模型可解释性视图
// ============================================================
function InterpretView({ data, species }: { data: any; species: string }) {
  const color = SPECIES_COLORS[species] || "#1B5E3F";
  const perm = data.permutation_importance || [];
  const pdp = data.partial_dependence || {};
  const local = data.local_explanations || [];

  const [selectedLocal, setSelectedLocal] = useState(0);
  const currentLocal = local[selectedLocal];

  return (
    <div className="grid lg:grid-cols-2 gap-5">
      {/* 左: Permutation Importance */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Microscope className="w-5 h-5 text-forest-600" />
          <h3 className="font-serif text-lg font-semibold text-forest-900">
            Permutation Importance
          </h3>
        </div>
        <p className="text-xs text-forest-500 mb-4">
          打乱每个特征后模型 AUC 的下降量，下降越多说明该特征越重要（比原生 feature_importance 更稳健）
        </p>
        <div className="space-y-2">
          {perm.slice(0, 8).map((f: any, i: number) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-xs font-mono text-forest-400 w-16">{f.name}</span>
              <div className="flex-1 h-4 bg-forest-100 rounded overflow-hidden relative">
                <div className="h-full rounded" style={{ width: `${Math.min(f.importance * 300, 100)}%`, background: color }} />
              </div>
              <span className="text-xs font-mono text-forest-600 w-14 text-right">
                {f.importance.toFixed(3)} ± {f.std.toFixed(3)}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* 右: PDP 边际效应曲线 */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-5 h-5 text-forest-600" />
          <h3 className="font-serif text-lg font-semibold text-forest-900">
            Partial Dependence 边际效应
          </h3>
        </div>
        <p className="text-xs text-forest-500 mb-4">
          单个环境因子变化时，模型预测的物种存在概率如何变化（响应曲线）
        </p>
        <div className="space-y-3">
          {Object.entries(pdp).slice(0, 4).map(([feat, vals]: [string, any]) => (
            <div key={feat} className="border border-forest-100 rounded-lg p-3">
              <p className="text-xs font-medium text-forest-700 mb-2">{feat}</p>
              <ResponsiveContainer width="100%" height={70}>
                <AreaChart data={vals.x.map((x: number, i: number) => ({ x, y: vals.y[i] }))}>
                  <defs>
                    <linearGradient id={`pdp-${feat}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={color} stopOpacity={0.4} />
                      <stop offset="95%" stopColor={color} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="y" stroke={color} strokeWidth={2} fill={`url(#pdp-${feat})`} dot={false} />
                  <XAxis dataKey="x" hide />
                  <YAxis hide domain={["dataMin", "dataMax"]} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ))}
        </div>
      </Card>

      {/* 下: 局部解释 (单个观察点的特征贡献) */}
      <Card className="p-6 lg:col-span-2">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-amber-500" />
            <h3 className="font-serif text-lg font-semibold text-forest-900">
              局部解释：为什么这个观察点被预测为"有物种"
            </h3>
          </div>
          {local.length > 1 && (
            <select
              value={selectedLocal}
              onChange={(e) => setSelectedLocal(Number(e.target.value))}
              className="text-xs border border-forest-200 rounded-lg px-3 py-1.5 bg-white text-forest-700"
            >
              {local.map((_: any, i: number) => (
                <option key={i} value={i}>观察点 #{i + 1} ({local[i].lat}, {local[i].lng})</option>
              ))}
            </select>
          )}
        </div>

        {currentLocal && (
          <div>
            <div className="flex items-center gap-4 mb-4 text-sm">
              <span className="text-forest-500">预测存在概率：</span>
              <span className="font-serif text-2xl font-bold" style={{ color }}>{(currentLocal.predicted_prob * 100).toFixed(1)}%</span>
              <span className="text-forest-400">| 位置：{currentLocal.lat}°N, {currentLocal.lng}°E</span>
            </div>
            <p className="text-xs text-forest-500 mb-3">
              各特征对该预测的贡献（正贡献=推高概率，负贡献=拉低概率）：
            </p>
            <div className="space-y-2">
              {currentLocal.top_contributors.map((c: any, i: number) => {
                const isPos = c.contribution > 0;
                return (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xs font-mono text-forest-400 w-24 shrink-0">{c.feature}</span>
                    <span className="text-xs text-forest-500 w-20 shrink-0">= {c.actual_value}</span>
                    <div className="flex-1 flex items-center gap-2">
                      <div className="flex-1 flex justify-end h-5">
                        {!isPos && (
                          <div className="h-full rounded-l" style={{ width: `${Math.min(Math.abs(c.contribution) * 2000, 50)}%`, background: "#DC2626" }} />
                        )}
                      </div>
                      <div className="w-1 h-5 bg-forest-300" />
                      <div className="flex-1 h-5">
                        {isPos && (
                          <div className="h-full rounded-r" style={{ width: `${Math.min(c.contribution * 2000, 50)}%`, background: "#16A34A" }} />
                        )}
                      </div>
                    </div>
                    <span className={`text-xs font-mono w-16 text-right ${isPos ? "text-green-600" : "text-red-600"}`}>
                      {isPos ? "+" : ""}{c.contribution.toFixed(3)}
                    </span>
                    <span className={`text-xs w-12 ${isPos ? "text-green-600" : "text-red-600"}`}>{c.direction}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

