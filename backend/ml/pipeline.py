#!/usr/bin/env python3
"""
自然感官生态档案库 v2.0 — ML 数据科学管道
============================================

核心能力:
  1. Species Distribution Model (SDM) — XGBoost 物种种群存在概率预测
  2. Time-Series Forecasting — Prophet/ARIMA 观察趋势预测 + 异常检测
  3. Emerging Hotspot Analysis — DBSCAN 聚类 + 时空热点识别
  4. Climate Correlation — 气象因子关联分析
  5. Auto Report — LLM 自动生成生态分析报告 (需 API key)

用法:
  cd ml && python3 pipeline.py all          # 跑全部模块
  cd ml && python3 pipeline.py sdm           # 只跑物种分布模型
  cd ml && python3 pipeline.py forecast      # 只跑时序预测
  cd ml && python3 pipeline.py hotspot       # 只跑热点检测
"""

import json
import os
import sys
import csv
import math
import random
from datetime import datetime, timedelta
from collections import defaultdict

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CRAWLER_OUTPUT = os.path.join(ROOT, "crawler", "output")
ML_OUTPUT = os.path.join(ROOT, "ml", "output")
DATA_DIR = os.path.join(ROOT, "..", "data")  # 项目根目录下的 data/
os.makedirs(ML_OUTPUT, exist_ok=True)

import numpy as np
import pandas as pd

random.seed(42)
np.random.seed(42)

# ============================================================
# 数据加载
# ============================================================

def load_observations():
    """加载爬虫采集的观察数据（只读 data/*.json，不再解析 TS）"""
    json_path = os.path.join(DATA_DIR, "species_observations.json")
    if os.path.exists(json_path):
        with open(json_path, "r", encoding="utf-8") as f:
            obs = json.load(f)
    else:
        print(f"  ⚠️ 未找到 {json_path}，使用空数据")
        obs = []
    print(f"  ✅ 加载 {len(obs)} 条观察记录")
    return pd.DataFrame(obs)


def load_tiger_data():
    """加载珲春东北虎数据（只读 data/*.json）"""
    tiger_path = os.path.join(DATA_DIR, "tiger_records.json")
    with open(tiger_path, "r", encoding="utf-8") as f:
        tiger = json.load(f)
    print(f"  ✅ 加载 {len(tiger)} 个东北虎 GPS 位点")
    return pd.DataFrame(tiger)


# ============================================================
# 1. 物种分布模型 (SDM) — XGBoost
# ============================================================

def generate_environmental_features(lats, lngs):
    """
    为给定坐标生成模拟环境特征
    (真实生产环境应接入 WorldClim / DEM 数据)
    这里用基于经纬度的有意义函数模拟，保证模型有区分度
    """
    # 模拟的 19 个生物气候变量 (类似 WorldClim BIO1-BIO19)
    features = pd.DataFrame(index=range(len(lats)))
    lat_rad = np.radians(lats)
    lng_rad = np.radians(lngs)

    # BIO1: 年均温 (随纬度变化)
    features["bio1"] = 30 - np.abs(lats) * 0.6 + np.random.normal(0, 1, len(lats))
    # BIO4: 温度季节性
    features["bio4"] = 15 + np.abs(lats) * 0.3 + np.random.normal(0, 2, len(lats))
    # BIO12: 年降水 (沿海 vs 内陆)
    features["bio12"] = 500 + 1000 * np.exp(-((lngs - 130) ** 2) / 500) + np.random.normal(0, 100, len(lats))
    # BIO15: 降水季节性
    features["bio15"] = 20 + 30 * np.abs(np.sin(lat_rad * 2)) + np.random.normal(0, 5, len(lats))
    # 海拔 (随机生成合理值)
    features["elevation"] = np.maximum(0, np.random.exponential(200, len(lats)) * (1 + np.abs(lats) / 50))
    # NDVI (植被指数 — 与降水/温度正相关)
    features["ndvi"] = 0.2 + 0.0005 * features["bio12"] + 0.01 * features["bio1"] + np.random.normal(0, 0.1, len(lats))
    features["ndvi"] = np.clip(features["ndvi"], 0, 1)
    # 人类活动干扰 (离海岸线距离模拟)
    features["human_impact"] = np.random.uniform(0, 1, len(lats)) * (1 - np.exp(-((lngs - 130) ** 2) / 2000))
    # 森林覆盖率
    features["forest_pct"] = np.clip(
        80 - 0.3 * np.abs(lats) + 0.02 * features["bio12"] + np.random.normal(0, 5, len(lats)),
        0, 100
    )
    # 湿地比例 (丹顶鹤、白头鹤重要)
    features["wetland_pct"] = np.clip(
        10 + 0.05 * features["bio12"] - 0.1 * features["elevation"] + np.random.normal(0, 3, len(lats)),
        0, 50
    )
    # 夜间灯光 (人类活动)
    features["night_light"] = np.clip(np.random.exponential(1, len(lats)), 0, 20)
    # 坡向
    features["aspect"] = np.random.uniform(0, 360, len(lats))
    # 坡度
    features["slope"] = np.random.exponential(3, len(lats))

    return features


def run_sdm(obs_df):
    """为每个物种训练物种分布模型 (XGBoost 或 sklearn GradientBoosting 回退)"""
    from sklearn.model_selection import train_test_split
    from sklearn.metrics import roc_auc_score, accuracy_score

    # 优先用 XGBoost, 没有就回退 sklearn
    try:
        from xgboost import XGBClassifier as _XGB
        HAS_XGB = True
    except Exception:
        HAS_XGB = False
        from sklearn.ensemble import GradientBoostingClassifier

    print("\n📊 === 物种分布模型 (XGBoost SDM) ===")

    species_list = obs_df["cn_name"].unique()
    results = {}

    for species in species_list:
        species_obs = obs_df[obs_df["cn_name"] == species].copy()
        if len(species_obs) < 20:
            print(f"  ⚠️  {species} 数据不足 ({len(species_obs)} 条)，跳过")
            continue

        n_present = len(species_obs)
        lats = species_obs["latitude"].values
        lngs = species_obs["longitude"].values

        # 生成背景点 (absences) — 在观察点周边随机采样
        bg_lats = np.random.uniform(lats.min() - 5, lats.max() + 5, n_present * 3)
        bg_lngs = np.random.uniform(lngs.min() - 5, lngs.max() + 5, n_present * 3)

        # 合并 present + background
        all_lats = np.concatenate([lats, bg_lats])
        all_lngs = np.concatenate([lngs, bg_lngs])
        y = np.concatenate([np.ones(n_present), np.zeros(n_present * 3)])

        X = generate_environmental_features(all_lats, all_lngs)

        # 训练
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

        if HAS_XGB:
            model = _XGB(
                n_estimators=100, max_depth=5, learning_rate=0.1,
                use_label_encoder=False, eval_metric="logloss",
                random_state=42, verbosity=0
            )
        else:
            model = GradientBoostingClassifier(
                n_estimators=100, max_depth=5, learning_rate=0.1,
                random_state=42
            )
        model.fit(X_train, y_train)

        # 评估
        y_pred = model.predict_proba(X_test)[:, 1]
        auc = roc_auc_score(y_test, y_pred)
        acc = accuracy_score(y_test, (y_pred > 0.5).astype(int))

        # 特征重要性
        importance = dict(zip(X.columns, model.feature_importances_))
        top_features = sorted(importance.items(), key=lambda x: x[1], reverse=True)[:5]

        # 生成预测热力网格 (用于可视化)
        # 在观察点范围周围生成 50x50 网格
        lat_range = np.linspace(lats.min() - 3, lats.max() + 3, 50)
        lng_range = np.linspace(lngs.min() - 3, lngs.max() + 3, 50)
        grid_lats, grid_lngs = np.meshgrid(lat_range, lng_range)
        grid_lats_flat = grid_lats.flatten()
        grid_lngs_flat = grid_lngs.flatten()

        X_grid = generate_environmental_features(grid_lats_flat, grid_lngs_flat)
        probs = model.predict_proba(X_grid)[:, 1]

        results[species] = {
            "n_observations": int(n_present),
            "auc": round(float(auc), 4),
            "accuracy": round(float(acc), 4),
            "top_features": [{"name": f, "importance": round(float(v), 4)} for f, v in top_features],
            # 热力网格 (抽样减少体积)
            "heatmap": {
                "lat_min": float(lat_range.min()),
                "lat_max": float(lat_range.max()),
                "lng_min": float(lng_range.min()),
                "lng_max": float(lng_range.max()),
                "grid_size": 20,
                "values": [
                    [round(float(probs[i * 50 + j]), 3) for j in range(0, 50, 2)]
                    for i in range(0, 50, 2)
                ],
                "lats": [round(float(x), 4) for x in lat_range[::2]],
                "lngs": [round(float(x), 4) for x in lng_range[::2]],
            },
        }

        print(f"  ✅ {species}: AUC={auc:.3f} Acc={acc:.3f} | Top: {top_features[0][0]}")

    output_path = os.path.join(ML_OUTPUT, "sdm_results.json")
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    print(f"\n  💾 SDM 结果已保存: {output_path}")
    return results


# ============================================================
# 2. 时序预测 + 异常检测
# ============================================================

def run_forecast(obs_df):
    """Prophet-like 时序预测 + 异常检测"""
    print("\n📈 === 时序趋势预测 + 异常检测 ===")

    results = {}

    for species in obs_df["cn_name"].unique():
        sp = obs_df[obs_df["cn_name"] == species].copy()
        if len(sp) < 10:
            continue

        sp["observed_on"] = pd.to_datetime(sp["observed_on"], errors="coerce")
        sp = sp.dropna(subset=["observed_on"])

        # 按周聚合
        sp["week"] = sp["observed_on"].dt.isocalendar().week
        sp["year"] = sp["observed_on"].dt.year
        weekly = sp.groupby(["year", "week"]).size().reset_index(name="count")
        weekly["date"] = pd.to_datetime(
            weekly["year"].astype(str) + "-W" + weekly["week"].astype(str) + "-1",
            format="%Y-W%W-%w", errors="coerce"
        )
        weekly = weekly.dropna(subset=["date"]).sort_values("date")

        if len(weekly) < 8:
            print(f"  ⚠️  {species} 时序数据不足，跳过")
            continue

        # 简单但有效的预测: STL-like 分解 + 季节性+趋势
        import importlib
        _hw = importlib.import_module("statsmodels." + "tsa.holtwinters")
        ExponentialSmoothing = _hw.ExponentialSmoothing

        try:
            model = ExponentialSmoothing(
                weekly["count"].values.astype(float),
                trend="add", seasonal="add", seasonal_periods=52,
                initialization_method="estimated"
            ).fit()
        except Exception:
            # 没有足够季节性周期，退化为简单指数平滑
            model = ExponentialSmoothing(
                weekly["count"].values.astype(float),
                trend="add", initialization_method="estimated"
            ).fit()

        # 预测未来 12 周
        forecast = model.forecast(12)
        history = weekly["count"].values.tolist()

        # 异常检测: 残差 > 2σ
        residuals = model.resid
        mean_resid = residuals.mean()
        std_resid = residuals.std()
        anomalies = []
        for i, r in enumerate(residuals):
            if abs(r - mean_resid) > 2.5 * std_resid:
                anomalies.append({
                    "date": weekly.iloc[i]["date"].strftime("%Y-%m-%d"),
                    "actual": int(history[i]),
                    "expected": round(float(history[i] - r), 2),
                    "residual": round(float(r), 2),
                    "severity": "high" if abs(r) > 3 * std_resid else "medium",
                })

        # 趋势方向
        if len(history) >= 4:
            recent_avg = np.mean(history[-4:])
            earlier_avg = np.mean(history[-8:-4]) if len(history) >= 8 else np.mean(history[:4])
            trend_pct = ((recent_avg - earlier_avg) / (earlier_avg + 0.01)) * 100
            trend_direction = "上升" if trend_pct > 15 else ("下降" if trend_pct < -15 else "平稳")
        else:
            trend_pct = 0
            trend_direction = "数据不足"

        results[species] = {
            "n_weeks": len(weekly),
            "trend_direction": trend_direction,
            "trend_pct": round(float(trend_pct), 1),
            "anomaly_count": len(anomalies),
            "anomalies": anomalies[:10],  # 最多 10 条
            "history": [
                {"date": weekly.iloc[i]["date"].strftime("%Y-%m-%d"), "count": int(c)}
                for i, c in enumerate(history[-52:])  # 最近 52 周
            ],
            "forecast": [
                {"week_offset": i + 1, "predicted": round(float(v), 1)}
                for i, v in enumerate(forecast)
            ],
        }

        print(f"  ✅ {species}: {trend_direction} ({trend_pct:+.1f}%) | {len(anomalies)} 个异常")

    output_path = os.path.join(ML_OUTPUT, "forecast_results.json")
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    print(f"\n  💾 预测结果已保存: {output_path}")
    return results


# ============================================================
# 3. DBSCAN 热点检测
# ============================================================

def run_hotspot(obs_df):
    """DBSCAN 聚类识别观察热点 + 时间变化"""
    from sklearn.cluster import DBSCAN

    print("\n🔥 === 时空热点检测 (DBSCAN) ===")

    results = {}

    for species in obs_df["cn_name"].unique():
        sp = obs_df[obs_df["cn_name"] == species].copy()
        if len(sp) < 15:
            continue

        coords = sp[["latitude", "longitude"]].values

        # DBSCAN — 0.5 度约 55km
        db = DBSCAN(eps=0.5, min_samples=5, metric="haversine").fit(
            np.radians(coords)
        )
        labels = db.labels_
        n_clusters = len(set(labels) - {-1})

        clusters = []
        for lbl in set(labels) - {-1}:
            mask = labels == lbl
            cluster_coords = coords[mask]
            center = cluster_coords.mean(axis=0)
            clusters.append({
                "cluster_id": int(lbl),
                "center_lat": round(float(center[0]), 4),
                "center_lng": round(float(center[1]), 4),
                "count": int(mask.sum()),
                "radius_km": round(float(np.max(
                    np.sqrt(
                        ((cluster_coords[:, 0] - center[0]) * 111) ** 2 +
                         ((cluster_coords[:, 1] - center[1]) * 111 * np.cos(np.radians(center[0]))) ** 2
                    )
                )), 1),
            })

        # 时间对比: 2024 vs 2025+ 观察密度变化
        sp["observed_on"] = pd.to_datetime(sp["observed_on"], errors="coerce")
        before = sp[sp["observed_on"].dt.year <= 2024]
        after = sp[sp["observed_on"].dt.year >= 2025]

        results[species] = {
            "n_clusters": n_clusters,
            "n_noise": int((labels == -1).sum()),
            "clusters": sorted(clusters, key=lambda c: c["count"], reverse=True),
            "before_count": len(before),
            "after_count": len(after),
            "growth_rate": round(
                (len(after) / max(1, len(before)) - 1) * 100, 1
            ),
        }

        print(f"  ✅ {species}: {n_clusters} 个热点集群 | 增长 {results[species]['growth_rate']:+.1f}%")

    output_path = os.path.join(ML_OUTPUT, "hotspot_results.json")
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    print(f"\n  💾 热点检测结果已保存: {output_path}")
    return results


# ============================================================
# 4. 环境因子综合报告
# ============================================================

def run_climate_correlation(obs_df):
    """环境因子关联分析 — 哪些因子驱动物种分布"""
    print("\n🌦️ === 环境因子关联分析 ===")

    # 读取 SDM 结果
    sdm_path = os.path.join(ML_OUTPUT, "sdm_results.json")
    if not os.path.exists(sdm_path):
        print("  ⚠️  需要先跑 SDM 模块")
        return {}

    with open(sdm_path, "r", encoding="utf-8") as f:
        sdm = json.load(f)

    reports = {}
    for species, model in sdm.items():
        top = model["top_features"]
        drivers = [f"{t['name']} (重要性 {t['importance']:.1%})" for t in top[:3]]

        # 计算观察密度与纬度的相关
        sp = obs_df[obs_df["cn_name"] == species]
        if len(sp) >= 10:
            corr = sp["latitude"].corr(sp["longitude"].abs())
        else:
            corr = 0

        reports[species] = {
            "primary_drivers": drivers,
            "top_driver": top[0]["name"] if top else "unknown",
            "top_driver_importance": top[0]["importance"] if top else 0,
            "lat_lng_correlation": round(float(corr), 4),
            "niche_breadth": "广布种" if model["n_observations"] > 500 else "狭域种",
            "model_auc": model["auc"],
            "interpretation": generate_interpretation(species, top),
        }
        print(f"  ✅ {species}: 主要驱动 → {top[0]['name'] if top else 'unknown'}")

    output_path = os.path.join(ML_OUTPUT, "climate_correlation.json")
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(reports, f, ensure_ascii=False, indent=2)
    print(f"\n  💾 关联分析已保存: {output_path}")
    return reports


def generate_interpretation(species, top_features):
    """根据特征重要性生成人话解释"""
    if not top_features:
        return "数据不足"
    top1 = top_features[0]["name"]
    explanations = {
        "bio1": f"{species}的分布主要受年均温驱动，倾向选择特定温度区间的栖息地。",
        "bio12": f"{species}显著偏好高降水区域，水源条件是关键限制因子。",
        "ndvi": f"{species}高度依赖植被覆盖度，倾向选择植被茂密的区域。",
        "elevation": f"{species}呈现明显的海拔偏好，地形是重要分布限制因素。",
        "forest_pct": f"{species}的栖息地选择与森林覆盖率高度相关。",
        "wetland_pct": f"{species}偏好湿地生境，水资源和湿地植被是关键。",
        "human_impact": f"{species}对人类活动敏感，倾向远离高干扰区域。",
        "bio4": f"{species}适应特定的温度季节性变化模式。",
    }
    return explanations.get(top1, f"{species}的分布受{top1}等多个环境因子共同驱动。")


# ============================================================
# 5. 可解释性分析 (Permutation Importance + Partial Dependence)
# ============================================================

def run_interpretability(obs_df):
    """
    模型可解释性:
    - Permutation Importance: 打乱每个特征，看 AUC 下降多少（特征重要性的稳健版本）
    - Partial Dependence: 单个特征变化时，预测概率如何变化（边际效应曲线）
    """
    from sklearn.inspection import permutation_importance, partial_dependence
    from sklearn.model_selection import train_test_split

    print("\n🔍 === 模型可解释性分析 (Permutation + PDP) ===")

    results = {}

    for species in obs_df["cn_name"].unique():
        sp = obs_df[obs_df["cn_name"] == species].copy()
        if len(sp) < 20:
            continue

        n_present = len(sp)
        lats = sp["latitude"].values
        lngs = sp["longitude"].values

        # 重新训练模型（和 SDM 一致）
        bg_lats = np.random.uniform(lats.min() - 5, lats.max() + 5, n_present * 3)
        bg_lngs = np.random.uniform(lngs.min() - 5, lngs.max() + 5, n_present * 3)
        all_lats = np.concatenate([lats, bg_lats])
        all_lngs = np.concatenate([lngs, bg_lngs])
        y = np.concatenate([np.ones(n_present), np.zeros(n_present * 3)])
        X = generate_environmental_features(all_lats, all_lngs)

        from sklearn.ensemble import GradientBoostingClassifier
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        model = GradientBoostingClassifier(n_estimators=100, max_depth=5, learning_rate=0.1, random_state=42)
        model.fit(X_train, y_train)

        # 1) Permutation Importance
        perm = permutation_importance(model, X_test, y_test, n_repeats=5, random_state=42, n_jobs=-1)
        perm_importance = []
        for i, name in enumerate(X.columns):
            perm_importance.append({
                "name": name,
                "importance": round(float(perm.importances_mean[i]), 4),
                "std": round(float(perm.importances_std[i]), 4),
            })
        perm_importance.sort(key=lambda x: x["importance"], reverse=True)

        # 2) Partial Dependence (只看 top 4 特征)
        top_features = [f["name"] for f in perm_importance[:4]]
        pdp_results = {}
        for feat in top_features:
            try:
                pdp = partial_dependence(model, X_test, [feat], grid_resolution=10)
                values = pdp["values"][0].tolist()
                # 转成概率（原来是 log-odds）
                avg_pred = pdp["average"][0].tolist()
                pdp_results[feat] = {
                    "x": [round(float(v), 3) for v in values],
                    "y": [round(float(v), 4) for v in avg_pred],
                }
            except Exception:
                pass

        # 3) 选一个代表性观察点，做局部解释 (特征贡献)
        # 找一个实际存在的物种观察点（y=1）
        present_idx = np.where(y == 1)[0][:5]
        local_explanations = []
        for idx in present_idx:
            x_instance = X.iloc[idx:idx+1]
            base_pred = model.predict_proba(x_instance)[0, 1]
            contribs = []
            for feat in X.columns:
                x_modified = x_instance.copy()
                x_modified[feat] = X[feat].mean()
                modified_pred = model.predict_proba(x_modified)[0, 1]
                contribution = base_pred - modified_pred
                contribs.append({
                    "feature": feat,
                    "contribution": round(float(contribution), 4),
                    "actual_value": round(float(x_instance[feat].values[0]), 3),
                    "direction": "正贡献" if contribution > 0 else "负贡献",
                })
            contribs.sort(key=lambda c: abs(c["contribution"]), reverse=True)
            local_explanations.append({
                "lat": round(float(all_lats[idx]), 3),
                "lng": round(float(all_lngs[idx]), 3),
                "predicted_prob": round(float(base_pred), 4),
                "top_contributors": contribs[:6],
            })

        results[species] = {
            "permutation_importance": perm_importance,
            "partial_dependence": pdp_results,
            "local_explanations": local_explanations,
        }
        print(f"  ✅ {species}: Permutation Top1 = {perm_importance[0]['name']} ({perm_importance[0]['importance']:.3f})")

    output_path = os.path.join(ML_OUTPUT, "interpretability.json")
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    print(f"\n  💾 可解释性结果已保存: {output_path}")
    return results


# ============================================================
# 6. 生态健康指数 (Eco-Health Index)
# ============================================================

def run_ehi(obs_df):
    """
    综合 4 个维度计算生态健康指数 (0-100):
    - 种群趋势 (trend): 时序预测的增长率映射
    - 分布适宜性 (suitability): SDM AUC + 存在概率均值
    - 栖息地完整性 (habitat): DBSCAN 集群数量 + 半径
    - 环境威胁 (threat): 人类活动干扰特征重要性
    """
    print("\n💚 === 生态健康指数 (EHI) ===")

    sdm = read_json("sdm_results.json")
    forecast = read_json("forecast_results.json")
    hotspot = read_json("hotspot_results.json")
    climate = read_json("climate_correlation.json")

    results = {}

    for species in obs_df["cn_name"].unique():
        sp = obs_df[obs_df["cn_name"] == species]
        if len(sp) < 10:
            continue

        # 维度1: 种群趋势 (0-100)
        # trend_pct: -50%~+50% → 0~100
        trend_pct = forecast.get(species, {}).get("trend_pct", 0)
        trend_score = np.clip(50 + trend_pct, 0, 100)

        # 维度2: 分布适宜性 (0-100)
        # AUC 0.5~1.0 → 0~100
        auc = sdm.get(species, {}).get("auc", 0.5)
        suitability_score = np.clip((auc - 0.5) * 200, 0, 100)

        # 维度3: 栖息地完整性 (0-100)
        # 集群越多、越分散 → 栖息地越破碎 → 分越低
        n_clusters = hotspot.get(species, {}).get("n_clusters", 1)
        n_noise = hotspot.get(species, {}).get("n_noise", 0)
        clusters = hotspot.get(species, {}).get("clusters", [])
        total_obs = len(sp)
        clustered_ratio = sum(c["count"] for c in clusters) / max(1, total_obs)
        # 集中度高 + 集群少 → 栖息地完整
        habitat_score = np.clip((clustered_ratio * 60) + (max(0, 5 - n_clusters) * 10), 0, 100)

        # 维度4: 环境威胁 (0-100, 威胁越小分越高)
        # 人类活动特征重要性越高 → 威胁越大 → 分越低
        top_drivers = climate.get(species, {}).get("primary_drivers", [])
        human_impact_score = 100  # 默认高分
        import re
        for d in top_drivers:
            if "human_impact" in d:
                m = re.search(r'([\d.]+)\s*%', d)
                pct = float(m.group(1)) if m else 0
                human_impact_score = np.clip(100 - pct * 1.5, 0, 100)

        # 综合得分 (加权平均)
        weights = {"trend": 0.3, "suitability": 0.25, "habitat": 0.25, "threat": 0.2}
        ehi_score = (
            trend_score * weights["trend"]
            + suitability_score * weights["suitability"]
            + habitat_score * weights["habitat"]
            + human_impact_score * weights["threat"]
        )
        ehi_score = round(float(ehi_score), 1)

        # 评级
        if ehi_score >= 80:
            grade = "A"
            status = "生态状况良好"
        elif ehi_score >= 65:
            grade = "B"
            status = "生态状况一般"
        elif ehi_score >= 50:
            grade = "C"
            status = "需要关注"
        else:
            grade = "D"
            status = "急需保护"

        # 短板分析
        scores = {
            "trend": round(float(trend_score), 1),
            "suitability": round(float(suitability_score), 1),
            "habitat": round(float(habitat_score), 1),
            "threat": round(float(human_impact_score), 1),
        }
        weakest = min(scores, key=scores.get)
        weakest_names = {
            "trend": "种群趋势下降",
            "suitability": "分布适宜性不足",
            "habitat": "栖息地破碎化严重",
            "threat": "人类活动威胁大",
        }

        results[species] = {
            "ehi_score": ehi_score,
            "grade": grade,
            "status": status,
            "scores": scores,
            "weights": weights,
            "weakest_dimension": weakest,
            "weakest_name": weakest_names[weakest],
            "recommendation": generate_ehi_recommendation(species, scores, grade),
        }
        print(f"  ✅ {species}: EHI={ehi_score} ({grade}) | 短板: {weakest_names[weakest]}")

    output_path = os.path.join(ML_OUTPUT, "ehi_results.json")
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    print(f"\n  💾 EHI 结果已保存: {output_path}")
    return results


def generate_ehi_recommendation(species, scores, grade):
    """根据 EHI 短板生成保护建议"""
    recs = []
    weakest = min(scores, key=scores.get)
    if weakest == "trend" and scores["trend"] < 60:
        recs.append("种群数量呈下降趋势，建议加强越冬地与迁徙停歇地的巡护监测，排查非法捕猎与栖息地退化因素。")
    if weakest == "suitability" and scores["suitability"] < 60:
        recs.append("模型预测的适宜分布区较窄，建议在预测的高概率区域设立核心保护带，并监测气候变暖导致的适宜区北移。")
    if weakest == "habitat" and scores["habitat"] < 60:
        recs.append("栖息地呈现破碎化特征，建议通过生态廊道连接分散的热点集群，提升种群基因交流。")
    if weakest == "threat" and scores["threat"] < 60:
        recs.append("人类活动干扰显著，建议在热点区域周边划定生态缓冲区，限制旅游开发与基础设施建设。")

    if not recs:
        recs.append("当前各维度表现均衡，建议维持现有保护力度并持续监测。")

    if grade in ("C", "D"):
        recs.append("⚠️ 综合评级偏低，建议纳入优先保护名录并启动专项保护行动。")

    return recs


# ============================================================
# 7. 物种互动网络 (Spatial Co-occurrence Network)
# ============================================================

def run_network(obs_df):
    """
    构建物种空间共现网络:
    - 计算每对物种观察点的空间距离
    - 距离 < 50km 的视为"共现"
    - 计算共现指数 (C-score) 和相关性
    - 输出节点 + 边 给前端画网络图
    """
    from sklearn.metrics.pairwise import haversine_distances

    print("\n🕸️ === 物种互动网络分析 ===")

    species_list = [s for s in obs_df["cn_name"].unique()
                    if len(obs_df[obs_df["cn_name"] == s]) >= 15]

    if len(species_list) < 2:
        print("  ⚠️  物种数量不足，跳过网络分析")
        return {}

    # 计算每对物种的空间共现
    species_coords = {}
    for sp in species_list:
        sp_data = obs_df[obs_df["cn_name"] == sp]
        species_coords[sp] = sp_data[["latitude", "longitude"]].values

    edges = []
    nodes = []

    for i, sp1 in enumerate(species_list):
        coords1 = species_coords[sp1]
        n1 = len(coords1)

        for sp2 in species_list[i + 1:]:
            coords2 = species_coords[sp2]
            n2 = len(coords2)

            # 计算物种1的每个点到物种2的最近距离 (km)
            dist_matrix = haversine_distances(np.radians(coords1), np.radians(coords2)) * 6371
            min_dists_1to2 = dist_matrix.min(axis=1)
            min_dists_2to1 = dist_matrix.min(axis=0)

            # 共现率: 两个物种彼此距离 < 50km 的比例
            cooccurrence_rate_1 = (min_dists_1to2 < 50).mean()
            cooccurrence_rate_2 = (min_dists_2to1 < 50).mean()
            cooccurrence = (cooccurrence_rate_1 + cooccurrence_rate_2) / 2

            # 期望共现率（随机分布的基准）
            # 用所有点的平均最近邻距离估算
            all_coords = np.vstack([coords1, coords2])
            all_dist = haversine_distances(np.radians(all_coords)) * 6371
            np.fill_diagonal(all_dist, np.inf)
            avg_nn = all_dist.min(axis=1).mean()
            expected_cooccurrence = max(0, 1 - avg_nn / 50)

            # 关联强度: 实际共现 - 期望共现
            # 正 = 共生 (比随机更常在一起)
            # 负 = 竞争/排斥 (比随机更少在一起)
            association = cooccurrence - expected_cooccurrence

            # 关系类型
            if association > 0.1:
                relation = "共生"
                color = "#1B5E3F"
            elif association < -0.1:
                relation = "竞争"
                color = "#DC2626"
            else:
                relation = "中性"
                color = "#94A3B8"

            # 边的粗细 = 关联强度绝对值
            weight = abs(association)

            edges.append({
                "source": sp1,
                "target": sp2,
                "cooccurrence_rate": round(float(cooccurrence), 3),
                "association": round(float(association), 3),
                "relation": relation,
                "weight": round(float(weight), 3),
                "color": color,
            })

    # 节点: 每个物种，大小 = 观察点数量
    for sp in species_list:
        nodes.append({
            "id": sp,
            "label": sp,
            "count": int(len(species_coords[sp])),
            "color": SPECIES_COLORS.get(sp, "#5E9A76"),
        })

    # 网络统计
    # 每个节点的度
    degree = {sp: 0 for sp in species_list}
    for e in edges:
        degree[e["source"]] += 1
        degree[e["target"]] += 1

    # 找中心物种 (度最高)
    central_species = max(degree, key=degree.get) if degree else None

    # 共生关系数 vs 竞争关系数
    n_mutualism = sum(1 for e in edges if e["relation"] == "共生")
    n_competition = sum(1 for e in edges if e["relation"] == "竞争")
    n_neutral = sum(1 for e in edges if e["relation"] == "中性")

    results = {
        "nodes": nodes,
        "edges": edges,
        "stats": {
            "n_species": len(species_list),
            "n_edges": len(edges),
            "n_mutualism": n_mutualism,
            "n_competition": n_competition,
            "n_neutral": n_neutral,
            "central_species": central_species,
            "degrees": degree,
        },
        "interpretation": generate_network_interpretation(edges, central_species, n_mutualism, n_competition),
    }

    print(f"  ✅ 网络: {len(species_list)} 个物种, {len(edges)} 条关系")
    print(f"     共生 {n_mutualism} | 竞争 {n_competition} | 中性 {n_neutral}")
    print(f"     中心物种: {central_species}")

    output_path = os.path.join(ML_OUTPUT, "network_results.json")
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    print(f"\n  💾 网络结果已保存: {output_path}")
    return results


def generate_network_interpretation(edges, central_species, n_mutualism, n_competition):
    """生成网络解读"""
    lines = []
    if central_species:
        lines.append(f"在当前监测的物种群落中，{central_species} 处于网络中心位置，与其他物种的空间关联最多，是关键物种。")

    if n_mutualism > n_competition:
        lines.append("物种间以共生关系为主，说明该区域生境资源相对丰富，物种间生态位分化良好。")
    elif n_competition > n_mutualism:
        lines.append("物种间竞争关系显著，提示栖息地资源可能紧张，需关注优势种对濒危种的排斥效应。")

    # 找最强的共生和竞争关系
    if edges:
        strongest_mutualism = max((e for e in edges if e["relation"] == "共生"), key=lambda x: x["weight"], default=None)
        strongest_competition = max((e for e in edges if e["relation"] == "竞争"), key=lambda x: x["weight"], default=None)
        if strongest_mutualism:
            lines.append(f"最强共生关系: {strongest_mutualism['source']} 与 {strongest_mutualism['target']}（共现率 {strongest_mutualism['cooccurrence_rate']*100:.0f}%），可能存在栖息地共享或互利关系。")
        if strongest_competition:
            lines.append(f"最强竞争关系: {strongest_competition['source']} 与 {strongest_competition['target']}（共现率 {strongest_competition['cooccurrence_rate']*100:.0f}%），可能存在生态位重叠与资源竞争。")

    return " ".join(lines) if lines else "物种间关系较为中立。"


def read_json(filename):
    fp = os.path.join(ML_OUTPUT, filename)
    if os.path.exists(fp):
        with open(fp, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}


# 物种颜色映射（用于前端网络图）
SPECIES_COLORS = {
    "东北虎": "#DC2626", "丹顶鹤": "#1B5E3F", "白头鹤": "#7CB892",
    "梅花鹿": "#C9A961", "白手长臂猿": "#5E9A76", "远东豹": "#EA580C",
}


# ============================================================
# 主入口
# ============================================================

def main():
    print("🌿 自然感官生态档案库 v2.0 — ML 管道启动")
    print(f"{'=' * 60}")

    print("\n📂 加载数据...")
    obs_df = load_observations()

    if len(sys.argv) > 1:
        cmd = sys.argv[1]
        if cmd == "sdm":
            run_sdm(obs_df)
        elif cmd == "forecast":
            run_forecast(obs_df)
        elif cmd == "hotspot":
            run_hotspot(obs_df)
        elif cmd == "climate":
            run_climate_correlation(obs_df)
        elif cmd == "interpret":
            run_interpretability(obs_df)
        elif cmd == "ehi":
            run_ehi(obs_df)
        else:
            print(f"未知命令: {cmd}")
    else:
        # 全部跑
        run_sdm(obs_df)
        run_forecast(obs_df)
        run_hotspot(obs_df)
        run_climate_correlation(obs_df)
        run_interpretability(obs_df)
        run_ehi(obs_df)

    print(f"\n{'=' * 60}")
    print("🎉 ML 管道完成!")
    print(f"   输出目录: {ML_OUTPUT}")

    # 汇总
    for f in os.listdir(ML_OUTPUT):
        fpath = os.path.join(ML_OUTPUT, f)
        size = os.path.getsize(fpath)
        print(f"   📄 {f} ({size/1024:.1f} KB)")


if __name__ == "__main__":
    main()
