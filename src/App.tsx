import { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout/Layout";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Dashboard from "@/pages/Dashboard";
import Drones from "@/pages/Drones";
import Archive from "@/pages/Archive";
import Analytics from "@/pages/Analytics";
import MLHub from "@/pages/MLHub";
import Experience from "@/pages/Experience";
import About from "@/pages/About";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuthStore } from "@/store/authStore";

export default function App() {
  const init = useAuthStore((s) => s.init);
  useEffect(() => {
    init();
  }, [init]);

  return (
    <Router>
      <Routes>
        {/* 登录注册使用独立布局 */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* 公开页面 */}
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
        </Route>
        <Route path="/about" element={<Layout />}>
          <Route index element={<About />} />
        </Route>

        {/* 需要登录的页面 */}
        <Route path="/dashboard" element={<Layout />}>
          <Route
            index
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
        </Route>
        <Route path="/drones" element={<Layout />}>
          <Route
            index
            element={
              <ProtectedRoute>
                <Drones />
              </ProtectedRoute>
            }
          />
        </Route>
        <Route path="/archive" element={<Layout />}>
          <Route
            index
            element={
              <ProtectedRoute>
                <Archive />
              </ProtectedRoute>
            }
          />
        </Route>
        <Route path="/analytics" element={<Layout />}>
          <Route
            index
            element={
              <ProtectedRoute>
                <Analytics />
              </ProtectedRoute>
            }
          />
        </Route>
        <Route path="/ml" element={<Layout />}>
          <Route
            index
            element={
              <ProtectedRoute>
                <MLHub />
              </ProtectedRoute>
            }
          />
        </Route>
        <Route path="/experience" element={<Layout />}>
          <Route
            index
            element={
              <ProtectedRoute>
                <Experience />
              </ProtectedRoute>
            }
          />
        </Route>
      </Routes>
    </Router>
  );
}
