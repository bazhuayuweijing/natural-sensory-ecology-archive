#!/usr/bin/env python3
"""
自然感官生态档案库 — 公开 API 数据爬虫
======================================
数据源（均为公开免费 API，符合 robots.txt）:
  • iNaturalist (api.inaturalist.org)
  • GBIF        (api.gbif.org)
  • Wikipedia   (zh.wikipedia.org/api/rest_v1)

输出 (保存到 crawler/output/):
  species_observations.csv  — 观察记录 (CSV + JSON)
  species_info.csv          — 物种简介 (CSV)

运行:  cd crawler && python3 nsea_crawler.py
"""

import csv, json, os, time, sys, warnings
from datetime import datetime
from urllib.parse import quote

warnings.filterwarnings("ignore")  # 忽略 LibreSSL 警告

sys.path.insert(0, os.path.dirname(__file__))
from config import SPECIES, REQUEST_HEADERS, REQUEST_TIMEOUT, PAGE_LIMIT, MAX_PAGES, SLEEP_BETWEEN
import requests

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "output")
os.makedirs(OUTPUT_DIR, exist_ok=True)

def log(msg):
    print(f"[{datetime.now().strftime('%H:%M:%S')}] {msg}", flush=True)

def safe_get(url, params=None, retries=2):
    for attempt in range(retries + 1):
        try:
            r = requests.get(url, params=params, headers=REQUEST_HEADERS, timeout=REQUEST_TIMEOUT)
            if r.status_code == 200:
                return r.json()
            elif r.status_code == 429:
                wait = int(r.headers.get("Retry-After", 5))
                log(f"  ⚠️  限流，等待 {wait}s...")
                time.sleep(wait)
            else:
                log(f"  ⚠️  HTTP {r.status_code}")
                return None
        except Exception as e:
            if attempt == retries:
                log(f"  ⚠️  {type(e).__name__}: {str(e)[:60]}")
        time.sleep(2)
    return None

# ------------------------------------------------------------
# 1. iNaturalist
# ------------------------------------------------------------
def crawl_inaturalist(species):
    all_obs = []
    tid = species["inat_id"]
    filter_sci = species.get("filter_sci")  # 可选：过滤亚种

    for page in range(1, MAX_PAGES + 1):
        data = safe_get("https://api.inaturalist.org/v1/observations", {
            "taxon_id": tid,
            "per_page": PAGE_LIMIT,
            "page": page,
            "order": "desc",
            "order_by": "observed_on",
            "verifiable": "true",
            "geo": "true",
        })
        if not data:
            break
        results = data.get("results", [])
        if not results:
            break

        for obs in results:
            geom = obs.get("geojson", {}).get("coordinates")
            if not geom:
                continue
            taxon = obs.get("taxon", {})
            sci = taxon.get("name", "")
            if filter_sci and filter_sci not in sci:
                continue  # 只保留目标亚种

            all_obs.append({
                "source": "iNaturalist",
                "sci_name": sci,
                "cn_name": species["cn_name"],
                "observed_on": obs.get("observed_on", "") or "",
                "latitude": round(geom[1], 5),
                "longitude": round(geom[0], 5),
                "place": obs.get("place_guess", "") or "",
                "country": "",
                "quality_grade": obs.get("quality_grade", "") or "",
                "observer": obs.get("user", {}).get("login", "") or "",
                "url": f"https://www.inaturalist.org/observations/{obs.get('id', '')}",
                "photos": len(obs.get("photos", [])),
            })

        log(f"  iNaturalist 页{page}: +{len(results)} 条 (累计 {len(all_obs)})")
        if len(results) < PAGE_LIMIT:
            break
        time.sleep(SLEEP_BETWEEN)

    return all_obs

# ------------------------------------------------------------
# 2. GBIF
# ------------------------------------------------------------
def crawl_gbif(species):
    all_obs = []
    key = species.get("gbif_key")
    if not key:
        return []

    for page in range(MAX_PAGES):
        data = safe_get("https://api.gbif.org/v1/occurrence/search", {
            "speciesKey": key,
            "limit": PAGE_LIMIT,
            "offset": page * PAGE_LIMIT,
            "hasCoordinate": "true",
            "hasGeospatialIssue": "false",
        })
        if not data:
            break
        results = data.get("results", [])
        if not results:
            break

        for occ in results:
            lat = occ.get("decimalLatitude")
            lng = occ.get("decimalLongitude")
            if lat is None or lng is None:
                continue

            all_obs.append({
                "source": "GBIF",
                "sci_name": occ.get("species", "") or species["sci_name"],
                "cn_name": species["cn_name"],
                "observed_on": (occ.get("eventDate", "") or "")[:10],
                "latitude": round(lat, 5),
                "longitude": round(lng, 5),
                "place": occ.get("locality", "") or "",
                "country": occ.get("country", "") or "",
                "quality_grade": "",
                "observer": occ.get("recordedBy", "") or "",
                "url": occ.get("identifier", "") or "",
                "photos": 0,
            })

        log(f"  GBIF 页{page+1}: +{len(results)} 条 (累计 {len(all_obs)})")
        if len(results) < PAGE_LIMIT:
            break
        time.sleep(SLEEP_BETWEEN)

    return all_obs

# ------------------------------------------------------------
# 3. Wikipedia 简介
# ------------------------------------------------------------
def crawl_wiki(species):
    title = quote(species.get("wikipedia_zh", ""))
    if not title:
        return None

    data = safe_get(f"https://zh.wikipedia.org/api/rest_v1/page/summary/{title}")
    if data and data.get("extract"):
        return {
            "cn_name": species["cn_name"],
            "sci_name": species["sci_name"],
            "conservation": species["conservation"],
            "summary": data["extract"][:500],
            "wiki_url": data.get("content_urls", {}).get("desktop", {}).get("page", ""),
            "thumbnail": data.get("originalimage", {}).get("source", ""),
        }

    # 退回英文
    title_en = quote(species["sci_name"].replace(" ", "_"))
    data2 = safe_get(f"https://en.wikipedia.org/api/rest_v1/page/summary/{title_en}")
    if data2 and data2.get("extract"):
        return {
            "cn_name": species["cn_name"],
            "sci_name": species["sci_name"],
            "conservation": species["conservation"],
            "summary": data2["extract"][:500],
            "wiki_url": data2.get("content_urls", {}).get("desktop", {}).get("page", ""),
            "thumbnail": data2.get("originalimage", {}).get("source", ""),
        }
    log(f"  ⚠️  Wikipedia 无简介")
    return None

# ------------------------------------------------------------
# 主流程
# ------------------------------------------------------------
def main():
    log("=" * 60)
    log("🌿 自然感官生态档案库 — 爬虫启动")
    log(f"物种数: {len(SPECIES)}")
    log(f"输出: {OUTPUT_DIR}")
    log("=" * 60)

    all_obs = []
    all_info = []

    for i, sp in enumerate(SPECIES, 1):
        log(f"\n[{i}/{len(SPECIES)}] 🍃 {sp['cn_name']} ({sp['sci_name']})")

        # Wikipedia
        info = crawl_wiki(sp)
        if info:
            all_info.append(info)
            log(f"  ✅ Wiki 简介 ({len(info['summary'])} 字)")
        time.sleep(SLEEP_BETWEEN)

        # iNaturalist
        obs = crawl_inaturalist(sp)
        log(f"  ✅ iNaturalist: {len(obs)} 条")
        all_obs.extend(obs)
        time.sleep(SLEEP_BETWEEN)

        # GBIF
        obs2 = crawl_gbif(sp)
        log(f"  ✅ GBIF: {len(obs2)} 条")
        all_obs.extend(obs2)
        time.sleep(SLEEP_BETWEEN)

    # ================================================================
    # 保存 CSV
    # ================================================================
    log("\n" + "=" * 60)
    log("📊 保存数据...")

    obs_csv = os.path.join(OUTPUT_DIR, "species_observations.csv")
    obs_fields = ["source", "sci_name", "cn_name", "observed_on", "latitude",
                  "longitude", "place", "country", "quality_grade", "observer", "url", "photos"]
    with open(obs_csv, "w", newline="", encoding="utf-8-sig") as f:
        w = csv.DictWriter(f, fieldnames=obs_fields)
        w.writeheader()
        w.writerows(all_obs)
    log(f"  ✅ {obs_csv} ({len(all_obs)} 条)")

    obs_json = os.path.join(OUTPUT_DIR, "species_observations.json")
    with open(obs_json, "w", encoding="utf-8") as f:
        json.dump(all_obs, f, ensure_ascii=False, indent=2)
    log(f"  ✅ {obs_json}")

    info_csv = os.path.join(OUTPUT_DIR, "species_info.csv")
    info_fields = ["cn_name", "sci_name", "conservation", "summary", "wiki_url", "thumbnail"]
    with open(info_csv, "w", newline="", encoding="utf-8-sig") as f:
        w = csv.DictWriter(f, fieldnames=info_fields)
        w.writeheader()
        w.writerows(all_info)
    log(f"  ✅ {info_csv} ({len(all_info)} 个物种)")

    # 统计
    log("\n📈 物种分布:")
    from collections import Counter
    for name, cnt in Counter(o["cn_name"] for o in all_obs).most_common():
        log(f"  {name}: {cnt} 条")
    log("\n📈 数据源分布:")
    for src, cnt in Counter(o["source"] for o in all_obs).most_common():
        log(f"  {src}: {cnt} 条")

    # 统计中国区域（lat 18-54, lng 73-135）
    china = [o for o in all_obs if 18 <= o["latitude"] <= 54 and 73 <= o["longitude"] <= 135]
    log(f"\n📍 中国区域记录: {len(china)} 条")

    log("\n🎉 爬虫完成！")
    log(f"   观察记录: {len(all_obs)} 条")
    log(f"   物种简介: {len(all_info)} 个")

if __name__ == "__main__":
    main()
