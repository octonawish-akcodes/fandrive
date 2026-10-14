"use client";
import { useEffect, useState } from "react";

type Status = { qloo: "live" | "missing"; ai: string | null; fallbacks: number; sharedCache: boolean };

/** Small proof-of-life chips: is Qloo live, which model plans, is the shared cache on. */
export function StatusBadges() {
  const [s, setS] = useState<Status | null>(null);
  useEffect(() => { fetch("/api/status").then((r) => (r.ok ? r.json() : null)).then(setS).catch(() => undefined); }, []);
  if (!s) return null;
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs font-bold" aria-label="Service status">
      <span className={`flex items-center gap-1.5 border-2 border-black px-2 py-0.5 ${s.qloo === "live" ? "bg-mint" : "bg-alarm"}`}>
        <span className="h-2 w-2 rounded-full bg-black" />{s.qloo === "live" ? "Qloo live" : "Qloo offline"}
      </span>
      {s.ai && <span className="border-2 border-black bg-white px-2 py-0.5">AI: {s.ai}{s.fallbacks ? ` +${s.fallbacks} fallbacks` : ""}</span>}
      {s.sharedCache && <span className="border-2 border-black bg-sky px-2 py-0.5">shared cache</span>}
    </div>
  );
}
