import type { Plan } from "@/lib/plan/schema";
import type { Recording } from "./replay";

type Loaded<T> = T | { error: string };

async function getJson<T>(url: string, f: typeof fetch, notFound: string, failed: string): Promise<Loaded<T>> {
  try {
    const r = await f(url);
    if (r.status === 404) return { error: notFound };
    if (!r.ok) return { error: failed };
    return (await r.json()) as T;
  } catch {
    return { error: failed };
  }
}

export const loadRecording = (slug: string, f: typeof fetch = fetch) =>
  getJson<Recording>(`/examples/${slug}.json`, f, "This example isn't available yet. Run the city live with the form above.", "Couldn't load the example. Check your connection and try again.");

export const loadSavedPlan = (id: string, f: typeof fetch = fetch) =>
  getJson<Plan>(`/api/plan/${encodeURIComponent(id)}`, f, "We couldn't find that plan. Shared plans are kept for 120 days.", "Couldn't load the plan. Check your connection and try again.");
