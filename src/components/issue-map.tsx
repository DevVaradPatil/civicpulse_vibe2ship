"use client";

import Link from "next/link";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, Popup, LayersControl } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { DELHI, severityMeta, CATEGORIES } from "@/lib/domain";
import { SEVERITY_HEX, CATEGORY_HEX } from "@/lib/colors";
import type { Issue } from "@/lib/types";

export type ColorBy = "severity" | "category";

function colorFor(issue: Issue, mode: ColorBy): string {
  if (mode === "category") return CATEGORY_HEX[issue.category];
  const token = severityMeta(issue.severity).token.replace("sev-", "") as
    | "low"
    | "med"
    | "high"
    | "critical";
  return SEVERITY_HEX[token];
}

function markerIcon(color: string) {
  return L.divIcon({
    className: "",
    html: `<span style="display:block;width:16px;height:16px;border-radius:9999px;background:${color};border:2px solid #fff;box-shadow:0 0 0 1px rgba(0,0,0,0.15)"></span>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}

export default function IssueMap({
  issues,
  colorBy = "severity",
}: {
  issues: Issue[];
  colorBy?: ColorBy;
}) {
  return (
    <MapContainer
      center={[DELHI.center.lat, DELHI.center.lng]}
      zoom={DELHI.defaultZoom}
      scrollWheelZoom
      className="h-full w-full"
    >
      <LayersControl position="topright">
        <LayersControl.BaseLayer checked name="Streets">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer name="Light">
          <TileLayer
            attribution='&copy; <a href="https://carto.com/attributions">CARTO</a> &copy; OpenStreetMap'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer name="Satellite">
          <TileLayer
            attribution="Tiles &copy; Esri — Source: Esri, Maxar, Earthstar Geographics"
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          />
        </LayersControl.BaseLayer>
      </LayersControl>

      {issues.map((i) => (
        <Marker key={i.id} position={[i.lat, i.lng]} icon={markerIcon(colorFor(i, colorBy))}>
          <Popup>
            <div className="min-w-40">
              <p className="font-medium">{i.title}</p>
              <p className="mt-0.5 text-xs text-neutral-500">
                {CATEGORIES[i.category].label} · {severityMeta(i.severity).label} severity
              </p>
              <Link
                href={`/issue/${i.id}`}
                className="mt-1 inline-block text-sm text-blue-600 underline"
              >
                View issue
              </Link>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
