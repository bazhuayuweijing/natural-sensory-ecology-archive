import { useState, useMemo } from "react";
import { MapPin, Eye, Volume2, Wind, ExternalLink, Info } from "lucide-react";
import { tigerRecords } from "@/data/tigerData";
import { crawledObservations, type CrawledObservation } from "@/data/crawlerObservations";
import { crawledSpeciesInfo } from "@/data/crawlerSpeciesInfo";
import Card from "@/components/ui/Card";
import RefreshButton from "@/components/ui/RefreshButton";
import { useCrawlerData } from "@/hooks/useCrawlerData";
import GlobalMap, { type MapPoint } from "@/components/ui/GlobalMap";

const HABITAT_COLORS: Record<string, string> = {
  核心繁殖区: "#1B5E3F",
  稳定栖息区: "#3D7E57",
  活动扩散区: "#7CB892",
  偶发目击: "#C9A961",
};

const CONSERVATION_COLORS: Record<string, string> = {
  CR: "#DC2626",   // 极危
  EN: "#EA580C",   // 濒危
  VU: "#D97706",   // 易危
  NT: "#CA8A04",   // 近危
  LC: "#16A34A",   // 无危
};

const CONSERVATION_LABEL: Record<string, string> = {
  CR: "极危",
  EN: "濒危",
  VU: "易危",
  NT: "近危",
  LC: "无危",
};

// Map bounds — 用于可视化散点
const MAP_BOUNDS = {
  minLng: 129.5, maxLng: 132.0,
  minLat: 42.5, maxLat: 44.0,
};
function project(lng: number, lat: number) {
  const x = ((lng - MAP_BOUNDS.minLng) / (MAP_BOUNDS.maxLng - MAP_BOUNDS.minLng)) * 100;
  const y = ((MAP_BOUNDS.maxLat - lat) / (MAP_BOUNDS.maxLat - MAP_BOUNDS.minLat)) * 100;
  return { x, y };
}

const SPECIES_COLORS: Record<string, string> = {
  东北虎: "#1B5E3F",
  丹顶鹤: "#3D7E57",
  白头鹤: "#7CB892",
  梅花鹿: "#C9A961",
  白手长臂猿: "#5E9A76",
  远东豹: "#EA580C",
};

// 爬取观察地图 bounds
const OBS_MIN_LNG = -180, OBS_MAX_LNG = 180;
const OBS_MIN_LAT = -85, OBS_MAX_LAT = 85;
function projectObs(lng: number, lat: number) {
  const x = ((lng - OBS_MIN_LNG) / (OBS_MAX_LNG - OBS_MIN_LNG)) * 100;
  const y = ((OBS_MAX_LAT - lat) / (OBS_MAX_LAT - OBS_MIN_LAT)) * 100;
  return { x, y };
}

const img = (prompt: string, size = "square_hd") =>
  `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(prompt)}&image_size=${size}`;

// 物种档案 (融合本地 + 爬取)
const allSpecies = [
  {
    id: "siberian-tiger",
    name: "东北虎", sci: "Panthera tigris altaica", cat: "猫科",
    cnStatus: "濒危", enStatus: "EN",
    habitat: "温带针阔混交林",
    image: img("Siberian tiger walking through snowy forest, majestic wild animal, realistic wildlife photography, natural lighting"),
    visual: "4K 可见光 + 红外双镜头影像",
    audio: "低频咆哮声纹 80-400Hz",
    olfactory: "松脂香 + 潮湿泥土味 + 腺体气息",
    desc: "世界上体型最大的猫科动物，全球野生种群仅约 50-60 只，是珲春保护区核心监测对象。",
  },
  {
    id: "red-crowned-crane",
    name: "丹顶鹤", sci: "Grus japonensis", cat: "鹤科",
    cnStatus: "濒危", enStatus: "EN",
    habitat: "湿地沼泽 / 水稻田",
    image: img("Red-crowned crane standing in wetland, elegant white bird with red crown, realistic nature photography"),
    visual: "可见光影像记录求偶舞蹈",
    audio: "高亢鹤鸣 200-3000Hz",
    olfactory: "芦苇香 + 湿地泥土腥气",
    desc: "国家一级保护动物，全球仅存约 3000 只。爬虫已爬取 iNaturalist 600 条观察记录。",
  },
  {
    id: "hooded-crane",
    name: "白头鹤", sci: "Grus monacha", cat: "鹤科",
    cnStatus: "易危", enStatus: "VU",
    habitat: "湿地农田 / 迁徙走廊",
    image: img("Hooded crane flock in wetland field, grey birds with white heads, realistic nature photography"),
    visual: "群体活动可见光影像",
    audio: "群鸣合唱 300-2500Hz",
    olfactory: "稻田泥土香 + 水草气息",
    desc: "迁徙性涉禽，中国区域爬虫已爬取 589 条观察记录。",
  },
  {
    id: "sika-deer",
    name: "梅花鹿", sci: "Cervus nippon", cat: "鹿科",
    cnStatus: "近危", enStatus: "NT",
    habitat: "针阔混交林缘",
    image: img("Sika deer with spotted coat in forest clearing, graceful animal, realistic wildlife photography"),
    visual: "可见光 + 红外双模式影像",
    audio: "鹿鸣与蹄声 100-1200Hz",
    olfactory: "青草气息 + 树皮树脂香",
    desc: "东北虎主要猎物，爬虫已爬取 600 条全球观察记录。",
  },
  {
    id: "white-handed-gibbon",
    name: "白手长臂猿", sci: "Hylobates lar", cat: "长臂猿科",
    cnStatus: "濒危", enStatus: "EN",
    habitat: "热带雨林树冠层",
    image: img("Lar gibbon swinging through tropical rainforest canopy, expressive primate, realistic photography"),
    visual: "高空俯拍树冠层活动轨迹",
    audio: "标志性晨鸣 400-5000Hz",
    olfactory: "热带花卉甜香 + 腐殖土气息",
    desc: "热带雨林旗舰物种，爬虫已爬取 600 条全球观察记录。",
  },
  {
    id: "amur-leopard",
    name: "远东豹", sci: "Panthera pardus orientalis", cat: "猫科",
    cnStatus: "极危", enStatus: "CR",
    habitat: "温带阔叶林",
    image: img("Amur leopard with spotted fur in forest, rare wild cat, realistic wildlife photography"),
    visual: "红外夜视影像记录夜行行为",
    audio: "低频喉音 60-300Hz",
    olfactory: "落叶腐殖味 + 猎物残留气息",
    desc: "全球仅存约 120 只的极危物种。",
  },
];

export default function Archive() {
  const { data: apiData } = useCrawlerData();
  const [tab, setTab] = useState<"tiger" | "global">("tiger");
  const [filter, setFilter] = useState<string>("全部");
  const [hovered, setHovered] = useState<number | null>(null);
  const [selectedSpecies, setSelectedSpecies] = useState(allSpecies[0]);

  const habitatTypes = ["全部", ...Object.keys(HABITAT_COLORS)];
  const speciesNames = ["全部", ...allSpecies.map((s) => s.name)];

  // 珲春东北虎地图数据
  const filteredTiger = useMemo(() => {
    if (filter === "全部") return tigerRecords;
    return tigerRecords.filter((r) => r.type === filter);
  }, [filter]);

  // 全球观察点数据
  const allObsWithSpecies = useMemo(() => {
    const speciesColorMap = allSpecies.reduce<Record<string, string>>(
      (acc, s) => ({ ...acc, [s.name]: SPECIES_COLORS[s.name] || "#1B5E3F" }), {}
    );
    return crawledObservations
      .filter((o) => speciesColorMap[o.cn_name])
      .slice(0, 1000);  // 限制数量避免卡顿
  }, []);

  // 从 Wikipedia 简介补充到详情
  const wikiInfo = crawledSpeciesInfo.find((w) =>
    selectedSpecies.sci.includes(w.sci_name.replace(" ", "").toLowerCase()) ||
    selectedSpecies.name === w.cn_name
  );

  return (
    <div className="bg-cream min-h-screen py-10">
      <div className="container">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl font-semibold text-forest-900">
              生态档案库
            </h1>
            <p className="text-forest-500 mt-1">
              本地珲春东北虎 GPS 位点 + 全球爬虫观察数据 + Wikipedia 物种简介
            </p>
          </div>
          <RefreshButton lastUpdated={apiData?.fileCrawledAt || null} />
        </div>

        {/* 地图 Tab 切换 */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => { setTab("tiger"); setFilter("全部"); }}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              tab === "tiger" ? "bg-forest-700 text-white" : "bg-white text-forest-600 border border-forest-200"
            }`}
          >
            🐯 珲春东北虎栖息地地图 ({tigerRecords.length} 位点)
          </button>
          <button
            onClick={() => { setTab("global"); setFilter("全部"); }}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              tab === "global" ? "bg-forest-700 text-white" : "bg-white text-forest-600 border border-forest-200"
            }`}
          >
            🌍 全球物种观察点 ({crawledObservations.length} 条)
          </button>
        </div>

        {/* ===== 珲春东北虎地图 ===== */}
        {tab === "tiger" && (
          <Card className="p-0 overflow-hidden mb-8">
            <div className="p-6 border-b border-forest-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-serif text-lg font-semibold text-forest-900">
                  珲春保护区 · 东北虎栖息地分布
                </h3>
                <p className="text-sm text-forest-500 mt-1">
                  真实地图底图 + GPS 监测位点 · {filteredTiger.length} 个显示位点
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {habitatTypes.map((t) => (
                  <button
                    key={t}
                    onClick={() => setFilter(t)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                      filter === t
                        ? "border-forest-700 bg-forest-700 text-white"
                        : "border-forest-200 bg-white text-forest-600 hover:border-forest-400"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative">
              <GlobalMap
                points={filteredTiger.map((r, i) => ({
                  id: i,
                  lat: r.latitude,
                  lng: r.longitude,
                  color: HABITAT_COLORS[r.type],
                  title: r.location,
                  subtitle: r.type,
                  extra: `置信度 ${Math.round(r.weight * 100)}%`,
                  date: r.date,
                  event: r.event,
                  significance: r.significance,
                  size: 4 + r.weight * 3,
                }))}
                center={[43.25, 130.75]}
                zoom={10}
                height={500}
              />

              {/* 图例 */}
              <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur rounded-xl shadow-soft p-3 border border-forest-100 z-[1000]">
                <p className="text-xs text-forest-500 mb-2 font-medium">栖息地类型</p>
                <div className="space-y-1.5">
                  {Object.entries(HABITAT_COLORS).map(([name, color]) => (
                    <div key={name} className="flex items-center gap-2 text-xs">
                      <span className="w-3 h-3 rounded-full" style={{ background: color }} />
                      <span className="text-forest-700">{name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* ===== 精选观察故事时间线（仅老虎 tab 显示）===== */}
        {tab === "tiger" && (
          <Card className="p-6 mb-8">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-8 h-8 rounded-lg bg-forest-100 flex items-center justify-center">
                <svg className="w-4 h-4 text-forest-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-serif text-lg font-semibold text-forest-900">精选观察故事</h3>
              <span className="text-xs text-forest-500">核心繁殖区与稳定栖息区的监测记录</span>
            </div>
            <div className="relative">
              {/* 时间线竖线 */}
              <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-forest-200" />
              <div className="space-y-5">
                {tigerRecords
                  .filter((r) => r.type === "核心繁殖区" || r.type === "稳定栖息区")
                  .sort((a, b) => b.date.localeCompare(a.date))
                  .slice(0, 8)
                  .map((r, i) => (
                    <div key={i} className="relative pl-8">
                      {/* 时间线圆点 */}
                      <div
                        className="absolute left-0 top-1 w-[15px] h-[15px] rounded-full border-2 border-white shadow"
                        style={{ background: HABITAT_COLORS[r.type] }}
                      />
                      <div className="bg-forest-50/60 rounded-xl p-4 hover:bg-forest-50 transition-colors">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className="text-xs font-mono text-forest-500 bg-white px-2 py-0.5 rounded">
                            {r.date}
                          </span>
                          <span
                            className="text-xs px-2 py-0.5 rounded-full text-white"
                            style={{ background: HABITAT_COLORS[r.type] }}
                          >
                            {r.type}
                          </span>
                          <span className="text-sm font-semibold text-forest-800">{r.location}</span>
                        </div>
                        <p className="text-sm text-forest-700 leading-relaxed mb-2">{r.event}</p>
                        <p className="text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded inline-block">
                          科研意义：{r.significance}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </Card>
        )}

        {/* ===== 全球观察点地图 ===== */}
        {tab === "global" && (
          <Card className="p-0 overflow-hidden mb-8">
            <div className="p-6 border-b border-forest-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-serif text-lg font-semibold text-forest-900">
                  全球物种观察点 (爬虫获取)
                </h3>
                <p className="text-sm text-forest-500 mt-1">
                  真实全球地图底图 · iNaturalist + GBIF 合并 · 显示前 1000 个
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {speciesNames.map((n) => (
                  <button
                    key={n}
                    onClick={() => setFilter(n)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                      filter === n
                        ? "border-forest-700 bg-forest-700 text-white"
                        : "border-forest-200 bg-white text-forest-600 hover:border-forest-400"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative">
              <GlobalMap
                points={allObsWithSpecies
                  .filter((o) => filter === "全部" || o.cn_name === filter)
                  .map((o, i) => ({
                    id: i,
                    lat: o.latitude,
                    lng: o.longitude,
                    color: SPECIES_COLORS[o.cn_name] || "#1B5E3F",
                    title: o.cn_name,
                    subtitle: o.place || o.country || "未知位置",
                    extra: `${o.observed_on || ""} · ${o.source}`,
                    size: 4,
                  }))}
                world
                height={500}
              />

              {/* 图例 */}
              <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur rounded-xl shadow-soft p-3 border border-forest-100 z-[1000]">
                <p className="text-xs text-forest-500 mb-2 font-medium">物种</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                  {Object.entries(SPECIES_COLORS).map(([name, color]) => (
                    <div key={name} className="flex items-center gap-2 text-xs">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
                      <span className="text-forest-700">{name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* 物种档案卡片 */}
        <div className="mb-8">
          <h2 className="font-serif text-2xl font-semibold text-forest-900 mb-5">
            建档物种（点击查看详情）
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {allSpecies.map((s) => {
              const cnt = crawledObservations.filter((o) => o.cn_name === s.name).length;
              return (
                <Card
                  key={s.id}
                  hover
                  className={`overflow-hidden cursor-pointer ${
                    selectedSpecies.name === s.name ? "ring-2 ring-forest-500" : ""
                  }`}
                >
                  <button
                    onClick={() => setSelectedSpecies(s)}
                    className="block w-full text-left"
                  >
                    <div className="aspect-[4/3] overflow-hidden">
                      <img
                        src={s.image}
                        alt={s.name}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                    </div>
                    <div className="p-5">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-serif text-lg font-semibold text-forest-900">
                          {s.name}
                        </h3>
                        <span
                          className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{
                            background: `${CONSERVATION_COLORS[s.enStatus]}15`,
                            color: CONSERVATION_COLORS[s.enStatus],
                          }}
                        >
                          {s.cnStatus}
                        </span>
                      </div>
                      <p className="text-xs text-forest-400 italic mb-2">{s.sci}</p>
                      {cnt > 0 && (
                        <p className="text-xs text-forest-600 mb-3 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          全球观察 {cnt} 条（爬虫）
                        </p>
                      )}
                      <div className="grid grid-cols-3 gap-1.5">
                        <span className="text-xs px-2 py-1 rounded-md bg-forest-50 text-forest-700">视觉</span>
                        <span className="text-xs px-2 py-1 rounded-md bg-forest-50 text-forest-700">听觉</span>
                        <span className="text-xs px-2 py-1 rounded-md bg-forest-50 text-forest-700">嗅觉</span>
                      </div>
                    </div>
                  </button>
                </Card>
              );
            })}
          </div>
        </div>

        {/* 选中物种详情 + Wikipedia 简介 */}
        <Card className="p-8">
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <img src={selectedSpecies.image} alt={selectedSpecies.name}
                className="w-full aspect-[4/3] object-cover rounded-2xl" />
            </div>
            <div>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h2 className="font-serif text-2xl font-semibold text-forest-900">
                    {selectedSpecies.name}
                  </h2>
                  <p className="text-sm text-forest-400 italic">{selectedSpecies.sci}</p>
                </div>
                <div className="text-right">
                  <span
                    className="text-sm font-medium px-3 py-1 rounded-full"
                    style={{
                      background: `${CONSERVATION_COLORS[selectedSpecies.enStatus]}15`,
                      color: CONSERVATION_COLORS[selectedSpecies.enStatus],
                    }}
                  >
                    {CONSERVATION_LABEL[selectedSpecies.enStatus]} · {selectedSpecies.enStatus}
                  </span>
                </div>
              </div>

              <p className="text-xs text-forest-500 mb-1">栖息地: {selectedSpecies.habitat}</p>

              {/* Wikipedia 简介（爬虫获取）*/}
              {wikiInfo ? (
                <div className="mt-4 p-4 bg-forest-50 rounded-xl border border-forest-100">
                  <div className="flex items-center gap-2 mb-2 text-xs text-forest-500">
                    <Info className="w-3.5 h-3.5" />
                    <span>Wikipedia 简介（爬虫获取）</span>
                  </div>
                  <p className="text-sm text-forest-700 leading-relaxed">{wikiInfo.summary}</p>
                  {wikiInfo.wiki_url && (
                    <a
                      href={wikiInfo.wiki_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-forest-600 hover:underline mt-2 inline-flex items-center gap-1"
                    >
                      查看原文 <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              ) : (
                <p className="mt-4 text-sm text-forest-600 leading-relaxed">
                  {selectedSpecies.desc}
                </p>
              )}

              {/* 感官三联档案 */}
              <div className="space-y-3 mt-5">
                <SenseRow icon={<Eye className="w-5 h-5" />} color="#1B5E3F" label="视觉档案" text={selectedSpecies.visual} />
                <SenseRow icon={<Volume2 className="w-5 h-5" />} color="#7CB892" label="听觉档案" text={selectedSpecies.audio} />
                <SenseRow icon={<Wind className="w-5 h-5" />} color="#C9A961" label="嗅觉档案" text={selectedSpecies.olfactory} />
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function SenseRow({ icon, label, text, color }: { icon: JSX.Element; label: string; text: string; color: string }) {
  return (
    <div className="flex gap-3">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: `${color}15`, color }}>
        {icon}
      </div>
      <div>
        <p className="text-xs text-forest-500 mb-0.5">{label}</p>
        <p className="text-sm text-forest-800">{text}</p>
      </div>
    </div>
  );
}
