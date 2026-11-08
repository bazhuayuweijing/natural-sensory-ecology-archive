import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Leaf, Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import { useAuthStore } from "@/store/authStore";

const img = (prompt: string) =>
  `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(
    prompt
  )}&image_size=portrait_4_3`;

export default function Login() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    setTimeout(() => {
      const res = login(identifier, password);
      setLoading(false);
      if (res.success) {
        navigate("/dashboard");
      } else {
        setError(res.message);
      }
    }, 400);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left brand panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-forest-800">
        <img
          src={img(
            "Misty temperate forest at dawn, sunbeams through tall pine trees, serene nature landscape, realistic photography, soft green tones"
          )}
          alt="森林"
          className="absolute inset-0 w-full h-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-forest-900/80 to-forest-700/60" />
        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center">
              <Leaf className="w-6 h-6" />
            </div>
            <span className="font-serif text-xl font-semibold">自然感官档案库</span>
          </div>
          <div>
            <h1 className="font-serif text-4xl font-semibold leading-tight mb-4 text-balance">
              用科技感知自然
              <br />
              用数据守护生态
            </h1>
            <p className="text-forest-200 text-base leading-relaxed max-w-md">
              无人机驱动的多维度自然记录平台，融合视觉、听觉、嗅觉，
              构建可交互的生态档案，为濒危物种保护与自然教育赋能。
            </p>
          </div>
          <div className="flex gap-6 text-sm text-forest-200">
            <div>
              <div className="text-2xl font-semibold text-white">102</div>
              <div>东北虎活动位点</div>
            </div>
            <div>
              <div className="text-2xl font-semibold text-white">6</div>
              <div>监测物种</div>
            </div>
            <div>
              <div className="text-2xl font-semibold text-white">8</div>
              <div>生态无人机</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-cream">
        <div className="w-full max-w-md animate-fade-up">
          <div className="lg:hidden flex items-center gap-2 mb-8 justify-center">
            <div className="w-10 h-10 rounded-xl bg-forest-700 flex items-center justify-center">
              <Leaf className="w-6 h-6 text-white" />
            </div>
            <span className="font-serif text-xl font-semibold text-forest-800">
              自然感官档案库
            </span>
          </div>

          <h2 className="font-serif text-3xl font-semibold text-forest-900 mb-2">
            欢迎回来
          </h2>
          <p className="text-forest-500 mb-8">登录以继续探索自然感官档案</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-forest-700 mb-2">
                用户名或邮箱
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-forest-400" strokeWidth={1.8} />
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-forest-200 bg-white text-forest-900 placeholder-forest-300 focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-transparent transition"
                  placeholder="请输入用户名或邮箱"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-forest-700 mb-2">
                密码
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-forest-400" strokeWidth={1.8} />
                <input
                  type={showPwd ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-11 py-3 rounded-xl border border-forest-200 bg-white text-forest-900 placeholder-forest-300 focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-transparent transition"
                  placeholder="请输入密码"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-forest-400 hover:text-forest-600"
                >
                  {showPwd ? <EyeOff className="w-5 h-5" strokeWidth={1.8} /> : <Eye className="w-5 h-5" strokeWidth={1.8} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 px-4 py-2.5 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-forest-700 text-white font-medium hover:bg-forest-800 transition-colors shadow-soft disabled:opacity-60"
            >
              {loading ? "登录中..." : "登录"}
              {!loading && <ArrowRight className="w-4 h-4" strokeWidth={2} />}
            </button>
          </form>

          <p className="text-center text-sm text-forest-500 mt-8">
            还没有账号？{" "}
            <Link to="/register" className="text-forest-700 font-medium hover:underline">
              立即注册
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
