import { useState, useEffect } from "react";
import { Play, Pause, SkipForward, SkipBack, Volume2, Wind, Eye, Sparkles } from "lucide-react";
import { species } from "@/data/speciesData";
import Card from "@/components/ui/Card";
import { ambientSound } from "@/utils/ambientSound";

const scenes = [
  {
    name: "珲春针叶林晨雾",
    visual: "薄雾弥漫的针阔混交林，晨光穿透树冠",
    audio: "松涛沙沙 + 鸟鸣 + 远处流水声",
    olfactory: "松脂香 + 苔藓湿味 + 腐殖土气息",
    mood: "清晨 · 静谧",
  },
  {
    name: "湿地日落",
    visual: "夕阳染红的芦苇荡，丹顶鹤剪影",
    audio: "鹤鸣 + 芦苇沙沙 + 远处蛙鸣",
    olfactory: "芦苇香 + 湿地泥土腥气 + 晚霞的暖味",
    mood: "黄昏 · 诗意",
  },
  {
    name: "雨林树冠层",
    visual: "雨林高空俯瞰，长臂猿穿梭其间",
    audio: "长臂猿晨鸣 + 虫鸣合唱",
    olfactory: "热带花卉甜香 + 湿润植物气息",
    mood: "正午 · 生机",
  },
];

export default function Experience() {
  const [playing, setPlaying] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [activeSenses, setActiveSenses] = useState({ visual: true, audio: true, olfactory: true });
  const [progress, setProgress] = useState(0);
  const [selectedSpecies, setSelectedSpecies] = useState(species[0]);

  const scene = scenes[currentIdx];

  // 播放音效控制
  useEffect(() => {
    if (playing) {
      ambientSound.playScene(scene.name);
    } else {
      ambientSound.stopAll();
    }
    return () => {
      ambientSound.stopAll();
    };
  }, [playing, scene.name]);

  // 感官开关影响音量
  useEffect(() => {
    ambientSound.setSenseVolume("visual", activeSenses.visual ? 1 : 0);
    ambientSound.setSenseVolume("audio", activeSenses.audio ? 1 : 0);
    ambientSound.setSenseVolume("olfactory", activeSenses.olfactory ? 1 : 0);
  }, [activeSenses]);

  useEffect(() => {
    if (!playing) return;
    const timer = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          setCurrentIdx((i) => (i + 1) % scenes.length);
          return 0;
        }
        return p + 1;
      });
    }, 500);
    return () => clearInterval(timer);
  }, [playing]);

  const prev = () => {
    setCurrentIdx((i) => (i - 1 + scenes.length) % scenes.length);
    setProgress(0);
  };
  const next = () => {
    setCurrentIdx((i) => (i + 1) % scenes.length);
    setProgress(0);
  };

  const toggleSense = (s: "visual" | "audio" | "olfactory") => {
    setActiveSenses((p) => ({ ...p, [s]: !p[s] }));
  };

  return (
    <div className="bg-cream min-h-screen py-10">
      <div className="container">
        <div className="mb-8">
          <h1 className="font-serif text-3xl font-semibold text-forest-900">
            感官体验
          </h1>
          <p className="text-forest-500 mt-1">
            沉浸式视听嗅三联播放，感受身临其境的自然
          </p>
          <p className="text-xs text-forest-400 mt-2 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            点击播放按钮将启动 Web Audio 合成的真实环境音效（建议开启音量）
          </p>
        </div>

        {/* Main player */}
        <Card className="overflow-hidden mb-8">
          <div className="relative aspect-video bg-forest-900">
            <img
              src={selectedSpecies.image}
              alt="场景"
              className="absolute inset-0 w-full h-full object-cover opacity-60"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-forest-900/90 via-forest-900/30 to-transparent" />

            {/* Animated particles for active senses */}
            {playing && (
              <>
                {activeSenses.visual && (
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-1/4 left-1/4 w-2 h-2 rounded-full bg-white/60 animate-pulse" style={{ animationDelay: "0.1s" }} />
                    <div className="absolute top-1/3 left-2/3 w-1.5 h-1.5 rounded-full bg-moss-300/60 animate-pulse" style={{ animationDelay: "0.3s" }} />
                    <div className="absolute top-2/3 left-1/3 w-1 h-1 rounded-full bg-white/50 animate-pulse" style={{ animationDelay: "0.5s" }} />
                  </div>
                )}
                {activeSenses.olfactory && (
                  <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    {[...Array(8)].map((_, i) => (
                      <div
                        key={i}
                        className="absolute w-20 h-20 rounded-full bg-forest-500/10 blur-xl animate-pulse"
                        style={{
                          top: `${20 + (i % 4) * 20}%`,
                          left: `${10 + (i * 12) % 80}%`,
                          animationDelay: `${i * 0.3}s`,
                        }}
                      />
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Center play button */}
            <div className="absolute inset-0 flex items-center justify-center">
              <button
                onClick={() => setPlaying(!playing)}
                className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-xl border border-white/30 flex items-center justify-center hover:bg-white/30 transition-all hover:scale-105"
              >
                {playing ? (
                  <Pause className="w-8 h-8 text-white" />
                ) : (
                  <Play className="w-8 h-8 text-white ml-1" />
                )}
              </button>
            </div>

            {/* Scene info overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
              <p className="text-xs text-forest-200 mb-1 tracking-wider">{scene.mood}</p>
              <h2 className="font-serif text-2xl font-semibold mb-3">{scene.name}</h2>

              {/* Progress */}
              <div className="h-1 bg-white/20 rounded-full overflow-hidden mb-4">
                <div
                  className="h-full bg-gradient-to-r from-moss-300 to-forest-400 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>

              {/* Controls */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={prev}
                    className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                  >
                    <SkipBack className="w-4 h-4" />
                  </button>
                  <button
                    onClick={next}
                    className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                  >
                    <SkipForward className="w-4 h-4" />
                  </button>
                </div>

                {/* Sense toggles */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleSense("visual")}
                    className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                      activeSenses.visual ? "bg-forest-600 text-white" : "bg-white/10 text-white/50"
                    }`}
                    title="视觉"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => toggleSense("audio")}
                    className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                      activeSenses.audio ? "bg-forest-600 text-white" : "bg-white/10 text-white/50"
                    }`}
                    title="听觉"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => toggleSense("olfactory")}
                    className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                      activeSenses.olfactory ? "bg-forest-600 text-white" : "bg-white/10 text-white/50"
                    }`}
                    title="嗅觉"
                  >
                    <Wind className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Scene details */}
        <div className="grid md:grid-cols-3 gap-5 mb-8">
          <SensePanel
            active={activeSenses.visual}
            icon={<Eye className="w-5 h-5" />}
            title="视觉感知"
            color="#1B5E3F"
            text={scene.visual}
          />
          <SensePanel
            active={activeSenses.audio}
            icon={<Volume2 className="w-5 h-5" />}
            title="听觉感知"
            color="#7CB892"
            text={scene.audio}
          />
          <SensePanel
            active={activeSenses.olfactory}
            icon={<Wind className="w-5 h-5" />}
            title="嗅觉感知"
            color="#C9A961"
            text={scene.olfactory}
          />
        </div>

        {/* Scene selector */}
        <Card className="p-6 mb-8">
          <h3 className="font-serif text-lg font-semibold text-forest-900 mb-4">
            场景选择
          </h3>
          <div className="grid sm:grid-cols-3 gap-3">
            {scenes.map((s, i) => (
              <button
                key={i}
                onClick={() => {
                  setCurrentIdx(i);
                  setProgress(0);
                  setPlaying(false);
                }}
                className={`p-4 rounded-xl text-left border transition-all ${
                  i === currentIdx
                    ? "border-forest-600 bg-forest-50"
                    : "border-forest-100 bg-white hover:border-forest-300"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="w-4 h-4 text-forest-600" />
                  <span className="text-xs text-forest-500">{s.mood}</span>
                </div>
                <p className="font-medium text-forest-900 text-sm">{s.name}</p>
              </button>
            ))}
          </div>
        </Card>

        {/* Species quick select */}
        <div>
          <h3 className="font-serif text-lg font-semibold text-forest-900 mb-4">
            选择物种
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {species.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedSpecies(s)}
                className={`group relative rounded-2xl overflow-hidden aspect-square transition-all ${
                  selectedSpecies.id === s.id
                    ? "ring-2 ring-forest-600 ring-offset-2"
                    : ""
                }`}
              >
                <img
                  src={s.image}
                  alt={s.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-forest-900/80 to-transparent" />
                <div className="absolute bottom-2 left-2 right-2 text-white text-sm font-medium">
                  {s.name}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function SensePanel({
  active,
  icon,
  title,
  color,
  text,
}: {
  active: boolean;
  icon: JSX.Element;
  title: string;
  color: string;
  text: string;
}) {
  return (
    <div
      className={`p-6 rounded-2xl border transition-all ${
        active
          ? "bg-white border-forest-200 shadow-card"
          : "bg-white/50 border-forest-100 opacity-50"
      }`}
    >
      <div className="flex items-center gap-2 mb-3">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: `${color}15`, color }}
        >
          {icon}
        </div>
        <h4 className="font-medium text-forest-900">{title}</h4>
      </div>
      <p className="text-sm text-forest-600 leading-relaxed">{text}</p>
      {active && (
        <div className="mt-3 flex items-center gap-1.5">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-1 rounded-full animate-pulse"
              style={{
                width: `${12 + i * 4}px`,
                background: color,
                animationDelay: `${i * 0.15}s`,
              }}
            />
          ))}
          <span className="text-xs text-forest-500 ml-2">播放中</span>
        </div>
      )}
    </div>
  );
}
