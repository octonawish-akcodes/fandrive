/* eslint-disable @typescript-eslint/no-explicit-any */
import { MockLanguageModelV4 } from "ai/test";

const usage = { inputTokens: { total: 1, noCache: 1, cacheRead: undefined, cacheWrite: undefined }, outputTokens: { total: 1, text: 1, reasoning: undefined } };
const done = (content: any[], unified: "tool-calls" | "stop") => ({ content, finishReason: { unified, raw: undefined }, usage, warnings: [] });

export const calls = (...cs: [string, unknown][]) =>
  done(cs.map(([toolName, input], k) => ({ type: "tool-call", toolCallId: `c${k}-${toolName}-${Math.random()}`, toolName, input: JSON.stringify(input) })), "tool-calls");
export const text = (t: string) => done([{ type: "text", text: t }], "stop");
export const mockModel = (results: any[]) => new MockLanguageModelV4({ doGenerate: results as any });
export const failingModel = (message = "429 RESOURCE_EXHAUSTED") => new MockLanguageModelV4({ doGenerate: async () => { throw new Error(message); } });
