import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST, GET } from "./route";
import { resetHistory } from "@/lib/history";
import * as summarizer from "@/lib/summarizer";

function jsonRequest(body: unknown): Request {
  return new Request("http://localhost/api/summarize", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

describe("/api/summarize integration", () => {
  beforeEach(() => {
    resetHistory();
    // Bypass the 1.5s mock delay for fast integration tests.
    vi.spyOn(summarizer, "runMockSummarizer").mockImplementation(async (text) =>
      summarizer.summarizeText(text),
    );
  });

  it("POST returns 201, a structured entry, and updated history for valid input", async () => {
    const res = await POST(
      jsonRequest({ text: "This product is amazing. The team is happy." }),
    );
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.entry.summary).toBe("This product is amazing");
    expect(data.entry.sentiment).toBe("positive");
    expect(data.entry.id).toBeTypeOf("string");
    expect(data.entry.createdAt).toBeTypeOf("string");
    expect(data.history).toHaveLength(1);
    expect(data.history[0]?.id).toBe(data.entry.id);
  });

  it("POST returns 400 when the text field is missing or empty", async () => {
    const missing = await POST(jsonRequest({}));
    expect(missing.status).toBe(400);
    expect((await missing.json()).error).toMatch(/text/i);

    const empty = await POST(jsonRequest({ text: "   " }));
    expect(empty.status).toBe(400);
    expect((await empty.json()).error).toMatch(/empty/i);
  });

  it("POST returns 400 for malformed JSON bodies", async () => {
    const res = await POST(jsonRequest("{not json"));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/json/i);
  });

  it("POST returns 500 when the summarizer throws", async () => {
    vi.spyOn(summarizer, "runMockSummarizer").mockRejectedValueOnce(
      new Error("upstream down"),
    );
    const res = await POST(jsonRequest({ text: "hello world" }));
    expect(res.status).toBe(500);
    expect((await res.json()).error).toMatch(/summarize/i);
  });

  it("GET returns the in-memory history accumulated across POSTs", async () => {
    await POST(jsonRequest({ text: "first feedback." }));
    await POST(jsonRequest({ text: "second feedback was awful." }));

    const res = await GET();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.history).toHaveLength(2);
    expect(data.history[0]?.summary).toBe("Second feedback was awful");
    expect(data.history[0]?.sentiment).toBe("negative");
    expect(data.history[1]?.summary).toBe("First feedback");
  });
});
