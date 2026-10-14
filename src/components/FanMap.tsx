"use client";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef } from "react";
import { circlePolygon } from "@/lib/geo/circle";
import type { CityInfo, MapResult } from "@/lib/plan/schema";

export const MAP_COLORS = ["#FF4949", "#3D5AFE", "#23C78A"];
const COLORS = MAP_COLORS;

export function FanMap({ city, maps }: { city: CityInfo; maps: MapResult[] }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let map: import("maplibre-gl").Map | undefined;
    let cancelled = false;
    import("maplibre-gl").then(({ Map: MapLibreMap, Marker, Popup, setWorkerUrl, getVersion }) => {
      setWorkerUrl(`/maplibre-gl-worker.mjs?v=${getVersion()}`); // see scripts/copy-maplibre-worker.mjs
      if (cancelled || !ref.current) return;
      map = new MapLibreMap({ container: ref.current, style: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json", center: [city.lon, city.lat], zoom: 10, attributionControl: { compact: true } });
      map.on("load", () => {
        maps.forEach((m, i) => {
          const features = m.zones.map((z) => ({ type: "Feature" as const, properties: { name: z.name }, geometry: { type: "Polygon" as const, coordinates: [circlePolygon(z.lat, z.lon, z.radiusKm + 0.5)] } }));
          map!.addSource(`zones-${i}`, { type: "geojson", data: { type: "FeatureCollection", features } });
          map!.addLayer({ id: `zones-${i}`, type: "fill", source: `zones-${i}`, paint: { "fill-color": COLORS[i % COLORS.length], "fill-opacity": 0.3 } });
          map!.addLayer({ id: `zones-${i}-line`, type: "line", source: `zones-${i}`, paint: { "line-color": "#000000", "line-width": 2 } });
          for (const z of m.zones) for (const v of z.venues.host)
            new Marker({ color: COLORS[i % COLORS.length] }).setLngLat([v.lon, v.lat]).setPopup(new Popup().setText(`${v.name} · ${m.partnerName} fans`)).addTo(map!);
        });
      });
    });
    return () => { cancelled = true; map?.remove(); };
  }, [city, maps]);
  return (
    <div className="relative h-full min-h-96">
      <div ref={ref} className="h-full min-h-96 w-full" role="img" aria-label={`Map of fan zones in ${city.name}: ${maps.map((m) => `${m.partnerName} fans near ${m.zones.map((z) => z.name).join(", ")}`).join("; ")}`} />
      <div className="absolute top-3 left-3 flex flex-wrap gap-2 text-sm font-bold">{maps.map((m, i) => <span key={m.partnerId} className="flex items-center gap-1.5 border-2 border-black bg-white px-2 py-0.5"><span className="h-3 w-3 rounded-full border-2 border-black" style={{ background: COLORS[i % COLORS.length] }} />{m.partnerName} fans</span>)}</div>
    </div>
  );
}
