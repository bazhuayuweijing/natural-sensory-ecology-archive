export interface Drone {
  id: string;
  name: string;
  status: "在线" | "离线" | "任务中" | "维护中";
  battery: number;
  cameraQuality: number;
  audioQuality: number;
  gasQuality: number;
  position: { lng: number; lat: number };
  currentTask: string;
  flightHours: number;
}

export const drones: Drone[] = [
  {
    id: "DRN-001",
    name: "感官鹰-01",
    status: "任务中",
    battery: 78,
    cameraQuality: 96,
    audioQuality: 92,
    gasQuality: 88,
    position: { lng: 130.35, lat: 42.96 },
    currentTask: "珲春核心繁殖区日常巡护",
    flightHours: 1284,
  },
  {
    id: "DRN-002",
    name: "感官鹰-02",
    status: "任务中",
    battery: 65,
    cameraQuality: 94,
    audioQuality: 90,
    gasQuality: 85,
    position: { lng: 130.42, lat: 43.12 },
    currentTask: "东北虎活动扩散区监测",
    flightHours: 967,
  },
  {
    id: "DRN-003",
    name: "感官鹰-03",
    status: "在线",
    battery: 100,
    cameraQuality: 98,
    audioQuality: 95,
    gasQuality: 93,
    position: { lng: 130.28, lat: 42.88 },
    currentTask: "待命中",
    flightHours: 2156,
  },
  {
    id: "DRN-004",
    name: "感官鹰-04",
    status: "维护中",
    battery: 42,
    cameraQuality: 89,
    audioQuality: 76,
    gasQuality: 81,
    position: { lng: 130.52, lat: 42.85 },
    currentTask: "气体传感器校准",
    flightHours: 3201,
  },
  {
    id: "DRN-005",
    name: "感官鹰-05",
    status: "任务中",
    battery: 88,
    cameraQuality: 97,
    audioQuality: 94,
    gasQuality: 91,
    position: { lng: 130.62, lat: 42.68 },
    currentTask: "湿地鸟类声波采集",
    flightHours: 542,
  },
  {
    id: "DRN-006",
    name: "感官鹰-06",
    status: "离线",
    battery: 15,
    cameraQuality: 91,
    audioQuality: 88,
    gasQuality: 86,
    position: { lng: 130.15, lat: 43.18 },
    currentTask: "已返航充电",
    flightHours: 1873,
  },
  {
    id: "DRN-007",
    name: "感官鹰-07",
    status: "任务中",
    battery: 71,
    cameraQuality: 95,
    audioQuality: 91,
    gasQuality: 89,
    position: { lng: 130.08, lat: 43.25 },
    currentTask: "珲春春化镇栖息地评估",
    flightHours: 1102,
  },
  {
    id: "DRN-008",
    name: "感官鹰-08",
    status: "在线",
    battery: 100,
    cameraQuality: 99,
    audioQuality: 97,
    gasQuality: 95,
    position: { lng: 131.01, lat: 42.85 },
    currentTask: "待命中",
    flightHours: 389,
  },
];

export const flightTrail = [
  { time: "08:00", lng: 130.28, lat: 42.88 },
  { time: "08:15", lng: 130.31, lat: 42.90 },
  { time: "08:30", lng: 130.35, lat: 42.96 },
  { time: "08:45", lng: 130.42, lat: 42.92 },
  { time: "09:00", lng: 130.41, lat: 42.87 },
  { time: "09:15", lng: 130.28, lat: 42.98 },
  { time: "09:30", lng: 130.42, lat: 43.12 },
  { time: "09:45", lng: 130.35, lat: 43.08 },
];
