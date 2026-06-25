"use client";

import Link from "next/link";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { DELHI, severityMeta } from "@/lib/domain";
import type { Issue } from "@/lib/types";

const SEV_COLOR: Record<string, string> = {
  "sev-low": "#16a34a",
  "sev-med": "#f59e0b",
  "sev-high": "#ef4444",
  "sev-critical": "#b91c1c",
};

function markerIcon(severity: number) {
  const color = SEV_COLOR[severityMeta(severity).token] ?? "#6b7280";
  return L.divIcon({
    className: "",
    html: `<span style="display:block;width:16px;height:16px;border-radius:9999px;background:${color};border:2px solid #fff;box-shadow:0 0 0 1px rgba(0,0,0,0.15)"></span>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}

export default function IssueMap({ issues }: { issues: Issue[] }) {
  return (
    <MapContainer
      center={[DELHI.center.lat, DELHI.center.lng]}
      zoom={DELHI.defaultZoom}
      scrollWheelZoom
      className="h-full w-full rounded-lg"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {issues.map((i) => (
        <Marker key={i.id} position={[i.lat, i.lng]} icon={markerIcon(i.severity)}>
          <Popup>
            <div className="min-w-40">
              <p className="font-medium">{i.title}</p>
              <p className="mt-0.5 text-xs text-neutral-500">
                {severityMeta(i.severity).label} severity
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
