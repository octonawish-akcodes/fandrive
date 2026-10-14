import type { Creative } from "@/lib/plan/schema";
import { CopyButton } from "./CopyButton";

export function PosterCard({ c }: { c: Creative }) {
  return (
    <div className="brut flex flex-col gap-3 self-start bg-alarm p-6">
      <div className="font-bold">Poster, ready to print</div>
      <div className="flex -rotate-1 flex-col gap-2 border-[3px] border-black bg-white p-5">
        <div className="text-xs font-bold uppercase tracking-wider">{c.theme}</div>
        <div className="font-display text-3xl leading-none">{c.posterHeadline}</div>
        <p className="text-sm font-semibold">{c.posterBody}</p>
      </div>
      <div className="flex flex-wrap gap-3">
        <CopyButton text={`${c.posterHeadline}\n\n${c.posterBody}`} label="Copy poster text" />
        <CopyButton text={c.socialPosts.join("\n\n")} label="Copy 3 posts" />
      </div>
    </div>
  );
}

export function CreativePanel({ c }: { c: Creative }) {
  return (
    <section aria-labelledby="kit-h" className="brut flex flex-col gap-5 bg-white p-6">
      <h3 id="kit-h" className="font-display text-3xl">Campaign kit</h3>
      <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(100%,260px),1fr))]">
        {c.socialPosts.map((p, i) => (
          <div key={i} className={`brut-sm flex flex-col gap-3 p-4 ${["bg-sun", "bg-bubble", "bg-sky"][i % 3]}`}>
            <div className="text-sm font-bold">Social post {i + 1}</div>
            <p className="font-semibold">{p}</p>
            <div className="mt-auto"><CopyButton text={p} /></div>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-start gap-4 border-t-[3px] border-black pt-4">
        <div className="min-w-0 flex-[1_1_320px]"><div className="text-sm font-bold">Invite a friend (SMS / WhatsApp)</div><p className="font-semibold">{c.invite}</p></div>
        <CopyButton text={c.invite} label="Copy invite" />
      </div>
      <details className="border-t-[3px] border-black pt-4">
        <summary className="cursor-pointer font-bold">Partnership pitch email</summary>
        <p className="mt-2 font-bold">{c.pitchEmail.subject}</p>
        <pre className="font-sans whitespace-pre-wrap">{c.pitchEmail.body}</pre>
        <div className="mt-3"><CopyButton text={`${c.pitchEmail.subject}\n\n${c.pitchEmail.body}`} label="Copy email" /></div>
      </details>
    </section>
  );
}
