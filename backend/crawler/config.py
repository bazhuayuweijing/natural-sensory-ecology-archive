"""爬虫配置 — 目标物种"""

# 每个物种配置:
#   cn_name / sci_name: 中文名 / 拉丁名
#   inat_id:   iNaturalist taxon ID (亚种无数据时用父物种)
#   gbif_key:  GBIF speciesKey
#   wikipedia_zh: 中文 Wikipedia 页面标题
#   conservation: IUCN 等级 (CR/EN/VU/NT/LC)

SPECIES = [
    {
        "cn_name": "东北虎",
        "sci_name": "Panthera tigris altaica",
        "inat_id": 4157,          # iNat: Panthera tigris (虎，包含所有亚种)
        "gbif_key": 7823675,
        "wikipedia_zh": "东北虎",
        "conservation": "EN",
        "filter_sci": "Panthera tigris altaica",  # 过滤亚种
    },
    {
        "cn_name": "丹顶鹤",
        "sci_name": "Grus japonensis",
        "inat_id": 39,
        "gbif_key": 2478197,
        "wikipedia_zh": "丹顶鹤",
        "conservation": "EN",
    },
    {
        "cn_name": "白头鹤",
        "sci_name": "Grus monacha",
        "inat_id": 26,
        "gbif_key": 2478191,
        "wikipedia_zh": "白头鹤",
        "conservation": "VU",
    },
    {
        "cn_name": "梅花鹿",
        "sci_name": "Cervus nippon",
        "inat_id": 42210,
        "gbif_key": 4404754,
        "wikipedia_zh": "梅花鹿",
        "conservation": "NT",
    },
    {
        "cn_name": "远东豹",
        "sci_name": "Panthera pardus orientalis",
        "inat_id": 4144,          # Panthera pardus (豹)
        "gbif_key": 7823767,
        "wikipedia_zh": "远东豹",
        "conservation": "CR",
        "filter_sci": "Panthera pardus orientalis",
    },
    {
        "cn_name": "白手长臂猿",
        "sci_name": "Hylobates lar",
        "inat_id": 43593,
        "gbif_key": 5944153,
        "wikipedia_zh": "白手长臂猿",
        "conservation": "EN",
    },
]

REQUEST_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (Natural Sensory Ecology Archive crawler)",
    "Accept": "application/json",
    "Accept-Language": "zh-CN,zh;q=0.9",
}

REQUEST_TIMEOUT = 20
PAGE_LIMIT = 50
MAX_PAGES = 12         # 每个物种最多爬页数
SLEEP_BETWEEN = 2.0    # 礼貌间隔
