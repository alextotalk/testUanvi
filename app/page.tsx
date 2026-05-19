"use client";

import { useEffect, useState, type FormEvent } from "react";
import type { HistoryEntry, Sentiment } from "@/lib/types";

const SENTIMENT_STYLES: Record<Sentiment, string> = {
  positive: "bg-emerald-100 text-emerald-800 ring-emerald-200",
  neutral: "bg-slate-100 text-slate-700 ring-slate-200",
  negative: "bg-rose-100 text-rose-800 ring-rose-200",
};

export default function HomePage() {
  const [text, setText] = useState("");
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/summarize")
      .then((res) => (res.ok ? res.json() : { history: [] }))
      .then((data: { history?: HistoryEntry[] }) => {
        if (!cancelled && Array.isArray(data.history)) {
          setHistory(data.history);
        }
      })
      .catch(() => {
        /* initial load failure is non-fatal */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const trimmed = text.trim();
    if (!trimmed) {
      setError("Please paste some feedback before summarizing.");
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: trimmed }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data?.error ?? "Something went wrong.");
        return;
      }
      if (Array.isArray(data?.history)) {
        setHistory(data.history);
      }
      setText("");
    } catch {
      setError("Network error — please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-8 px-4 py-10">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          VibeSummarizer Pro
        </h1>
        <p className="text-sm text-slate-600">
          Paste raw user feedback below. The AI extracts a one-line summary
          and tags overall sentiment.
        </p>
      </header>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
        aria-label="summarize-form"
      >
        <label htmlFor="feedback" className="text-sm font-medium text-slate-700">
          Feedback text
        </label>
        <textarea
          id="feedback"
          value={text}
          onChange={(event) => setText(event.target.value)}
          rows={6}
          placeholder="The new dashboard is great, but the export button is broken..."
          className="w-full resize-y rounded-md border border-slate-300 bg-white p-3 text-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-300"
          disabled={isLoading}
        />
        <div className="flex items-center justify-between gap-3">
          <p
            role="alert"
            className={`text-sm ${error ? "text-rose-600" : "text-transparent"}`}
          >
            {error ?? "placeholder"}
          </p>
          <button
            type="submit"
            disabled={isLoading || text.trim().length === 0}
            className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {isLoading && (
              <span
                aria-hidden="true"
                className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent"
              />
            )}
            {isLoading ? "Summarizing…" : "Summarize"}
          </button>
        </div>
      </form>

      <section aria-label="history" className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-semibold">History</h2>
          <span className="text-xs text-slate-500">
            {history.length} {history.length === 1 ? "entry" : "entries"}
          </span>
        </div>
        {history.length === 0 ? (
          <p className="rounded-md border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
            No summaries yet. Submit some feedback above to get started.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {history.map((entry) => (
              <li
                key={entry.id}
                data-testid="history-entry"
                className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${SENTIMENT_STYLES[entry.sentiment]}`}
                  >
                    {entry.sentiment}
                  </span>
                  <time
                    dateTime={entry.createdAt}
                    className="text-xs text-slate-500"
                  >
                    {new Date(entry.createdAt).toLocaleTimeString()}
                  </time>
                </div>
                <p className="mt-2 text-sm font-medium text-slate-900">
                  {entry.summary}
                </p>
                <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                  {entry.originalText}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
