/**
 * RefreshButton — 数据刷新按钮
 * 放在每个数据页面右上角
 */
import { useState } from "react";
import { RefreshCw, CheckCircle2, AlertCircle, Sparkles } from "lucide-react";
import { useCrawlerData } from "@/hooks/useCrawlerData";

interface Props {
  onRefresh?: () => void;
  lastUpdated?: string | null;
  compact?: boolean;
}

export default function RefreshButton({ onRefresh, lastUpdated, compact = false }: Props) {
  const { refreshing, refresh } = useCrawlerData(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [justUpdated, setJustUpdated] = useState(false);

  const handleClick = async () => {
    setMsg(null);
    setJustUpdated(false);
    // 先通知父组件清缓存
    onRefresh?.();
    // 运行爬虫
    const result = await refresh();
    if (result.success) {
      setMsg({ type: "success", text: result.message || "数据已更新" });
      setJustUpdated(true);
    } else {
      setMsg({ type: "error", text: result.message || "刷新失败" });
    }
    // 3 秒后清除消息
    setTimeout(() => setMsg(null), 3500);
  };

  const timeAgo = (iso: string | null) => {
    if (!iso) return null;
    const d = new Date(iso);
    const now = new Date();
    const mins = Math.floor((now.getTime() - d.getTime()) / 60000);
    if (mins < 1) return "刚刚";
    if (mins < 60) return `${mins} 分钟前`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} 小时前`;
    return `${Math.floor(hrs / 24)} 天前`;
  };

  return (
    <div className="flex items-center gap-2">
      {/* 状态提示 */}
      {msg && (
        <div
          className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium animate-[fadeIn_0.2s] ${
            msg.type === "success"
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {msg.type === "success" ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
          {msg.text}
        </div>
      )}

      {/* 上次更新时间 */}
      {!msg && lastUpdated && (
        <span className="text-xs text-forest-400 hidden sm:inline">
          {justUpdated ? (
            <span className="text-green-600 font-medium flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> 刚刚更新
            </span>
          ) : (
            <>上次更新 {timeAgo(lastUpdated)}</>
          )}
        </span>
      )}

      {/* 刷新按钮 */}
      <button
        onClick={handleClick}
        disabled={refreshing}
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
          refreshing
            ? "bg-forest-100 text-forest-400 cursor-wait"
            : "bg-forest-700 text-white hover:bg-forest-800 active:scale-95 shadow-sm hover:shadow"
        } ${compact ? "px-3 py-1.5 text-xs" : ""}`}
        title="从 iNaturalist / GBIF / Wikipedia 实时刷新数据"
      >
        <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
        {refreshing ? "刷新中..." : "实时刷新数据"}
      </button>
    </div>
  );
}
