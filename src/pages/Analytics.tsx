import { Activity, Calendar, TrendingUp, MapPin, ArrowUpRight } from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
} from "recharts";
import Card from "@/components/ui/Card";
import RefreshButton from "@/components/ui/RefreshButton";
import { useCrawlerData } from "@/hooks/useCrawlerData";
import { tigerRecords } from "@/data/tigerData";
import { crawlerStats } from "@/data/crawlerStats";
import { crawledObservations } from "@/data/crawlerObservations";

const HABITAT_COLORS: Record<string, string> = {
  核心繁殖区: "#1B5E3F",
  稳定栖息区: "#3D7E57",
  活动扩散区: "#7CB892",
  偶发目击: "#C9A961",
};
const SOURCE_COLORS: Record<string, string> = {
  iNaturalist: "#3D7E57", GBIF: "#C9A961",
};
const SPECIES_COLORS = ["#1B5E3F", "#7CB892", "#C9A961", "#5E9A76", "#BBD7C2", "#D97706"];

// ===== 数据计算 =====

// 1. 栖息地分布
const habitatPie = (() => {
  const types: Record<string, number> = {};
  for (const r of tigerRecords) types[r.type] = (types[r.type] || 0) + 1;
  return Object.entries(types).map(([name, value]) => ({ name, value }));
})();

// 2. 爬虫观察 — 按物种 + 国家
const speciesPie = Object.entries(crawlerStats.by_species).map(([name, value]) => ({ name, value }));
const sourcePie = Object.entries(crawlerStats.by_source).map(([name, value]) => ({ name, value }));

// 3. 近 12 个月趋势
const monthlyTrend = (() => {
  const now = new Date();
  const arr: { month: string; 观察数: number }[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const cnt = (crawlerStats.by_month as Record<string, number>)[key] || 0;
    arr.push({ month: `${d.getMonth() + 1}月`, 观察数: cnt });
  }
  return arr;
})();

// 4. 全部月度累计（长周期）
const allMonths = (() => {
  const months = Object.keys(crawlerStats.by_month).sort();
  return months.map((m) => ({
    month: `${m.slice(2)}月`,
    观察数: (crawlerStats.by_month as Record<string, number>)[m],
  }));
})();

// 5. 国家分布 Top 10
const topCountries = (() => {
  const cnt: Record<string, number> = {};
  for (const o of crawledObservations) {
    const c = o.country || "未知";
    cnt[c] = (cnt[c] || 0) + 1;
  }
  return Object.entries(cnt)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, value]) => ({ name, value }));
})();

// 6. 来源地区雷达（按物种 × 数据源）
const radarData = (() => {
  const species = Object.keys(crawlerStats.by_species);
  return species.map((name) => {
    const sp = crawledObservations.filter((o) => o.cn_name === name);
    const bySource: Record<string, number> = {};
    for (const o of sp) bySource[o.source] = (bySource[o.source] || 0) + 1;
    return {
      subject: name,
      iNaturalist: bySource["iNaturalist"] || 0,
      GBIF: bySource["GBIF"] || 0,
      fullMark: 600,
    };
  });
})();

// 7. 珲春各区域统计
const huichunByArea = (() => {
  const cnt: Record<string, number> = {};
  for (const r of tigerRecords) {
    cnt[r.type] = (cnt[r.type] || 0) + 1;
  }
  const total = tigerRecords.length;
  return Object.entries(cnt).map(([name, value]) => ({
    name, value,
    pct: ((value / total) * 100).toFixed(1),
  }));
})();

// 8. 观察近 30 天 vs 30-90 天 vs 90 天前
const timeBuckets = (() => {
  const now = new Date();
  let recent = 0, mid = 0, old = 0;
  for (const o of crawledObservations) {
    if (!o.observed_on) continue;
    const d = new Date(o.observed_on);
    const days = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
    if (days < 30) recent++;
    else if (days < 90) mid++;
    else old++;
  }
  return [
    { name: "近 30 天", value: recent },
    { name: "30-90 天", value: mid },
    { name: "90 天以上", value: old },
  ];
})();

export default function Analytics() {
  const { data: apiData } = useCrawlerData();
  const chinaCount = crawlerStats.china_observations;
  const totalCount = crawlerStats.total_observations;
  const chinaPct = ((chinaCount / totalCount) * 100).toFixed(1);

  return (
    <div className="bg-cream min-h-screen py-10">
      <div className="container">
        <div className="flex items-start justify-between mb-8 gap-4">
          <div>
            <h1 className="font-serif text-3xl font-semibold text-forest-900">
              数据分析
            </h1>
            <p className="text-forest-500 mt-1">
              爬虫数据 + 珲春保护区数据的多维交叉分析
            </p>
          </div>
          <RefreshButton lastUpdated={apiData?.fileCrawledAt || null} />
        </div>

        {/* 顶部概览指标 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-forest-100 flex items-center justify-center">
                <Activity className="w-6 h-6 text-forest-600" />
              </div>
              <div>
                <p className="text-sm text-forest-500">全球观察总数</p>
                <p className="font-serif text-2xl font-semibold text-forest-900">
                  {totalCount.toLocaleString()}
                </p>
              </div>
            </div>
            <div className="mt-3 h-1.5 bg-forest-100 rounded-full overflow-hidden">
              <div className="h-full bg-forest-600 rounded-full" style={{ width: "100%" }} />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-moss-100 flex items-center justify-center">
                <MapPin className="w-6 h-6 text-forest-600" />
              </div>
              <div>
                <p className="text-sm text-forest-500">中国区域</p>
                <p className="font-serif text-2xl font-semibold text-forest-900">
                  {chinaCount}
                </p>
              </div>
            </div>
            <div className="mt-3 text-xs text-forest-500 flex items-center gap-1">
              占全球 {chinaPct}% <ArrowUpRight className="w-3 h-3 text-forest-500" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-forest-500">覆盖月份</p>
                <p className="font-serif text-2xl font-semibold text-forest-900">
                  {Object.keys(crawlerStats.by_month).length}+
                </p>
              </div>
            </div>
            <div className="mt-3 text-xs text-forest-500">最早 2017 年至今</div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-forest-50 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-forest-600" />
              </div>
              <div>
                <p className="text-sm text-forest-500">数据源</p>
                <p className="font-serif text-2xl font-semibold text-forest-900">
                  {Object.keys(crawlerStats.by_source).length}
                </p>
              </div>
            </div>
            <div className="mt-3 text-xs text-forest-500">
              {"iNaturalist + GBIF"}
            </div>
          </Card>
        </div>

        {/* 近 12 个月趋势 + 来源分布 */}
        <div className="grid lg:grid-cols-3 gap-5 mb-6">
          <Card className="p-6 lg:col-span-2">
            <h3 className="font-serif text-lg font-semibold text-forest-900 mb-4">
              近 12 个月全球物种观察趋势（爬虫实时数据）
            </h3>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={monthlyTrend} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1B5E3F" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#1B5E3F" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#DDEBE0" />
                <XAxis dataKey="month" stroke="#5E9A76" fontSize={12} />
                <YAxis stroke="#5E9A76" fontSize={12} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #DDEBE0" }} />
                <Area type="monotone" dataKey="观察数" stroke="#1B5E3F" strokeWidth={2.5}
                  fillOpacity={1} fill="url(#trendGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </Card>

          <Card className="p-6">
            <h3 className="font-serif text-lg font-semibold text-forest-900 mb-4">
              数据源分布
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={sourcePie} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                  paddingAngle={2} dataKey="value">
                  {sourcePie.map((e) => (
                    <Cell key={e.name} fill={SOURCE_COLORS[e.name] || "#5E9A76"} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #DDEBE0" }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* 物种分布 + 时间分布 */}
        <div className="grid lg:grid-cols-3 gap-5 mb-6">
          <Card className="p-6">
            <h3 className="font-serif text-lg font-semibold text-forest-900 mb-4">
              观察数据物种分布
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={speciesPie} cx="50%" cy="50%" outerRadius={85} dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {speciesPie.map((_, i) => (
                    <Cell key={i} fill={SPECIES_COLORS[i % SPECIES_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #DDEBE0" }} />
              </PieChart>
            </ResponsiveContainer>
          </Card>

          <Card className="p-6">
            <h3 className="font-serif text-lg font-semibold text-forest-900 mb-4">
              观察时间分布
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={timeBuckets} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#DDEBE0" />
                <XAxis dataKey="name" stroke="#5E9A76" fontSize={11} />
                <YAxis stroke="#5E9A76" fontSize={11} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #DDEBE0" }} />
                <Bar dataKey="value" fill="#3D7E57" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card className="p-6">
            <h3 className="font-serif text-lg font-semibold text-forest-900 mb-4">
              国家 / 地区 Top 10
            </h3>
            <div className="space-y-2 max-h-[220px] overflow-y-auto">
              {topCountries.map((c, i) => {
                const maxVal = topCountries[0].value;
                return (
                  <div key={c.name} className="flex items-center gap-2">
                    <span className="text-xs font-medium text-forest-400 w-5">{i + 1}</span>
                    <div className="flex-1">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-forest-700">{c.name}</span>
                        <span className="text-forest-500">{c.value}</span>
                      </div>
                      <div className="h-1.5 bg-forest-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-forest-600 to-moss-500 rounded-full"
                          style={{ width: `${(c.value / maxVal) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* 雷达 + 栖息地 */}
        <div className="grid lg:grid-cols-2 gap-5 mb-6">
          <Card className="p-6">
            <h3 className="font-serif text-lg font-semibold text-forest-900 mb-4">
              物种 × 数据源交叉雷达
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#DDEBE0" />
                <PolarAngleAxis dataKey="subject" stroke="#5E9A76" fontSize={11} />
                <PolarRadiusAxis angle={90} domain={[0, 600]} stroke="#DDEBE0" fontSize={10} />
                <Radar name="iNaturalist" dataKey="iNaturalist" stroke="#3D7E57" fill="#3D7E57" fillOpacity={0.3} />
                <Radar name="GBIF" dataKey="GBIF" stroke="#C9A961" fill="#C9A961" fillOpacity={0.3} />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </Card>

          <Card className="p-6">
            <h3 className="font-serif text-lg font-semibold text-forest-900 mb-4">
              珲春保护区 · 东北虎栖息地分布
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={habitatPie} cx="50%" cy="50%" outerRadius={80} dataKey="value">
                    {habitatPie.map((e) => (
                      <Cell key={e.name} fill={HABITAT_COLORS[e.name] || "#5E9A76"} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #DDEBE0" }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-3">
                {huichunByArea.map((a) => (
                  <div key={a.name} className="p-3 rounded-xl border border-forest-100">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ background: HABITAT_COLORS[a.name] || "#5E9A76" }}
                      />
                      <span className="text-sm font-medium text-forest-800">{a.name}</span>
                    </div>
                    <div className="text-xs text-forest-500">
                      {a.value} 位点 · 占 {a.pct}%
                    </div>
                    <div className="h-1 bg-forest-100 rounded-full overflow-hidden mt-1.5">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${a.pct}%`,
                          background: HABITAT_COLORS[a.name] || "#5E9A76",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
