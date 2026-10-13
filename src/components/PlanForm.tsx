"use client";
import { useEffect, useState } from "react";

export type PlanFormValues = { city: string; band: "16-24" | "18-29"; goalDonors: number; firstTimers: boolean; startDate: string; endDate: string; partners: string[] };
const iso = (d: Date) => d.toISOString().slice(0, 10);
const plusDays = (n: number) => iso(new Date(Date.now() + n * 86_400_000));

export function PlanForm({ onSubmit, disabled, initialCity = "" }: { onSubmit: (v: PlanFormValues) => void; disabled: boolean; initialCity?: string }) {
  const [city, setCity] = useState(initialCity);
  const [band, setBand] = useState<"16-24" | "18-29">("16-24");
  const [goal, setGoal] = useState(300);
  const [start, setStart] = useState(plusDays(14));
  const [end, setEnd] = useState(plusDays(44));
  const [partners, setPartners] = useState("");
  const [cityInfo, setCityInfo] = useState<{ for: string; label: string; badge?: string } | null>(null);

  useEffect(() => {
    const q = city.trim();
    if (q.length < 2) return;
    const t = setTimeout(async () => {
      const r = await fetch(`/api/city-strength?city=${encodeURIComponent(q)}`).catch(() => null);
      if (!r) return;
      const j = await r.json().catch(() => ({}));
      setCityInfo(r.ok ? { for: q, label: `Using ${j.disambiguation ?? j.name}`, badge: j.badge } : { for: q, label: j.error ?? "City not found" });
    }, 700);
    return () => clearTimeout(t);
  }, [city]);

  return (
    <form className="grid gap-3 rounded-xl border border-zinc-200 p-4 sm:grid-cols-2 lg:grid-cols-6 dark:border-zinc-800"
      onSubmit={(e) => { e.preventDefault(); onSubmit({ city: city.trim(), band, goalDonors: goal, firstTimers: true, startDate: start, endDate: end,
        partners: partners.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 8) }); }}>
      <label className="lg:col-span-2 text-sm">City
        <input required maxLength={80} value={city} onChange={(e) => setCity(e.target.value)} placeholder="Houston, TX" className="mt-1 w-full rounded border px-2 py-1.5" />
        {cityInfo?.for === city.trim() && <span className="text-xs text-zinc-500">{cityInfo.label}{cityInfo.badge ? ` · Qloo data: ${cityInfo.badge}` : ""}</span>}
      </label>
      <label className="text-sm">Ages
        <select value={band} onChange={(e) => setBand(e.target.value as "16-24" | "18-29")} className="mt-1 w-full rounded border px-2 py-1.5"><option value="16-24">16–24</option><option value="18-29">18–29</option></select>
      </label>
      <label className="text-sm">First-time donors goal
        <input type="number" min={10} max={100000} value={goal} onChange={(e) => setGoal(Number(e.target.value))} className="mt-1 w-full rounded border px-2 py-1.5" />
      </label>
      <label className="text-sm">From<input type="date" value={start} onChange={(e) => setStart(e.target.value)} className="mt-1 w-full rounded border px-2 py-1.5" /></label>
      <label className="text-sm">To<input type="date" value={end} onChange={(e) => setEnd(e.target.value)} className="mt-1 w-full rounded border px-2 py-1.5" /></label>
      <label className="text-sm sm:col-span-2 lg:col-span-5">Partners to test (optional, comma-separated)
        <input maxLength={500} value={partners} onChange={(e) => setPartners(e.target.value)} placeholder="Houston Astros, Bad Bunny" className="mt-1 w-full rounded border px-2 py-1.5" />
      </label>
      <button disabled={disabled} className="self-end rounded bg-rose-600 px-4 py-2 font-medium text-white disabled:opacity-50">{disabled ? "Planning…" : "Plan my drives"}</button>
    </form>
  );
}
