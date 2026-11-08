import { create } from "zustand";

export interface User {
  id: string;
  username: string;
  email: string;
  role: "user" | "researcher";
  createdAt: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (identifier: string, password: string) => { success: boolean; message: string };
  register: (
    username: string,
    email: string,
    password: string,
    role: "user" | "researcher"
  ) => { success: boolean; message: string };
  logout: () => void;
  init: () => void;
}

const STORAGE_KEY = "nsea_users";
const SESSION_KEY = "nsea_session";

// 同步读取 localStorage，避免首次渲染时 isAuthenticated 为 false 导致路由重定向
function readSession(): { user: User | null; isAuthenticated: boolean } {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (raw) {
      const user = JSON.parse(raw) as User;
      return { user, isAuthenticated: true };
    }
  } catch {
    // ignore
  }
  return { user: null, isAuthenticated: false };
}

const initialSession = typeof window !== "undefined" ? readSession() : { user: null, isAuthenticated: false };

interface StoredUser extends User {
  password: string;
}

function loadUsers(): StoredUser[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveUsers(users: StoredUser[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
}

export const useAuthStore = create<AuthState>((set) => ({
  user: initialSession.user,
  isAuthenticated: initialSession.isAuthenticated,

  init: () => {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (raw) {
        const user = JSON.parse(raw) as User;
        set({ user, isAuthenticated: true });
      }
    } catch {
      // ignore
    }
  },

  register: (username, email, password, role) => {
    const users = loadUsers();
    if (users.some((u) => u.username === username)) {
      return { success: false, message: "用户名已被注册" };
    }
    if (users.some((u) => u.email === email)) {
      return { success: false, message: "邮箱已被注册" };
    }
    const newUser: StoredUser = {
      id: `u_${Date.now()}`,
      username,
      email,
      password,
      role,
      createdAt: new Date().toISOString(),
    };
    users.push(newUser);
    saveUsers(users);
    const { password: _pw, ...safeUser } = newUser;
    localStorage.setItem(SESSION_KEY, JSON.stringify(safeUser));
    set({ user: safeUser, isAuthenticated: true });
    return { success: true, message: "注册成功" };
  },

  login: (identifier, password) => {
    const users = loadUsers();
    const found = users.find(
      (u) =>
        (u.username === identifier || u.email === identifier) &&
        u.password === password
    );
    if (!found) {
      return { success: false, message: "账号或密码错误" };
    }
    const { password: _pw, ...safeUser } = found;
    localStorage.setItem(SESSION_KEY, JSON.stringify(safeUser));
    set({ user: safeUser, isAuthenticated: true });
    return { success: true, message: "登录成功" };
  },

  logout: () => {
    localStorage.removeItem(SESSION_KEY);
    set({ user: null, isAuthenticated: false });
  },

  // 导出所有本地数据（用户 + 会话）
  exportData: () => {
    const users = loadUsers();
    const session = localStorage.getItem(SESSION_KEY);
    const backup = {
      version: 1,
      exportedAt: new Date().toISOString(),
      users,
      session: session ? JSON.parse(session) : null,
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nsea-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  // 统计本地数据大小
  getDataStats: () => {
    const keys = Object.keys(localStorage);
    let totalBytes = 0;
    const perKey: Record<string, number> = {};
    for (const k of keys) {
      const v = localStorage.getItem(k) || "";
      const size = new Blob([k + v]).size;
      totalBytes += size;
      perKey[k] = size;
    }
    return { totalBytes, keys, perKey };
  },
}));
