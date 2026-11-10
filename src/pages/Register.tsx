import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Leaf, User, Mail, Lock, Eye, EyeOff, ArrowRight, Shield, UserCircle } from "lucide-react";
import { useAuthStore } from "@/store/authStore";

const img = (prompt: string) =>
  `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(
    prompt
  )}&image_size=portrait_4_3`;

export default function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [role, setRole] = useState<"user" | "researcher">("user");
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { register } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 6) {
      setError("密码至少需要 6 位字符");
      return;
    }
    if (password !== confirmPwd) {
      setError("两次输入的密码不一致");
      return;
    }
    setLoading(true);
    const res = await register(username, email, password, role);
    setLoading(false);
    if (res.success) {
      navigate("/dashboard");
    } else {
      setError(res.message);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-forest-800">
        <img
          src={img("Siberian tiger walking through misty forest, majestic wild animal, realistic wildlife photography, atmospheric, green tones")}
          alt="东北虎"
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
              加入自然守护者
              <br />
              共建生态档案库
            </h1>
            <p className="text-forest-200 text-base leading-relaxed max-w-md">
              注册即可浏览全球生态档案，体验沉浸式自然教育，
              参与濒危物种保护数据共建。
            </p>
          </div>
          <div className="flex gap-6 text-sm text-forest-200">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              数据加密存储
            </div>
            <div className="flex items-center gap-2">
              <Leaf className="w-5 h-5" />
              生态友好理念
            </div>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-cream overflow-y-auto">
        <div className="w-full max-w-md py-8 animate-fade-up">
          <div className="lg:hidden flex items-center gap-2 mb-8 justify-center">
            <div className="w-10 h-10 rounded-xl bg-forest-700 flex items-center justify-center">
              <Leaf className="w-6 h-6 text-white" />
            </div>
            <span className="font-serif text-xl font-semibold text-forest-800">
              自然感官档案库
            </span>
          </div>

          <h2 className="font-serif text-3xl font-semibold text-forest-900 mb-2">
            创建账号
          </h2>
          <p className="text-forest-500 mb-8">开启你的自然感官探索之旅</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-forest-700 mb-2">用户名</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-forest-400" strokeWidth={1.8} />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-forest-200 bg-white text-forest-900 placeholder-forest-300 focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-transparent transition"
                  placeholder="请输入用户名"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-forest-700 mb-2">邮箱</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-forest-400" strokeWidth={1.8} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-forest-200 bg-white text-forest-900 placeholder-forest-300 focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-transparent transition"
                  placeholder="请输入邮箱"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-forest-700 mb-2">身份</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole("user")}
                  className={`flex items-center gap-2 p-3 rounded-xl border transition ${
                    role === "user"
                      ? "border-forest-600 bg-forest-50 text-forest-800"
                      : "border-forest-200 bg-white text-forest-500 hover:border-forest-300"
                  }`}
                >
                  <UserCircle className="w-5 h-5" strokeWidth={1.8} />
                  <span className="text-sm font-medium">普通用户</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole("researcher")}
                  className={`flex items-center gap-2 p-3 rounded-xl border transition ${
                    role === "researcher"
                      ? "border-forest-600 bg-forest-50 text-forest-800"
                      : "border-forest-200 bg-white text-forest-500 hover:border-forest-300"
                  }`}
                >
                  <Shield className="w-5 h-5" strokeWidth={1.8} />
                  <span className="text-sm font-medium">科研人员</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-forest-700 mb-2">密码</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-forest-400" strokeWidth={1.8} />
                <input
                  type={showPwd ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-11 py-3 rounded-xl border border-forest-200 bg-white text-forest-900 placeholder-forest-300 focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-transparent transition"
                  placeholder="至少 6 位字符"
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

            <div>
              <label className="block text-sm font-medium text-forest-700 mb-2">确认密码</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-forest-400" strokeWidth={1.8} />
                <input
                  type={showPwd ? "text" : "password"}
                  value={confirmPwd}
                  onChange={(e) => setConfirmPwd(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-forest-200 bg-white text-forest-900 placeholder-forest-300 focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-transparent transition"
                  placeholder="请再次输入密码"
                  required
                />
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
              {loading ? "注册中..." : "注册并登录"}
              {!loading && <ArrowRight className="w-4 h-4" strokeWidth={2} />}
            </button>
          </form>

          <p className="text-center text-sm text-forest-500 mt-8">
            已有账号？{" "}
            <Link to="/login" className="text-forest-700 font-medium hover:underline">
              返回登录
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
