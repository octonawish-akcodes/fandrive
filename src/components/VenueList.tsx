import type { MapResult } from "@/lib/plan/schema";

export function VenueList({ maps }: { maps: MapResult[] }) {
  return (
    <div className="space-y-4">
      {maps.map((m) => (
        <div key={m.partnerId}>
          <h4 className="font-medium">{m.partnerName} fans</h4>
          {m.zones.length === 0 && <p className="text-sm text-zinc-500">Not enough location data for this partner here.</p>}
          {m.zones.map((z) => (
            <div key={z.id} className="mt-2 rounded-lg border border-zinc-200 p-3 text-sm dark:border-zinc-800">
              <div className="font-medium">{z.name} <span className="text-xs text-zinc-500">· fan zone, ~{z.radiusKm.toFixed(1)} km</span></div>
              <ul className="mt-1 space-y-1">
                {z.venues.host.map((v) => <li key={v.entityId}>🩸 <b>{v.name}</b>{v.address ? `, ${v.address}` : ""} <span className="text-xs text-zinc-500">{v.reasons.join(" · ")}</span></li>)}
                {z.venues.promote.map((v) => <li key={v.entityId} className="text-zinc-500">📣 {v.name} <span className="text-xs">{v.reasons.join(" · ")}</span></li>)}
              </ul>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
