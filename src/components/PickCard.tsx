import type { Partner } from "@/lib/engine/tools";
import { signed } from "@/lib/client/view";

export function PickCard({ partner, rank, agentPick, rationale }: { partner: Partner; rank: 1 | 2; agentPick: boolean; rationale?: string | null }) {
  const tag = agentPick ? `AI PICK #${rank}` : rank === 1 ? "TOP PICK" : "RUNNER-UP";
  return (
    <div className={`brut relative flex flex-col gap-2 p-6 ${rank === 1 ? "bg-sun" : "bg-bubble"}`}>
      <span className={`absolute -top-4 right-5 border-[3px] border-black px-2.5 py-1 font-bold ${rank === 1 ? "rotate-6 bg-alarm" : "-rotate-6 bg-white"}`}>{tag}</span>
      <div className="font-bold">{rank === 1 ? "Top fandom" : "Runner-up"}</div>
      <div className="font-display text-4xl leading-none break-words sm:text-5xl">{partner.name}</div>
      <div className="font-display text-6xl leading-[0.9] sm:text-7xl">{signed(partner.youthSkew)}</div>
      <div className="font-semibold">youth skew · local love {partner.localLove === null ? "below threshold" : partner.localLove.toFixed(2)}</div>
      {partner.momentum && (
        <div className="text-sm font-bold">
          {{ rising: "↑ Rising", steady: "→ Steady", cooling: "↓ Cooling" }[partner.momentum.direction]} {partner.momentum.changePct > 0 ? "+" : ""}{partner.momentum.changePct}% · Qloo trending, {partner.momentum.window}
        </div>
      )}
      {partner.fanTags && partner.fanTags.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 text-sm">
          <span className="font-bold">Fans also love:</span>
          {partner.fanTags.slice(0, 5).map((t) => <span key={t} className="border-2 border-black bg-white px-1.5 font-semibold">{t}</span>)}
        </div>
      )}
      {rationale && <p className="mt-2 border-t-[3px] border-black pt-2 font-semibold">&ldquo;{rationale}&rdquo;</p>}
    </div>
  );
}

export function SkeletonCard({ tone = "bg-white", label }: { tone?: string; label: string }) {
  return (
    <div className={`brut flex min-h-56 flex-col gap-3 p-6 ${tone}`} aria-busy="true">
      <div className="font-bold">{label}</div>
      <div className="h-10 w-3/4 animate-pulse border-[3px] border-black bg-white/60" />
      <div className="h-14 w-1/2 animate-pulse border-[3px] border-black bg-white/60" />
    </div>
  );
}
