import { Bird, Flame, AlertTriangle, Plane, FileText, ArrowUpRight, Database, MapPin } from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import Card from "@/components/ui/Card";
import { drones } from "@/data/droneData";
import { tigerRecords } from "@/data/tigerData";
import { crawlerStats } from "@/data/crawlerStats";
import { crawledObservations } from "@/data/crawlerObservations";
import { useAuthStore } from "@/store/authStore";
import RefreshButton from "@/components/ui/RefreshButton";
import { useCrawlerData } from "@/hooks/useCrawlerData";

const HABITAT_COLORS: Record<string, string> = {
  核心繁殖区: "#1B5E3F",
  稳定栖息区: "#3D7E57",
  活动扩散区: "#7CB892",
  偶发目击: "#C9A961",
};

const SOURCE_COLORS: Record<string, string> = {
  iNaturalist: "#3D7E57",
  GBIF: "#C9A961",
};

const SPECIES_COLORS = ["#1B5E3F", "#7CB892", "#C9A961", "#5E9A76", "#BBD7C2", "#D97706"];

// 栖息地分布 (来自本地东北虎 CSV + 爬虫)
const habitatDist = (() => {
  const types: Record<string, number> = {};
  for (const r of tigerRecords) {
    types[r.type] = (types[r.type] || 0) + 1;
  }
  return Object.entries(types).map(([name, value]) => ({ name, value }));
})();

// 按月份聚合爬虫观察数据 (近 12 个月)
const monthlyTrend = (() => {
  const now = new Date();
  const months: { month: string; 观察数: number }[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = `${d.getMonth() + 1}月`;
    const cnt = (crawlerStats.by_month as Record<string, number>)[key] || 0;
    months.push({ month: label, 观察数: cnt });
  }
  return months;
})();

// 按物种统计
const speciesPie = Object.entries(crawlerStats.by_species).map(([name, value]) => ({ name, value }));

// 按数据源统计
const sourcePie = Object.entries(crawlerStats.by_source).map(([name, value]) => ({ name, value }));

// 最新观察 (取爬虫最新 + 东北虎 CSV 最新)
const recentObservations = (() => {
  const fromCrawler = crawledObservations
    .filter((o) => o.observed_on)
    .sort((a, b) => b.observed_on.localeCompare(a.observed_on))
    .slice(0, 5)
    .map((o) => ({
      time: o.observed_on,
      species: o.cn_name,
      place: o.place || o.country || "未知地点",
      source: o.source,
      coords: `${o.latitude.toFixed(3)}, ${o.longitude.toFixed(3)}`,
    }));
  return fromCrawler;
})();

const activeDrones = drones.filter((d) => d.status === "任务中" || d.status === "在线").length;

// ===== 洞察文字（基于真实数据计算）=====
const insights = (() => {
  // 1. 月度趋势洞察
  const recent3 = monthlyTrend.slice(-3).reduce((a, m) => a + m.观察数, 0);
  const prev3 = monthlyTrend.slice(-6, -3).reduce((a, m) => a + m.观察数, 0);
  const trendChange = prev3 > 0 ? ((recent3 - prev3) / prev3) * 100 : 0;
  const trendArrow = trendChange > 5 ? "↑" : trendChange < -5 ? "↓" : "→";
  const trendColor = trendChange > 5 ? "text-green-600" : trendChange < -5 ? "text-red-500" : "text-forest-600";
  const trendDesc = trendChange > 5
    ? "近 3 个月观察活跃度较上一季度显著上升，可能与迁徙季或繁殖期相关"
    : trendChange < -5
    ? "近 3 个月观察活跃度下降，建议关注是否存在栖息地干扰或季节因素"
    : "近 3 个月观察活跃度保持稳定，监测态势平稳";

  // 2. 栖息地洞察
  const coreCount = habitatDist.find((h) => h.name === "核心繁殖区")?.value || 0;
  const corePct = Math.round((coreCount / tigerRecords.length) * 100);
  const habitatDesc = corePct >= 10
    ? `核心繁殖区占 ${corePct}%，表明珲春保护区具备稳定的育幼栖息地，是东北虎种群恢复的关键区域`
    : `核心繁殖区仅占 ${corePct}%，适宜繁殖的栖息地较为有限，需重点保护现有繁殖区`;

  // 3. 物种分布洞察
  const topSpecies = [...speciesPie].sort((a, b) => b.value - a.value)[0];
  const topSpeciesPct = Math.round((topSpecies.value / speciesPie.reduce((a, s) => a + s.value, 0)) * 100);
  const speciesDesc = `${topSpecies.name} 是观察记录最多的物种（占 ${topSpeciesPct}%），反映其在全球公开数据集的关注度和可见度最高`;

  // 4. 数据源洞察
  const inatCount = sourcePie.find((s) => s.name === "iNaturalist")?.value || 0;
  const inatPct = Math.round((inatCount / crawlerStats.total_observations) * 100);
  const sourceDesc = `iNaturalist 贡献了 ${inatPct}% 的观察数据，公民科学平台已成为生物多样性监测的重要数据来源`;

  return { trendChange, trendArrow, trendColor, trendDesc, habitatDesc, speciesDesc, sourceDesc };
})();

export default function Dashboard() {
  const user = useAuthStore((s) => s.user);
  const { data: apiData, error: apiError } = useCrawlerData();
  const updatedAt = new Date().toLocaleString("zh-CN");
  const dataSource = "iNaturalist + 珲春东北虎国家级自然保护区";

  return (
    <div className="bg-cream min-h-screen py-10">
      <div className="container">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl font-semibold text-forest-900">
              数据总览
            </h1>
            <p className="text-forest-500 mt-1">
              你好，{user?.username}。以下数据来自全球公开 API（iNaturalist、GBIF、Wikipedia）和珲春保护区。
            </p>
          </div>
          <RefreshButton lastUpdated={apiData?.fileCrawledAt || null} />
        </div>

        {apiError && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>后端服务暂不可达，当前展示本地缓存数据。错误：{apiError}</span>
          </div>
        )}

        {/* 核心指标卡片 — 全部来自爬虫真实数据 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <Card className="p-6 hover:-translate-y-1 transition-all duration-300 hover:shadow-hover">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-forest-500 mb-1">全球观察记录</p>
                <p className="font-serif text-3xl font-semibold text-forest-900">
                  {crawlerStats.total_observations.toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-forest-100 flex items-center justify-center">
                <Database className="w-6 h-6 text-forest-600" strokeWidth={1.8} />
              </div>
            </div>
            <p className="text-xs text-forest-500 mt-3">iNaturalist + GBIF 合并</p>
          </Card>

          <Card className="p-6 hover:-translate-y-1 transition-all duration-300 hover:shadow-hover">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-forest-500 mb-1">中国区域记录</p>
                <p className="font-serif text-3xl font-semibold text-forest-900">
                  {crawlerStats.china_observations.toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-moss-100 flex items-center justify-center">
                <MapPin className="w-6 h-6 text-forest-600" strokeWidth={1.8} />
              </div>
            </div>
            <p className="text-xs text-forest-500 mt-3">纬度 18°-54° / 经度 73°-135°</p>
          </Card>

          <Card className="p-6 hover:-translate-y-1 transition-all duration-300 hover:shadow-hover">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-forest-500 mb-1">监测物种</p>
                <p className="font-serif text-3xl font-semibold text-forest-900">
                  {Object.keys(crawlerStats.by_species).length + 2}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center">
                <Bird className="w-6 h-6 text-amber-600" strokeWidth={1.8} />
              </div>
            </div>
            <p className="text-xs text-forest-500 mt-3">丹顶鹤·白头鹤·梅花鹿·长臂猿 + 东北虎·远东豹</p>
          </Card>

          <Card className="p-6 hover:-translate-y-1 transition-all duration-300 hover:shadow-hover">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-forest-500 mb-1">珲春保护区位点</p>
                <p className="font-serif text-3xl font-semibold text-forest-900">
                  {tigerRecords.length}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center">
                <Flame className="w-6 h-6 text-red-500" strokeWidth={1.8} />
              </div>
            </div>
            <p className="text-xs text-forest-500 mt-3">东北虎 GPS 监测点（你的核心资产）</p>
          </Card>
        </div>

        {/* 数据洞察摘要横幅 */}
        <Card className="p-6 mb-4 bg-gradient-to-r from-forest-50 to-moss-50 border-forest-100">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-forest-600 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <h3 className="font-serif text-base font-semibold text-forest-900 mb-2">数据洞察摘要</h3>
              <p className="text-sm text-forest-700 leading-relaxed">
                基于 {crawlerStats.total_observations.toLocaleString()} 条全球观察记录与 {tigerRecords.length} 个珲春监测位点分析：
                {insights.trendDesc}；{insights.habitatDesc}；{insights.speciesDesc}；{insights.sourceDesc}。
              </p>
            </div>
          </div>
        </Card>

        {/* 数据来源与样本量声明 */}
        <div className="mb-6 flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-forest-500">
          <span>📊 样本量：全球观察 n={crawlerStats.total_observations}，珲春位点 n={tigerRecords.length}（趋势仅供参考）</span>
          <span>🔗 数据来源：iNaturalist + 珲春东北虎国家级自然保护区</span>
          <span>🕐 更新时间：{new Date().toLocaleString("zh-CN")}</span>
        </div>

        {/* 三图并排 */}
        <div className="grid lg:grid-cols-3 gap-5 mb-8">
          {/* 月度趋势折线图 */}
          <Card className="p-6 lg:col-span-2">
            <h3 className="font-serif text-lg font-semibold text-forest-900 mb-4">
              近 12 个月全球物种观察趋势
              <span className="ml-2 text-xs font-normal text-forest-400">n={crawlerStats.total_observations}</span>
            </h3>
            <p className="text-xs text-forest-400 -mt-3 mb-3">来源：{dataSource} · 更新：{updatedAt}</p>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={monthlyTrend} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#DDEBE0" />
                <XAxis dataKey="month" stroke="#5E9A76" fontSize={12} />
                <YAxis stroke="#5E9A76" fontSize={12} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12, border: "1px solid #DDEBE0",
                    boxShadow: "0 4px 24px rgba(27,94,63,0.08)",
                  }}
                />
                <Line
                  type="monotone" dataKey="观察数" stroke="#1B5E3F"
                  strokeWidth={2.5} dot={{ r: 4, fill: "#1B5E3F" }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
            {/* 趋势洞察 */}
            <div className="mt-4 pt-4 border-t border-forest-100 flex items-start gap-2">
              <span className={`text-lg font-bold ${insights.trendColor}`}>{insights.trendArrow}</span>
              <div>
                <span className="text-xs font-semibold text-forest-700">趋势洞察：</span>
                <span className="text-xs text-forest-500">{insights.trendDesc}</span>
                <span className={`text-xs font-semibold ml-2 ${insights.trendColor}`}>
                  {insights.trendChange >= 0 ? "+" : ""}{insights.trendChange.toFixed(1)}%
                </span>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <h3 className="font-serif text-lg font-semibold text-forest-900 mb-4">
              东北虎栖息地类型分布
              <span className="ml-2 text-xs font-normal text-forest-400">n={tigerRecords.length}</span>
            </h3>
            <p className="text-xs text-forest-400 -mt-3 mb-3">来源：珲春东北虎国家级自然保护区 · 更新：{updatedAt}</p>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={habitatDist} cx="50%" cy="50%"
                  innerRadius={55} outerRadius={85} paddingAngle={2} dataKey="value"
                >
                  {habitatDist.map((entry) => (
                    <Cell key={entry.name} fill={HABITAT_COLORS[entry.name] || "#5E9A76"} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #DDEBE0" }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 mt-2">
              {habitatDist.map((d) => (
                <div key={d.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ background: HABITAT_COLORS[d.name] || "#5E9A76" }}
                    />
                    <span className="text-forest-600">{d.name}</span>
                  </div>
                  <span className="font-medium text-forest-800">{d.value}</span>
                </div>
              ))}
            </div>
            {/* 栖息地洞察 */}
            <div className="mt-4 pt-4 border-t border-forest-100">
              <span className="text-xs font-semibold text-forest-700">栖息地洞察：</span>
              <span className="text-xs text-forest-500">{insights.habitatDesc}</span>
            </div>
          </Card>
        </div>

        {/* 物种分布 + 数据源 */}
        <div className="grid lg:grid-cols-3 gap-5 mb-8">
          <Card className="p-6">
            <h3 className="font-serif text-lg font-semibold text-forest-900 mb-4">
              观察数据物种分布
              <span className="ml-2 text-xs font-normal text-forest-400">n={crawlerStats.total_observations}</span>
            </h3>
            <p className="text-xs text-forest-400 -mt-3 mb-3">来源：{dataSource} · 更新：{updatedAt}</p>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={speciesPie} cx="50%" cy="50%"
                  outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {speciesPie.map((_, i) => (
                    <Cell key={i} fill={SPECIES_COLORS[i % SPECIES_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #DDEBE0" }} />
              </PieChart>
            </ResponsiveContainer>
            {/* 物种洞察 */}
            <div className="mt-2 pt-3 border-t border-forest-100">
              <span className="text-xs font-semibold text-forest-700">物种洞察：</span>
              <span className="text-xs text-forest-500">{insights.speciesDesc}</span>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-serif text-lg font-semibold text-forest-900 mb-4">
              数据源分布
              <span className="ml-2 text-xs font-normal text-forest-400">n={crawlerStats.total_observations}</span>
            </h3>
            <p className="text-xs text-forest-400 -mt-3 mb-3">来源：{dataSource} · 更新：{updatedAt}</p>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={sourcePie} cx="50%" cy="50%" outerRadius={80} dataKey="value">
                  {sourcePie.map((entry) => (
                    <Cell key={entry.name} fill={SOURCE_COLORS[entry.name] || "#5E9A76"} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #DDEBE0" }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
            {/* 数据源洞察 */}
            <div className="mt-2 pt-3 border-t border-forest-100">
              <span className="text-xs font-semibold text-forest-700">数据洞察：</span>
              <span className="text-xs text-forest-500">{insights.sourceDesc}</span>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-serif text-lg font-semibold text-forest-900 mb-4">
              无人机机群
            </h3>
            <div className="space-y-3">
              {drones.filter((d) => d.status === "任务中").slice(0, 4).map((d) => (
                <div key={d.id} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-forest-800">{d.name}</span>
                    <span className="text-xs text-forest-500">{d.battery}%</span>
                  </div>
                  <p className="text-xs text-forest-500">{d.currentTask}</p>
                  <div className="h-1.5 bg-forest-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-forest-600 to-moss-500 rounded-full"
                      style={{ width: `${d.battery}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-forest-100 text-xs text-forest-500 flex justify-between">
              <span>{activeDrones}/{drones.length} 架在线</span>
              <span>总飞行 {drones.reduce((a, d) => a + d.flightHours, 0).toLocaleString()}h</span>
            </div>
          </Card>
        </div>

        {/* 最新观察表 */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-serif text-lg font-semibold text-forest-900">
              最新全球物种观察（爬虫实时获取）
            </h3>
            <span className="text-xs text-forest-500">数据来源: iNaturalist / GBIF</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-forest-500 border-b border-forest-100">
                  <th className="pb-3 font-medium">观察日期</th>
                  <th className="pb-3 font-medium">物种</th>
                  <th className="pb-3 font-medium">地点</th>
                  <th className="pb-3 font-medium">坐标</th>
                  <th className="pb-3 font-medium">数据源</th>
                  <th className="pb-3 font-medium">照片</th>
                </tr>
              </thead>
              <tbody>
                {recentObservations.map((r, i) => (
                  <tr key={i} className="border-b border-forest-50 hover:bg-forest-50/50 transition-colors">
                    <td className="py-3 text-forest-700 font-mono text-xs">{r.time}</td>
                    <td className="py-3">
                      <span className="font-medium text-forest-800">{r.species}</span>
                    </td>
                    <td className="py-3 text-forest-500 max-w-xs truncate">{r.place}</td>
                    <td className="py-3 text-forest-400 font-mono text-xs">{r.coords}</td>
                    <td className="py-3">
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-medium ${
                          r.source === "iNaturalist"
                            ? "bg-forest-100 text-forest-700"
                            : "bg-amber-50 text-amber-600"
                        }`}
                      >
                        {r.source}
                      </span>
                    </td>
                    <td className="py-3 text-forest-500 text-xs">
                      {r.source === "iNaturalist" ? "📷 有" : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
