import { Link } from "react-router-dom";
import {
  Eye,
  Volume2,
  Wind,
  ArrowRight,
  Shield,
  GraduationCap,
  Camera,
  Plane,
  Database,
  TrendingUp,
} from "lucide-react";
import { species } from "@/data/speciesData";
import { tigerRecords } from "@/data/tigerData";
import { useCountUp } from "@/hooks/useCountUp";
import { useEffect, useRef, useState } from "react";

const img = (prompt: string, size = "landscape_16_9") =>
  `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(
    prompt
  )}&image_size=${size}`;

const features = [
  {
    icon: Eye,
    title: "视觉感知",
    desc: "4K 超高清双镜头（可见光+红外），精准捕捉生物活动与植被状态，360° 全景影像。",
    color: "from-forest-500 to-forest-700",
  },
  {
    icon: Volume2,
    title: "听觉感知",
    desc: "定向麦克风阵列收录 30 米内生物声波，声纹匹配识别物种，过滤环境噪音。",
    color: "from-moss-400 to-forest-600",
  },
  {
    icon: Wind,
    title: "嗅觉感知",
    desc: "气体传感器阵列识别 200+ 种自然气味分子，还原栖息地环境气息，还原度 90%+。",
    color: "from-forest-400 to-moss-500",
  },
];

const scenarios = [
  {
    icon: Shield,
    title: "濒危物种保护监测",
    desc: "无人机群常态化跟踪濒危物种，通过气味-声音-行为关联分析提前预警生存风险。",
  },
  {
    icon: GraduationCap,
    title: "沉浸式自然教育",
    desc: "VR 设备配合视听嗅三联体验，让抽象的生态知识变得可感知，提升知识留存率。",
  },
  {
    icon: Camera,
    title: "生态旅游数字纪念品",
    desc: "为游客生成包含影像、声音、气味的数字纪念品，重温旅行时的感官记忆。",
  },
];

const stats = [
  { value: tigerRecords.length, label: "东北虎活动位点", suffix: "" },
  { value: species.length, label: "监测物种", suffix: "" },
  { value: 8, label: "生态无人机", suffix: "架" },
  { value: 200, label: "可识别气味", suffix: "+" },
];

export default function Home() {
  const statsRef = useRef<HTMLDivElement>(null);
  const [statsVisible, setStatsVisible] = useState(false);

  useEffect(() => {
    const el = statsRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStatsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div>
      {/* Hero */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        <img
          src={img(
            "Aerial view of lush temperate forest with mist, drone flying above canopy, sunrise golden light, realistic nature landscape photography, vast green wilderness"
          )}
          alt="森林航拍"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-forest-900/85 via-forest-900/50 to-transparent" />

        {/* 浮动装饰：光点 */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[15%] left-[20%] w-2 h-2 rounded-full bg-forest-200/60 twinkle" style={{ animationDelay: "0s" }} />
          <div className="absolute top-[30%] left-[60%] w-1.5 h-1.5 rounded-full bg-white/50 twinkle" style={{ animationDelay: "1s" }} />
          <div className="absolute top-[60%] left-[15%] w-2.5 h-2.5 rounded-full bg-moss-200/50 twinkle" style={{ animationDelay: "2s" }} />
          <div className="absolute top-[20%] right-[15%] w-1.5 h-1.5 rounded-full bg-forest-100/40 twinkle" style={{ animationDelay: "0.5s" }} />
          <div className="absolute top-[70%] right-[25%] w-2 h-2 rounded-full bg-white/30 twinkle" style={{ animationDelay: "1.5s" }} />
          <div className="absolute top-[45%] left-[45%] w-1 h-1 rounded-full bg-moss-100/60 twinkle" style={{ animationDelay: "2.5s" }} />
        </div>

        {/* 浮动装饰：叶片 */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <svg className="absolute top-[25%] right-[12%] w-8 h-8 text-forest-200/50 float-slow drop-shadow-lg" style={{ animationDelay: "0s" }} viewBox="0 0 24 24" fill="currentColor">
            <path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.95-2.3c.48.17.98.3 1.34.3C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z" />
          </svg>
          <svg className="absolute top-[55%] left-[8%] w-10 h-10 text-moss-200/50 float-medium drop-shadow-lg" style={{ animationDelay: "1.5s" }} viewBox="0 0 24 24" fill="currentColor">
            <path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.95-2.3c.48.17.98.3 1.34.3C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z" />
          </svg>
          <svg className="absolute top-[75%] right-[30%] w-6 h-6 text-forest-100/40 float-slow drop-shadow-lg" style={{ animationDelay: "3s" }} viewBox="0 0 24 24" fill="currentColor">
            <path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.95-2.3c.48.17.98.3 1.34.3C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z" />
          </svg>
          <svg className="absolute top-[10%] left-[40%] w-5 h-5 text-moss-100/40 float-medium drop-shadow-lg" style={{ animationDelay: "2s" }} viewBox="0 0 24 24" fill="currentColor">
            <path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.95-2.3c.48.17.98.3 1.34.3C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z" />
          </svg>
        </div>

        <div className="container relative z-10 py-32">
          <div className="max-w-2xl text-white">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur border border-white/20 text-sm mb-6 animate-fade-up">
              <Plane className="w-4 h-4" />
              无人机驱动的多维度自然记录平台
            </div>
            <h1 className="font-serif text-5xl md:text-6xl font-semibold leading-tight mb-6 text-balance animate-fade-up stagger-1">
              用科技感知自然
              <br />
              用数据守护生态
            </h1>
            <p className="text-lg text-forest-100 leading-relaxed mb-10 max-w-xl animate-fade-up stagger-2">
              融合视觉影像、生物声波与环境气味，构建可交互的生态档案。
              为科研监测、科普教育、生态保护提供立体化数据支持。
            </p>
            <div className="flex flex-wrap gap-4 animate-fade-up stagger-3">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-white text-forest-800 font-medium hover:bg-forest-50 transition-colors shadow-lg"
              >
                开始探索
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/archive"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl border border-white/40 text-white font-medium hover:bg-white/10 transition-colors backdrop-blur"
              >
                <Database className="w-4 h-4" />
                浏览生态档案
              </Link>
            </div>
          </div>
        </div>
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center text-white/70 text-xs animate-float">
          <span>向下滚动</span>
          <div className="w-px h-10 bg-gradient-to-b from-white/70 to-transparent mt-2" />
        </div>
      </section>

      {/* Stats */}
      <section className="container py-20" ref={statsRef}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((s, i) => (
            <div
              key={i}
              className="text-center p-6 rounded-2xl bg-cream border border-forest-100"
            >
              <div className="font-serif text-4xl md:text-5xl font-semibold text-forest-800">
                <CountUpNumber target={s.value} start={statsVisible} />
                <span className="text-2xl text-forest-500">{s.suffix}</span>
              </div>
              <div className="text-sm text-forest-500 mt-2">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="container py-20">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="font-serif text-4xl font-semibold text-forest-900 mb-4">
            三模感官采集引擎
          </h2>
          <p className="text-forest-500 leading-relaxed">
            生态友好型无人机搭载视觉、听觉、嗅觉三模采集模块，
            通过"感官映射引擎"将三种数据维度深度绑定。
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((f, i) => (
            <div
              key={i}
              className="group p-8 rounded-3xl bg-white border border-forest-100 shadow-card hover:shadow-hover hover:-translate-y-1 transition-all duration-300"
            >
              <div
                className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-6 shadow-soft`}
              >
                <f.icon className="w-7 h-7 text-white" strokeWidth={1.8} />
              </div>
              <h3 className="font-serif text-2xl font-semibold text-forest-900 mb-3">
                {f.title}
              </h3>
              <p className="text-forest-500 leading-relaxed text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Animal showcase */}
      <section className="bg-forest-50 py-24">
        <div className="container">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <h2 className="font-serif text-4xl font-semibold text-forest-900 mb-4">
                已建档物种
              </h2>
              <p className="text-forest-500 max-w-lg">
                从东北虎到丹顶鹤，每一个物种都拥有完整的视觉、听觉、嗅觉三联档案。
              </p>
            </div>
            <Link
              to="/archive"
              className="inline-flex items-center gap-2 text-forest-700 font-medium hover:gap-3 transition-all"
            >
              查看全部档案
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {species.slice(0, 3).map((s) => (
              <Link
                key={s.id}
                to="/archive"
                className="group rounded-3xl overflow-hidden bg-white shadow-card hover:shadow-hover hover:-translate-y-1 transition-all duration-300"
              >
                <div className="aspect-[4/3] overflow-hidden">
                  <img
                    src={s.image}
                    alt={s.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-serif text-xl font-semibold text-forest-900">
                      {s.name}
                    </h3>
                    <span className="text-xs px-2.5 py-1 rounded-full bg-red-50 text-red-600 font-medium">
                      {s.conservationStatus}
                    </span>
                  </div>
                  <p className="text-sm text-forest-500 italic mb-4">
                    {s.scientificName}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="text-xs px-2 py-1 rounded-md bg-forest-50 text-forest-700">
                      {s.habitat}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Scenarios */}
      <section className="container py-24">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="font-serif text-4xl font-semibold text-forest-900 mb-4">
            三大应用场景
          </h2>
          <p className="text-forest-500 leading-relaxed">
            从科研保护到自然教育，多维度感官数据服务于生态全链条。
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {scenarios.map((sc, i) => (
            <div key={i} className="relative p-8 rounded-3xl border border-forest-100 bg-white group hover:border-forest-300 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-forest-100 flex items-center justify-center mb-5 group-hover:bg-forest-700 transition-colors">
                <sc.icon className="w-6 h-6 text-forest-700 group-hover:text-white transition-colors" strokeWidth={1.8} />
              </div>
              <h3 className="font-serif text-xl font-semibold text-forest-900 mb-3">
                {sc.title}
              </h3>
              <p className="text-sm text-forest-500 leading-relaxed">{sc.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container pb-24">
        <div className="relative rounded-3xl overflow-hidden bg-forest-800">
          <img
            src={img(
              "Drone flying over misty forest at dawn, wildlife conservation technology, aerial view, green nature, realistic photography"
            )}
            alt="无人机森林"
            className="absolute inset-0 w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-forest-900 to-transparent" />
          <div className="relative z-10 p-12 md:p-16 text-white max-w-2xl">
            <TrendingUp className="w-10 h-10 mb-4 text-moss-300" />
            <h2 className="font-serif text-3xl md:text-4xl font-semibold mb-4">
              加入生态数据共建计划
            </h2>
            <p className="text-forest-200 leading-relaxed mb-8">
              注册即可浏览全球生态档案，为濒危物种保护贡献数据力量。
              科研人员可解锁深度分析报告与数据导出功能。
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-white text-forest-800 font-medium hover:bg-forest-50 transition-colors"
              >
                免费注册
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl border border-white/40 text-white font-medium hover:bg-white/10 transition-colors"
              >
                查看数据总览
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function CountUpNumber({ target, start }: { target: number; start: boolean }) {
  const value = useCountUp(target, 1500, start);
  return <>{value.toLocaleString()}</>;
}
