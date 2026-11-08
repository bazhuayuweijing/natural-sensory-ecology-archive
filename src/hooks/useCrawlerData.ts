/**
 * useCrawlerData Hook — 爬虫数据管理
 * =====================================
 * 职责：
 *   1. 自动从后端 API (/api/data/latest) 获取最新爬虫数据
 *   2. 提供 refresh() 方法触发实时爬虫刷新 (POST /api/refresh)
 *   3. 管理 loading / error / 刷新中 状态
 *
 * 使用:
 *   const { data, loading, refreshing, error, refresh } = useCrawlerData();
 */

import { useState, useEffect, useCallback } from "react";

// 后端 API 地址（开发时用 Vite proxy，生产用相对路径）
const API_BASE = (import.meta as any).env?.VITE_API_BASE || "/api";

export interface Observation {
  source: string;
  sci_name: string;
  cn_name: string;
  observed_on: string;
  latitude: number;
  longitude: number;
  place: string;
  country: string;
  observer: string;
  url: string;
  photos: number;
}

export interface SpeciesInfo {
  cn_name: string;
  sci_name: string;
  conservation: string;
  summary: string;
  wiki_url: string;
  thumbnail: string;
}

export interface CrawlerStats {
  total: number;
  china: number;
  by_species: Record<string, number>;
  by_source: Record<string, number>;
  by_month: Record<string, number>;
}

export interface CrawlerData {
  observations: Observation[];
  infos: SpeciesInfo[];
  stats: CrawlerStats;
  fileCrawledAt: string | null;
  lastCrawlTime: string | null;
}

export interface RefreshResult {
  success: boolean;
  message?: string;
  observationsCount?: number;
  infosCount?: number;
  crawledAt?: string;
  durationSeconds?: number;
}

// 内存缓存，避免重复请求
let _cachedData: CrawlerData | null = null;
let _fetchPromise: Promise<CrawlerData> | null = null;

async function fetchLatestData(force = false): Promise<CrawlerData> {
  if (!force && _cachedData) return _cachedData;
  if (!force && _fetchPromise) return _fetchPromise;

  _fetchPromise = fetch(`${API_BASE}/data/latest`)
    .then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    })
    .then((json: CrawlerData) => {
      _cachedData = json;
      return json;
    })
    .finally(() => {
      _fetchPromise = null;
    });

  return _fetchPromise;
}

export function useCrawlerData(autoLoad = true) {
  const [data, setData] = useState<CrawlerData | null>(_cachedData);
  const [loading, setLoading] = useState(!_cachedData);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (force = false) => {
    setLoading(true);
    setError(null);
    try {
      const d = await fetchLatestData(force);
      setData(d);
    } catch (e: any) {
      setError(e.message || "加载失败");
    } finally {
      setLoading(false);
    }
  }, []);

  // 自动加载
  useEffect(() => {
    if (autoLoad && !_cachedData) {
      load();
    } else if (_cachedData) {
      setData(_cachedData);
      setLoading(false);
    }
  }, [autoLoad, load]);

  // 触发爬虫刷新（需要后端运行 Python 爬虫）
  const refresh = useCallback(async (): Promise<RefreshResult> => {
    setRefreshing(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/refresh`, { method: "POST" });
      const json = await res.json();

      if (json.success) {
        // 刷新成功，强制重新获取数据
        _cachedData = null;
        const d = await fetchLatestData(true);
        setData(d);
        return {
          success: true,
          observationsCount: json.observationsCount,
          infosCount: json.infosCount,
          durationSeconds: json.durationSeconds,
          crawledAt: json.crawledAt,
          message: `刷新成功：${json.observationsCount} 条观察记录`,
        };
      } else {
        setError(json.message || "刷新失败");
        return { success: false, message: json.message };
      }
    } catch (e: any) {
      const msg = e.message || "网络错误";
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setRefreshing(false);
    }
  }, []);

  // 清除缓存并重新加载（不运行爬虫，只重新读本地文件）
  const reload = useCallback(async () => {
    _cachedData = null;
    await load(true);
  }, [load]);

  return { data, loading, refreshing, error, refresh, reload };
}
