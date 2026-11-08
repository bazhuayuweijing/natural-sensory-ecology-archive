import { Leaf, Heart, Eye, Volume2, Wind, Users, Award, Globe } from "lucide-react";
import Card from "@/components/ui/Card";

const img = (prompt: string, size = "landscape_16_9") =>
  `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(
    prompt
  )}&image_size=${size}`;

const values = [
  {
    icon: Eye,
    title: "视觉感知",
    desc: "4K 超高清双镜头捕捉每一个自然瞬间。可见光记录行为，红外揭示秘密。",
  },
  {
    icon: Volume2,
    title: "听觉感知",
    desc: "定向麦克风阵列收录 30 米内生物声波，声纹匹配精准识别物种。",
  },
  {
    icon: Wind,
    title: "嗅觉感知",
    desc: "气体传感器阵列识别 200+ 种自然气味分子，还原栖息地环境气息。",
  },
  {
    icon: Heart,
    title: "生物友好",
    desc: "天然信息素胶囊引导 + 可降解材料机身，生物干扰度低于国际标准。",
  },
];

const team = [
  { name: "生态工程组", focus: "无人机硬件改装、传感器选型与生物引导设计" },
  { name: "计算机组", focus: "感官映射引擎、多模态数据融合算法开发" },
  { name: "环境科学组", focus: "保护区需求对接、栖息地评估与数据解读" },
  { name: "交互设计组", focus: "VR 系统开发、香氛配方研发与沉浸体验设计" },
];

const achievements = [
  { num: "102+", label: "东北虎活动位点建档" },
  { num: "6", label: "监测物种" },
  { num: "8", label: "生态无人机" },
  { num: "200+", label: "可识别气味分子" },
];

export default function About() {
  return (
    <div>
      {/* Hero */}
      <section className="relative bg-forest-900 text-white overflow-hidden">
        <img
          src={img(
            "Aerial drone view flying over lush green temperate forest canopy at sunset, golden light, misty atmosphere, realistic nature photography"
          )}
          alt="森林航拍"
          className="absolute inset-0 w-full h-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-forest-900/80 via-forest-900/60 to-forest-900" />
        <div className="container relative z-10 py-24 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur border border-white/20 text-xs mb-6">
            <Leaf className="w-3.5 h-3.5" />
            自然感官生态档案库
          </div>
          <h1 className="font-serif text-5xl md:text-6xl font-semibold leading-tight mb-6 text-balance max-w-3xl mx-auto">
            用科技感知自然
            <br />
            用数据守护生态
          </h1>
          <p className="text-lg text-forest-100 max-w-2xl mx-auto leading-relaxed">
            我们是一支由生态工程、计算机、环境科学、交互设计交叉组建的团队，
            致力于通过无人机多模态传感技术，构建全球首个"视觉-听觉-嗅觉"三联生态档案库。
          </p>
        </div>
      </section>

      {/* Stats bar */}
      <section className="bg-white py-12 border-b border-forest-100">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {achievements.map((a, i) => (
              <div key={i} className="text-center">
                <div className="font-serif text-4xl md:text-5xl font-semibold text-forest-700">
                  {a.num}
                </div>
                <div className="text-sm text-forest-500 mt-2">{a.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="container py-24">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="font-serif text-4xl font-semibold text-forest-900 mb-6 leading-tight">
              我们的使命
              <br />
              <span className="text-forest-600">连接科技与自然</span>
            </h2>
            <p className="text-forest-600 leading-relaxed mb-6">
              传统自然记录长期局限于单维度——影像或声音，缺乏气味这一关键生态指标。
              我们的团队突破这一局限，通过搭载多模态传感器的生态友好型无人机，
              同步捕捉视觉影像、生物声波与环境气味。
            </p>
            <p className="text-forest-600 leading-relaxed">
              从东北虎到丹顶鹤，
              每一个物种都将拥有完整的"视听嗅"三联档案，
              为濒危物种保护、沉浸式自然教育、生态旅游提供立体化数据支持。
            </p>
          </div>
          <div className="relative">
            <img
              src={img(
                "Siberian tiger with two cubs in winter snow forest, family group, wildlife conservation, realistic nature photography"
              )}
              alt="东北虎家庭"
              className="rounded-3xl shadow-card"
            />
            <div className="absolute -bottom-6 -left-6 bg-white rounded-2xl p-4 shadow-card border border-forest-100">
              <div className="flex items-center gap-2 text-sm">
                <Globe className="w-4 h-4 text-forest-600" />
                <span className="font-medium text-forest-800">项目区域</span>
              </div>
              <p className="text-xs text-forest-500 mt-1">
                珲春保护区试点
                <br />
                持续扩展中
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-forest-50 py-24">
        <div className="container">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="font-serif text-4xl font-semibold text-forest-900 mb-4">
              三大核心价值
            </h2>
            <p className="text-forest-500 leading-relaxed">
              用技术创新，守护每一种生命
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((v, i) => (
              <Card key={i} className="p-8 text-center hover:-translate-y-1 transition-all">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-forest-600 to-forest-800 flex items-center justify-center mx-auto mb-5 shadow-soft">
                  <v.icon className="w-7 h-7 text-white" strokeWidth={1.8} />
                </div>
                <h3 className="font-serif text-xl font-semibold text-forest-900 mb-2">
                  {v.title}
                </h3>
                <p className="text-sm text-forest-500 leading-relaxed">{v.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="container py-24">
        <div className="grid md:grid-cols-2 gap-16">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-forest-100 flex items-center justify-center">
                <Users className="w-6 h-6 text-forest-600" />
              </div>
              <h2 className="font-serif text-3xl font-semibold text-forest-900">
                跨学科团队
              </h2>
            </div>
            <p className="text-forest-600 leading-relaxed mb-8">
              技术组、市场组、设计组协同作战，实现从数据采集到系统搭建的完整闭环。
            </p>
            <div className="space-y-4">
              {team.map((t, i) => (
                <div
                  key={i}
                  className="p-5 rounded-2xl border border-forest-100 hover:border-forest-300 transition-colors"
                >
                  <h4 className="font-medium text-forest-900 mb-1">{t.name}</h4>
                  <p className="text-sm text-forest-500">{t.focus}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl overflow-hidden">
              <img
                src={img(
                  "Drone with multispectral sensors and microphone array, close-up product photography, white background, tech innovation"
                )}
                alt="无人机"
                className="w-full aspect-[4/3] object-cover"
              />
            </div>
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <Award className="w-6 h-6 text-amber-500" />
                <h4 className="font-medium text-forest-900">技术壁垒</h4>
              </div>
              <ul className="space-y-2 text-sm text-forest-600">
                <li>• 多模态数据实时同步算法，误差控制在 0.5 秒内</li>
                <li>• 自然气味精准模拟技术，还原度达 90%+</li>
                <li>• 生物友好型设备设计，干扰度低于国际生态标准</li>
              </ul>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container pb-24">
        <div className="bg-forest-800 rounded-3xl p-12 text-center text-white relative overflow-hidden">
          <img
            src={img(
              "Misty forest with animals silhouette, conservation photography, atmospheric nature"
            )}
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-20"
          />
          <div className="relative z-10">
            <h2 className="font-serif text-3xl md:text-4xl font-semibold mb-4">
              加入我们，守护每一片绿色
            </h2>
            <p className="text-forest-200 max-w-xl mx-auto mb-8">
              科研合作、保护区共建、品牌联名——我们期待与志同道合的伙伴一起，
              让科技真正惠及自然。
            </p>
            <a
              href="#"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-white text-forest-800 font-medium hover:bg-forest-50 transition-colors"
            >
              联系我们
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
