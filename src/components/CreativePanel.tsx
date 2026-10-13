"use client";
import type { Creative } from "@/lib/plan/schema";

function Copy({ text }: { text: string }) {
  return <button type="button" onClick={() => navigator.clipboard?.writeText(text)} className="ml-2 rounded border px-2 text-xs">Copy</button>;
}

export function CreativePanel({ c }: { c: Creative }) {
  return (
    <div className="space-y-3 text-sm">
      <div className="rounded-lg bg-rose-50 p-4 dark:bg-rose-950/40">
        <div className="text-xs uppercase text-rose-700">Drive theme</div>
        <div className="text-lg font-semibold">{c.theme}</div>
        <div className="mt-2 font-medium">{c.posterHeadline}</div>
        <p>{c.posterBody}</p><Copy text={`${c.posterHeadline}\n\n${c.posterBody}`} />
      </div>
      <div><div className="text-xs uppercase text-zinc-500">Social posts</div>
        <ul className="space-y-1">{c.socialPosts.map((p, i) => <li key={i}>{p}<Copy text={p} /></li>)}</ul></div>
      <div><div className="text-xs uppercase text-zinc-500">Invite (SMS / WhatsApp)</div><p>{c.invite}<Copy text={c.invite} /></p></div>
      <details><summary className="cursor-pointer text-xs uppercase text-zinc-500">Partner pitch email</summary>
        <p className="mt-1 font-medium">{c.pitchEmail.subject}</p><pre className="whitespace-pre-wrap font-sans">{c.pitchEmail.body}</pre>
        <Copy text={`${c.pitchEmail.subject}\n\n${c.pitchEmail.body}`} /></details>
    </div>
  );
}
