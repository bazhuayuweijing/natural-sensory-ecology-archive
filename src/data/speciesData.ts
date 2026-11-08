export interface Species {
  id: string;
  name: string;
  scientificName: string;
  category: string;
  conservationStatus: "极危" | "濒危" | "易危" | "近危" | "无危";
  habitat: string;
  image: string;
  visual: string;
  audio: string;
  olfactory: string;
  description: string;
}

const img = (prompt: string, size = "square_hd") =>
  `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(
    prompt
  )}&image_size=${size}`;

export const species: Species[] = [
  {
    id: "siberian-tiger",
    name: "东北虎",
    scientificName: "Panthera tigris altaica",
    category: "猫科",
    conservationStatus: "濒危",
    habitat: "温带针阔混交林",
    image: img(
      "Siberian tiger walking through snowy forest, majestic wild animal, realistic wildlife photography, natural lighting, high detail",
      "square_hd"
    ),
    visual: "4K 可见光 + 红外双镜头影像",
    audio: "低频咆哮声纹，频率 80-400Hz",
    olfactory: "松脂香 + 潮湿泥土味 + 动物腺体气息",
    description:
      "世界上体型最大的猫科动物，主要分布于俄罗斯远东及中国东北林区。感官档案库已在珲春保护区记录 102 个活动位点，其中核心繁殖区 14 处。",
  },
  {
    id: "red-crowned-crane",
    name: "丹顶鹤",
    scientificName: "Grus japonensis",
    category: "鹤科",
    conservationStatus: "濒危",
    habitat: "湿地沼泽",
    image: img(
      "Red-crowned crane standing in wetland, elegant white bird with red crown, realistic nature photography, morning light",
      "square_hd"
    ),
    visual: "可见光影像记录求偶舞蹈",
    audio: "高亢嘹亮的鹤鸣，频率 200-3000Hz",
    olfactory: "芦苇香 + 湿地泥土腥气",
    description:
      "中国一级保护动物，全球仅存约 3000 只。无人机通过信息素引导技术，可在不惊扰的前提下记录其繁殖行为与栖息地气味变化。",
  },
  {
    id: "gibbon",
    name: "长臂猿",
    scientificName: "Hylobatidae",
    category: "长臂猿科",
    conservationStatus: "濒危",
    habitat: "热带雨林树冠层",
    image: img(
      "Gibbon swinging through tropical rainforest canopy, expressive primate, realistic wildlife photography, dappled sunlight",
      "square_hd"
    ),
    visual: "高空俯拍树冠层活动轨迹",
    audio: "标志性晨鸣，频率 400-5000Hz",
    olfactory: "热带花卉甜香 + 腐殖土气息",
    description:
      "热带雨林的旗舰物种，其晨鸣是雨林健康的重要指标。感官档案库通过 360° 全景影像配合定向声效，让学生沉浸式感受其生态位。",
  },
  {
    id: "amur-leopard",
    name: "远东豹",
    scientificName: "Panthera pardus orientalis",
    category: "猫科",
    conservationStatus: "极危",
    habitat: "温带阔叶林",
    image: img(
      "Amur leopard with beautiful spotted fur in temperate forest, rare wild cat, realistic wildlife photography, golden hour",
      "square_hd"
    ),
    visual: "红外夜视影像记录夜行行为",
    audio: "低频喉音，频率 60-300Hz",
    olfactory: "落叶腐殖味 + 猎物残留气息",
    description:
      "全球仅存约 120 只的极危物种。红外镜头可在夜间捕捉其活动，气味传感器监测其领地标记行为，为种群恢复提供关键数据。",
  },
  {
    id: "hooded-crane",
    name: "白头鹤",
    scientificName: "Grus monacha",
    category: "鹤科",
    conservationStatus: "易危",
    habitat: "湿地农田",
    image: img(
      "Hooded crane flock in wetland field, grey birds with white heads, realistic nature photography, soft overcast light",
      "square_hd"
    ),
    visual: "群体活动可见光影像",
    audio: "群鸣合唱，频率 300-2500Hz",
    olfactory: "稻田泥土香 + 水草气息",
    description:
      "迁徙性涉禽，在中俄边境湿地停歇。无人机声波阵列可精准定位群鸣方向，结合气味数据判断觅食地环境质量。",
  },
  {
    id: "sika-deer",
    name: "梅花鹿",
    scientificName: "Cervus nippon",
    category: "鹿科",
    conservationStatus: "近危",
    habitat: "针阔混交林缘",
    image: img(
      "Sika deer with spotted coat in forest clearing, graceful animal, realistic wildlife photography, soft natural light",
      "square_hd"
    ),
    visual: "可见光 + 红外双模式影像",
    audio: "鹿鸣与蹄声，频率 100-1200Hz",
    olfactory: "青草气息 + 树皮树脂香",
    description:
      "东北虎的主要猎物之一，其种群健康直接影响顶级捕食者。档案库记录梅花鹿活动轨迹，为分析东北虎栖息地选择提供关联数据。",
  },
];
