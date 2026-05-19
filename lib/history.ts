import type { HistoryEntry, SummaryResult } from "./types";

const MAX_HISTORY = 50;

/**
 * In-memory, server-side store. Persists for the lifetime of the
 * Node.js process (i.e. across requests within the same dev/server session).
 * Reset between sessions and during tests via `resetHistory()`.
 */
const store: { entries: HistoryEntry[] } = { entries: [] };

function createId(): string {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function addHistoryEntry(
  originalText: string,
  result: SummaryResult,
): HistoryEntry {
  const entry: HistoryEntry = {
    id: createId(),
    originalText,
    summary: result.summary,
    sentiment: result.sentiment,
    createdAt: new Date().toISOString(),
  };
  store.entries = [entry, ...store.entries].slice(0, MAX_HISTORY);
  return entry;
}

export function getHistory(): HistoryEntry[] {
  return [...store.entries];
}

export function resetHistory(): void {
  store.entries = [];
}
