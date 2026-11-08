import { useMemo } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export interface MapPoint {
  id: string | number;
  lat: number;
  lng: number;
  color: string;
  title: string;
  subtitle?: string;
  extra?: string;
  size?: number;
  date?: string;
  event?: string;
  significance?: string;
}

interface Props {
  points: MapPoint[];
  center?: [number, number];
  zoom?: number;
  height?: number;
  world?: boolean;
}

// 自动适配视图
function FitBounds({ points }: { points: MapPoint[] }) {
  const map = useMap();
  useMemo(() => {
    if (points.length === 0) return;
    const latlngs = points.map((p) => [p.lat, p.lng] as [number, number]);
    const bounds = L.latLngBounds(latlngs);
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [30, 30], maxZoom: 10 });
    }
  }, [points, map]);
  return null;
}

export default function GlobalMap({
  points,
  center = [30, 110],
  zoom = 3,
  height = 500,
  world = false,
}: Props) {
  // 自定义深色风格圆点 marker（用 divIcon）
  const iconFor = (color: string) =>
    L.divIcon({
      className: "custom-marker",
      html: `<div style="
        width:14px;height:14px;border-radius:50%;
        background:${color};border:2px solid white;
        box-shadow:0 1px 3px rgba(0,0,0,0.3);
      "></div>`,
      iconSize: [14, 14],
      iconAnchor: [7, 7],
    });

  return (
    <div style={{ height, width: "100%" }} className="relative">
      <MapContainer
        center={center}
        zoom={world ? 2 : zoom}
        style={{ height: "100%", width: "100%", borderRadius: "16px", zIndex: 1 }}
        scrollWheelZoom={true}
      >
        {/* OpenStreetMap 标准底图 */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {points.map((p) => (
          <CircleMarker
            key={p.id}
            center={[p.lat, p.lng]}
            radius={p.size ?? 5}
            pathOptions={{
              color: "white",
              weight: 1.5,
              fillColor: p.color,
              fillOpacity: 0.85,
            }}
          >
            <Popup>
              <div style={{ minWidth: 200, maxWidth: 280 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: "#1B5E3F", marginBottom: 2 }}>
                  {p.title}
                </div>
                {p.subtitle && (
                  <div style={{ fontSize: 12, color: "#666", marginBottom: 6 }}>
                    {p.subtitle}
                  </div>
                )}
                {p.date && (
                  <div style={{ fontSize: 11, color: "#5E9A76", marginBottom: 4 }}>
                    📅 {p.date}
                  </div>
                )}
                {p.event && (
                  <div style={{ fontSize: 12, color: "#333", lineHeight: 1.5, marginBottom: 6, padding: "6px 8px", background: "#F0F7F2", borderRadius: 4 }}>
                    {p.event}
                  </div>
                )}
                {p.significance && (
                  <div style={{ fontSize: 11, color: "#C9A961", marginTop: 4 }}>
                    💡 {p.significance}
                  </div>
                )}
                {p.extra && (
                  <div style={{ fontSize: 11, color: "#999", marginTop: 4 }}>
                    {p.extra}
                  </div>
                )}
                <div style={{ fontSize: 10, color: "#bbb", marginTop: 6 }}>
                  {p.lat.toFixed(2)}°N · {p.lng.toFixed(2)}°E
                </div>
              </div>
            </Popup>
          </CircleMarker>
        ))}

        {points.length > 0 && <FitBounds points={points} />}
      </MapContainer>
    </div>
  );
}
