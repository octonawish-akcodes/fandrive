import type { Plan, RunEvent } from "@/lib/plan/schema";
import { readNdjson } from "./ndjson";

/** Feed a plan stream to dispatch. A stream that drops, breaks or ends without done/error becomes a visible error. */
export async function consumePlanStream(body: ReadableStream<Uint8Array>, dispatch: (e: RunEvent) => void): Promise<Plan | null> {
  let finished = false;
  let plan: Plan | null = null;
  try {
    for await (const e of readNdjson(body)) {
      dispatch(e);
      if (e.type === "done") { finished = true; plan = e.plan; }
      if (e.type === "error") finished = true;
    }
  } catch { /* network drop or a malformed line: reported below */ }
  if (!finished) dispatch({ type: "error", code: "upstream", message: "The connection was lost before the plan finished. Please try again." });
  return plan;
}
