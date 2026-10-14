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
    <form aria-label="Plan a drive" className="brut flex h-full flex-col gap-3 bg-sun p-6"
      onSubmit={(e) => { e.preventDefault(); onSubmit({ city: city.trim(), band, goalDonors: goal, firstTimers: true, startDate: start, endDate: end,
        partners: partners.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 8) }); }}>
      <h2 className="font-display text-2xl">Plan a drive</h2>
      <label className="flex flex-col gap-1 font-bold">City
        <input required maxLength={80} value={city} onChange={(e) => setCity(e.target.value)} placeholder="Houston, TX" className="field font-normal" />
        <span className="min-h-5 text-sm font-semibold">{cityInfo?.for === city.trim() ? `${cityInfo.label}${cityInfo.badge ? ` · Qloo data: ${cityInfo.badge}` : ""}` : ""}</span>
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1 font-bold">Ages
          <select value={band} onChange={(e) => setBand(e.target.value as "16-24" | "18-29")} className="field font-normal"><option value="16-24">16–24</option><option value="18-29">18–29</option></select>
        </label>
        <label className="flex flex-col gap-1 font-bold">Donor goal
          <input type="number" min={10} max={100000} value={goal} onChange={(e) => setGoal(Number(e.target.value))} className="field font-normal" />
        </label>
        <label className="flex flex-col gap-1 font-bold">From<input type="date" value={start} onChange={(e) => setStart(e.target.value)} className="field font-normal" /></label>
        <label className="flex flex-col gap-1 font-bold">To<input type="date" value={end} onChange={(e) => setEnd(e.target.value)} className="field font-normal" /></label>
      </div>
      <label className="flex flex-col gap-1 font-bold">Fandoms to test (optional)
        <input maxLength={500} value={partners} onChange={(e) => setPartners(e.target.value)} placeholder="Houston Astros, Bad Bunny" className="field font-normal" />
      </label>
      <button disabled={disabled} className="press mt-2 min-h-14 border-[3px] border-black bg-black px-4 py-3 font-display text-xl text-white shadow-[4px_4px_0_#FF4949] disabled:cursor-wait disabled:opacity-70">
        {disabled ? "Planning…" : "Plan my drives →"}
      </button>
    </form>
  );
}
