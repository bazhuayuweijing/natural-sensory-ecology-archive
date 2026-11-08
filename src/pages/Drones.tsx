import { Plane, Battery, Camera, Mic, Wind, MapPin, CheckCircle2, AlertCircle } from "lucide-react";
import { drones } from "@/data/droneData";
import Card from "@/components/ui/Card";

const statusConfig: Record<string, { color: string; bg: string }> = {
  在线: { color: "text-forest-700", bg: "bg-forest-100" },
  任务中: { color: "text-amber-500", bg: "bg-amber-50" },
  离线: { color: "text-gray-500", bg: "bg-gray-100" },
  维护中: { color: "text-red-500", bg: "bg-red-50" },
};

const qualityColor = (q: number) =>
  q >= 90 ? "text-forest-700" : q >= 80 ? "text-forest-500" : "text-amber-500";

const qualityBarColor = (q: number) =>
  q >= 90 ? "bg-forest-600" : q >= 80 ? "bg-moss-400" : "bg-amber-500";

export default function Drones() {
  const avgBattery = Math.round(drones.reduce((a, d) => a + d.battery, 0) / drones.length);
  const avgQuality = Math.round(
    drones.reduce((a, d) => a + d.cameraQuality + d.audioQuality + d.gasQuality, 0) /
      (drones.length * 3)
  );
  const onlineCount = drones.filter((d) => d.status !== "离线").length;

  return (
    <div className="bg-cream min-h-screen py-10">
      <div className="container">
        <div className="mb-8">
          <h1 className="font-serif text-3xl font-semibold text-forest-900">
            无人机监测
          </h1>
          <p className="text-forest-500 mt-1">
            实时监控机群状态、传感器质量与任务执行情况
          </p>
        </div>

        {/* Top summary */}
        <div className="grid grid-cols-3 gap-5 mb-8">
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-forest-100 flex items-center justify-center">
                <Plane className="w-6 h-6 text-forest-600" />
              </div>
              <div>
                <p className="text-forest-500 text-sm">机群在线率</p>
                <p className="font-serif text-2xl font-semibold text-forest-900">
                  {onlineCount}/{drones.length}
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center">
                <Battery className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <p className="text-forest-500 text-sm">平均电量</p>
                <p className="font-serif text-2xl font-semibold text-forest-900">
                  {avgBattery}%
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-moss-100 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-forest-600" />
              </div>
              <div>
                <p className="text-forest-500 text-sm">传感器质量</p>
                <p className="font-serif text-2xl font-semibold text-forest-900">
                  {avgQuality}%
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Drone list */}
        <div className="space-y-4">
          {drones.map((d) => {
            const sc = statusConfig[d.status];
            return (
              <Card key={d.id} className="p-6 hover:shadow-hover transition-shadow">
                <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                  {/* Left: drone info */}
                  <div className="flex items-start gap-4 lg:w-1/4">
                    <div className="w-14 h-14 rounded-xl bg-forest-700 flex items-center justify-center shrink-0">
                      <Plane className="w-7 h-7 text-white" strokeWidth={1.8} />
                    </div>
                    <div>
                      <h3 className="font-serif text-lg font-semibold text-forest-900">
                        {d.name}
                      </h3>
                      <p className="text-xs text-forest-400 font-mono">{d.id}</p>
                      <span
                        className={`inline-block text-xs px-2.5 py-0.5 rounded-full mt-2 ${sc.bg} ${sc.color}`}
                      >
                        {d.status}
                      </span>
                    </div>
                  </div>

                  {/* Middle: sensor quality */}
                  <div className="lg:w-1/2 grid grid-cols-3 gap-4">
                    <SensorBar
                      icon={<Camera className="w-4 h-4" />}
                      label="视觉"
                      value={d.cameraQuality}
                    />
                    <SensorBar
                      icon={<Mic className="w-4 h-4" />}
                      label="听觉"
                      value={d.audioQuality}
                    />
                    <SensorBar
                      icon={<Wind className="w-4 h-4" />}
                      label="嗅觉"
                      value={d.gasQuality}
                    />
                  </div>

                  {/* Right: battery & task */}
                  <div className="lg:w-1/4 space-y-3">
                    <div>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-forest-500 flex items-center gap-1.5">
                          <Battery className="w-4 h-4" />
                          电量
                        </span>
                        <span className="font-medium text-forest-800">{d.battery}%</span>
                      </div>
                      <div className="h-2 bg-forest-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            d.battery >= 60
                              ? "bg-forest-600"
                              : d.battery >= 30
                              ? "bg-amber-500"
                              : "bg-red-500"
                          }`}
                          style={{ width: `${d.battery}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-xs text-forest-500 flex items-start gap-1.5">
                      <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{d.currentTask}</span>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function SensorBar({
  icon,
  label,
  value,
}: {
  icon: JSX.Element;
  label: string;
  value: number;
}) {
  const isLow = value < 80;
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1.5">
        <span className="text-forest-500 flex items-center gap-1.5">
          {icon}
          {label}
        </span>
        {isLow ? (
          <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
        ) : (
          <CheckCircle2 className="w-3.5 h-3.5 text-forest-600" />
        )}
      </div>
      <div className="h-1.5 bg-forest-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${qualityBarColor(value)}`}
          style={{ width: `${value}%` }}
        />
      </div>
      <div className={`text-xs font-medium mt-1 ${qualityColor(value)}`}>
        {value}%
      </div>
    </div>
  );
}
