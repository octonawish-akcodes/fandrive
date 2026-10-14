"use client";
import { toCurl, type Receipt } from "@/lib/qloo/receiptFormat";
import { CopyButton } from "./CopyButton";

const BASE = "https://hackathon.api.qloo.com";
const what = (r: Receipt) => r.params["filter.type"] ?? (r.path === "/search" ? `search “${r.params.query ?? ""}”` : r.path);

export function ReceiptsPanel({ receipts }: { receipts: Receipt[] }) {
  const live = receipts.filter((r) => !r.cached).length;
  return (
    <details className="brut bg-white p-5">
      <summary className="cursor-pointer font-bold">Qloo receipts: {receipts.length} requests ({live} live, {receipts.length - live} from cache)</summary>
      <p className="mt-3 text-sm font-semibold">Every Qloo request behind this plan. Copy any as curl and run it with your own <code>$QLOO_API_KEY</code>.</p>
      <div className="mt-3"><CopyButton text={receipts.map((r) => toCurl(r, BASE)).join("\n")} label="Copy all as curl" /></div>
      <ol className="mt-4 flex max-h-96 flex-col gap-2 overflow-y-auto pr-1 text-sm">
        {receipts.map((r, i) => (
          <li key={i} className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t-2 border-black pt-2">
            <span className="w-8 font-bold">{i + 1}</span>
            <code className="min-w-0 flex-[1_1_260px] break-all">{r.path} · {what(r)}{r.params["signal.location.query"] ?? r.params["filter.location.query"] ? ` · ${r.params["signal.location.query"] ?? r.params["filter.location.query"]}` : ""}</code>
            <span className={`border-2 border-black px-1.5 text-xs font-bold ${r.cached ? "bg-sky" : "bg-mint"}`}>{r.cached ? "cache" : "live"}</span>
            <CopyButton text={toCurl(r, BASE)} label="Copy curl" />
          </li>
        ))}
      </ol>
    </details>
  );
}
