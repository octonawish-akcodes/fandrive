"use client";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef } from "react";
import { circlePolygon } from "@/lib/geo/circle";
import type { CityInfo, MapResult } from "@/lib/plan/schema";

const COLORS = ["#e11d48", "#7c3aed", "#0891b2"];

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
          map!.addLayer({ id: `zones-${i}`, type: "fill", source: `zones-${i}`, paint: { "fill-color": COLORS[i % 3], "fill-opacity": 0.25 } });
          for (const z of m.zones) for (const v of z.venues.host)
            new Marker({ color: COLORS[i % 3] }).setLngLat([v.lon, v.lat]).setPopup(new Popup().setText(`${v.name} · ${m.partnerName} fans`)).addTo(map!);
        });
      });
    });
    return () => { cancelled = true; map?.remove(); };
  }, [city, maps]);
  return (
    <div>
      <div ref={ref} className="h-80 w-full overflow-hidden rounded-lg" role="img" aria-label={`Map of fan zones in ${city.name}`} />
      <div className="mt-2 flex flex-wrap gap-3 text-xs">{maps.map((m, i) => <span key={m.partnerId}><span className="mr-1 inline-block h-2 w-2 rounded-full" style={{ background: COLORS[i % 3] }} />{m.partnerName} fans</span>)}</div>
    </div>
  );
}
