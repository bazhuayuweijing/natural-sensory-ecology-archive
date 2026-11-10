import { create } from "zustand";

export interface User {
  id: number;
  username: string;
  role: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; message: string }>;
  register: (
    username: string,
    email: string,
    password: string,
    role: string
  ) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  init: () => void;
}

const TOKEN_KEY = "nsea_token";
const USER_KEY = "nsea_user";

// 同步读取 localStorage，避免首次渲染闪烁
function readStored(): { user: User | null; token: string | null } {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    const raw = localStorage.getItem(USER_KEY);
    const user = raw ? (JSON.parse(raw) as User) : null;
    return { user, token };
  } catch {
    return { user: null, token: null };
  }
}

const stored = typeof window !== "undefined" ? readStored() : { user: null, token: null };

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000/api";

export const useAuthStore = create<AuthState>((set) => ({
  user: stored.user,
  token: stored.token,
  isAuthenticated: !!stored.token,

  init: () => {
    // 启动时验证 token 是否仍然有效
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      set({ user: null, token: null, isAuthenticated: false });
      return;
    }
    fetch(`${API_BASE}/auth/verify`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.user) {
          set({ user: data.user, isAuthenticated: true });
        } else {
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(USER_KEY);
          set({ user: null, token: null, isAuthenticated: false });
        }
      })
      .catch(() => {
        // 后端不可达时，保留本地 token（离线可用性）
      });
  },

  login: async (username, password) => {
    try {
      const res = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (data.success && data.token) {
        localStorage.setItem(TOKEN_KEY, data.token);
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
        set({ user: data.user, token: data.token, isAuthenticated: true });
        return { success: true, message: "登录成功" };
      }
      return { success: false, message: data.message || "登录失败" };
    } catch (e) {
      return { success: false, message: "网络错误，请检查后端服务是否启动" };
    }
  },

  register: async (username, email, password, role) => {
    try {
      const res = await fetch(`${API_BASE}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password, role }),
      });
      const data = await res.json();
      if (data.success && data.token) {
        localStorage.setItem(TOKEN_KEY, data.token);
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
        set({ user: data.user, token: data.token, isAuthenticated: true });
        return { success: true, message: "注册成功" };
      }
      return { success: false, message: data.message || "注册失败" };
    } catch (e) {
      return { success: false, message: "网络错误，请检查后端服务是否启动" };
    }
  },

  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    set({ user: null, token: null, isAuthenticated: false });
  },
}));

// 供 API 请求使用的 token getter
export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

// 带认证的 fetch 封装
export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getToken();
  const headers = new Headers(options.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return fetch(url, { ...options, headers });
}
