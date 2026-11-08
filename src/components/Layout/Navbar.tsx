import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Leaf,
  LayoutDashboard,
  Plane,
  Database,
  BarChart3,
  Brain,
  Sparkles,
  Menu,
  X,
  LogOut,
  User,
  Info,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";

const navLinks = [
  { to: "/dashboard", label: "数据总览", icon: LayoutDashboard },
  { to: "/drones", label: "无人机监测", icon: Plane },
  { to: "/archive", label: "生态档案库", icon: Database },
  { to: "/analytics", label: "数据分析", icon: BarChart3 },
  { to: "/ml", label: "AI 模型中心", icon: Brain },
  { to: "/experience", label: "感官体验", icon: Sparkles },
  { to: "/about", label: "关于我们", icon: Info },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/80 backdrop-blur-xl border-b border-forest-100 shadow-soft"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <nav className="container flex items-center justify-between h-16">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-9 h-9 rounded-xl bg-forest-700 flex items-center justify-center shadow-soft group-hover:shadow-card transition-shadow">
            <Leaf className="w-5 h-5 text-white" strokeWidth={2} />
          </div>
          <span className="font-serif font-semibold text-lg text-forest-800 tracking-wide">
            自然感官档案库
          </span>
        </Link>

        <div className="hidden lg:flex items-center gap-1">
          {navLinks.map((link) => {
            const active = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? "text-forest-700 bg-forest-50"
                    : "text-forest-600 hover:text-forest-800 hover:bg-forest-50"
                }`}
              >
                <link.icon className="w-4 h-4" strokeWidth={1.8} />
                {link.label}
              </Link>
            );
          })}
        </div>

        <div className="hidden lg:flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <div className="flex items-center gap-2 text-sm text-forest-700">
                <div className="w-8 h-8 rounded-full bg-forest-100 flex items-center justify-center">
                  <User className="w-4 h-4 text-forest-600" strokeWidth={1.8} />
                </div>
                <span className="font-medium">{user?.username}</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-forest-600 hover:text-forest-800 hover:bg-forest-50 transition-colors"
              >
                <LogOut className="w-4 h-4" strokeWidth={1.8} />
                退出
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-4 py-2 rounded-lg text-sm font-medium text-forest-700 hover:bg-forest-50 transition-colors"
              >
                登录
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-forest-700 hover:bg-forest-800 transition-colors shadow-soft"
              >
                注册
              </Link>
            </div>
          )}
        </div>

        <button
          className="lg:hidden p-2 rounded-lg text-forest-700 hover:bg-forest-50"
          onClick={() => setOpen(!open)}
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </nav>

      {open && (
        <div className="lg:hidden border-t border-forest-100 bg-white">
          <div className="container py-4 flex flex-col gap-1">
            {navLinks.map((link) => {
              const active = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium ${
                    active
                      ? "text-forest-700 bg-forest-50"
                      : "text-forest-600 hover:bg-forest-50"
                  }`}
                >
                  <link.icon className="w-4 h-4" strokeWidth={1.8} />
                  {link.label}
                </Link>
              );
            })}
            <div className="border-t border-forest-100 mt-2 pt-2 flex items-center gap-2">
              {isAuthenticated ? (
                <>
                  <span className="px-3 py-2 text-sm text-forest-700">
                    {user?.username}
                  </span>
                  <button
                    onClick={() => {
                      handleLogout();
                      setOpen(false);
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-forest-600 hover:bg-forest-50"
                  >
                    <LogOut className="w-4 h-4" />
                    退出
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setOpen(false)}
                    className="flex-1 text-center px-4 py-2 rounded-lg text-sm font-medium text-forest-700 border border-forest-200"
                  >
                    登录
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setOpen(false)}
                    className="flex-1 text-center px-4 py-2 rounded-lg text-sm font-medium text-white bg-forest-700"
                  >
                    注册
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
