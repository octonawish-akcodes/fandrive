"use client";
import { useState } from "react";
import type { CityInfo, MapResult } from "@/lib/plan/schema";
import { FanMap, MAP_COLORS } from "./FanMap";

export function MapCard({ city, maps }: { city: CityInfo; maps: MapResult[] }) {
  const [sel, setSel] = useState(0);
  const m = maps[Math.min(sel, maps.length - 1)];
  return (
    <div className="brut col-span-full flex flex-wrap overflow-hidden bg-sky">
      <div className="min-h-96 min-w-0 flex-[999_1_420px] border-b-[3px] border-black bg-white lg:border-r-[3px] lg:border-b-0"><FanMap city={city} maps={maps} /></div>
      <div className="flex min-w-0 flex-[1_1_300px] flex-col gap-3 p-5">
        <h3 className="font-display text-2xl">Where to host</h3>
        {maps.length > 1 && (
          <div role="tablist" aria-label="Fandom" className="flex flex-wrap gap-2">
            {maps.map((mm, i) => (
              <button key={mm.partnerId} role="tab" aria-selected={i === sel} onClick={() => setSel(i)}
                className={`press flex min-h-11 items-center gap-2 border-[3px] border-black px-3 py-1.5 font-bold ${i === sel ? "bg-black text-white" : "bg-white"}`}>
                <span className="h-3 w-3 rounded-full border-2 border-black" style={{ background: MAP_COLORS[i % MAP_COLORS.length] }} />{mm.partnerName} fans
              </button>
            ))}
          </div>
        )}
        {!m || m.zones.length === 0 ? <p className="font-semibold">Not enough location data for this fandom here.</p> : m.zones.map((z, zi) => {
          const [first, ...rest] = z.venues.host;
          return (
            <div key={z.id} className="border-[3px] border-black bg-white p-3">
              <b>{zi + 1} · {first ? first.name : z.name}</b>
              <div className="text-sm">{z.name} · fan zone ~{z.radiusKm.toFixed(1)} km{first?.reasons.length ? ` · ${first.reasons.join(" · ")}` : ""}</div>
              {rest.length > 0 && <div className="mt-1 text-sm">Also: {rest.map((v) => v.name).join(", ")}</div>}
              {z.venues.promote.length > 0 && <div className="mt-1 text-sm">Flyers only: {z.venues.promote.map((v) => v.name).join(", ")}</div>}
            </div>
          );
        })}
        <p className="text-sm font-semibold">Bars nearby get flyers, never the drive.</p>
      </div>
    </div>
  );
}
