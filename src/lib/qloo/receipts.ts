import { AsyncLocalStorage } from "node:async_hooks";
import type { Receipt } from "./receiptFormat";

export { toCurl, type Receipt } from "./receiptFormat";

const store = new AsyncLocalStorage<Receipt[]>();
const MAX = 400;

/** Called by the Qloo client for every answered request; a no-op outside a run. */
export function recordReceipt(r: Receipt) {
  const s = store.getStore();
  if (s && s.length < MAX) s.push(r);
}

/** Run fn with receipts collected into `into` (shared by every await inside it). */
export function runWithReceipts<T>(into: Receipt[], fn: () => Promise<T>): Promise<T> {
  return store.run(into, fn);
}

export async function collectReceipts<T>(fn: () => Promise<T>): Promise<{ result: T; receipts: Receipt[] }> {
  const receipts: Receipt[] = [];
  const result = await runWithReceipts(receipts, fn);
  return { result, receipts };
}
