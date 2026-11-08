import { Link } from "react-router-dom";
import { Leaf, Mail, MapPin, Phone } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-forest-900 text-forest-100 mt-24">
      <div className="container py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl bg-forest-700 flex items-center justify-center">
                <Leaf className="w-5 h-5 text-white" />
              </div>
              <span className="font-serif font-semibold text-lg text-white">
                自然感官生态档案库
              </span>
            </div>
            <p className="text-forest-300 text-sm leading-relaxed max-w-md">
              用科技感知自然，用数据守护生态。
              <br />
              无人机驱动的多维度自然记录与交互平台，融合视觉、听觉、嗅觉，构建可交互的生态档案。
            </p>
          </div>

          <div>
            <h4 className="font-medium text-white mb-4 text-sm">产品导航</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/dashboard" className="text-forest-300 hover:text-white transition-colors">
                  数据总览
                </Link>
              </li>
              <li>
                <Link to="/drones" className="text-forest-300 hover:text-white transition-colors">
                  无人机监测
                </Link>
              </li>
              <li>
                <Link to="/archive" className="text-forest-300 hover:text-white transition-colors">
                  生态档案库
                </Link>
              </li>
              <li>
                <Link to="/analytics" className="text-forest-300 hover:text-white transition-colors">
                  数据分析
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium text-white mb-4 text-sm">合作联系</h4>
            <ul className="space-y-3 text-sm text-forest-300">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                <span>待定</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 shrink-0" />
                <span>待定</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 shrink-0" />
                <span>待定</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-forest-800 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-forest-400 text-xs">
            © 自然感官生态档案库. 保留所有权利.
          </p>
          <p className="text-forest-500 text-xs">
            生态友好型设计 · 生物干扰度低于国际标准
          </p>
        </div>
      </div>
    </footer>
  );
}
