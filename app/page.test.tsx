import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import HomePage from "./page";
import type { HistoryEntry } from "@/lib/types";

function mockEntry(overrides: Partial<HistoryEntry> = {}): HistoryEntry {
  return {
    id: "test-id",
    originalText: "The dashboard is great.",
    summary: "The dashboard is great",
    sentiment: "positive",
    createdAt: new Date("2025-01-01T12:00:00Z").toISOString(),
    ...overrides,
  };
}

function setupFetchMock(handlers: {
  get?: () => { ok: boolean; data: unknown };
  post?: (body: unknown) => { ok: boolean; data: unknown; status?: number };
}) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const method = (init?.method ?? "GET").toUpperCase();
    if (method === "GET") {
      const result = handlers.get?.() ?? { ok: true, data: { history: [] } };
      return new Response(JSON.stringify(result.data), {
        status: result.ok ? 200 : 500,
        headers: { "Content-Type": "application/json" },
      });
    }
    const body = init?.body ? JSON.parse(String(init.body)) : null;
    const result = handlers.post?.(body) ?? {
      ok: true,
      data: { entry: mockEntry(), history: [mockEntry()] },
    };
    return new Response(JSON.stringify(result.data), {
      status: result.status ?? (result.ok ? 201 : 400),
      headers: { "Content-Type": "application/json" },
    });
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("<HomePage />", () => {
  beforeEach(() => {
    setupFetchMock({});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("disables the Summarize button while the textarea is empty", async () => {
    render(<HomePage />);
    const button = await screen.findByRole("button", { name: /summarize/i });
    expect(button).toBeDisabled();
  });

  it("submits the textarea contents to /api/summarize on button click", async () => {
    const fetchMock = setupFetchMock({
      post: (body) => ({
        ok: true,
        status: 201,
        data: {
          entry: mockEntry({ originalText: (body as { text: string }).text }),
          history: [mockEntry({ originalText: (body as { text: string }).text })],
        },
      }),
    });
    const user = userEvent.setup();
    render(<HomePage />);

    const textarea = screen.getByLabelText(/feedback text/i);
    await user.type(textarea, "The dashboard is great.");
    const button = screen.getByRole("button", { name: /summarize/i });
    expect(button).toBeEnabled();
    await user.click(button);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/summarize",
        expect.objectContaining({ method: "POST" }),
      );
    });
    const postCall = fetchMock.mock.calls.find(
      ([, init]) => (init as RequestInit | undefined)?.method === "POST",
    );
    expect(postCall).toBeDefined();
    expect(JSON.parse(String((postCall![1] as RequestInit).body))).toEqual({
      text: "The dashboard is great.",
    });
  });

  it("shows the loading state while the request is in-flight, then renders the new history entry", async () => {
    let resolveResponse: ((value: Response) => void) | undefined;
    const fetchMock = vi.fn(
      async (_input: RequestInfo | URL, init?: RequestInit) => {
        if ((init?.method ?? "GET") === "GET") {
          return new Response(JSON.stringify({ history: [] }), { status: 200 });
        }
        return new Promise<Response>((resolve) => {
          resolveResponse = resolve;
        });
      },
    );
    vi.stubGlobal("fetch", fetchMock);

    const user = userEvent.setup();
    render(<HomePage />);
    await user.type(screen.getByLabelText(/feedback text/i), "Hello world.");
    await user.click(screen.getByRole("button", { name: /summarize/i }));

    expect(
      await screen.findByRole("button", { name: /summarizing/i }),
    ).toBeDisabled();

    resolveResponse?.(
      new Response(
        JSON.stringify({
          entry: mockEntry({ summary: "Hello world" }),
          history: [mockEntry({ summary: "Hello world" })],
        }),
        { status: 201 },
      ),
    );

    // Loading label clears once the response resolves (button stays
    // disabled because the textarea is cleared on success — expected UX).
    await waitFor(() =>
      expect(
        screen.queryByRole("button", { name: /summarizing/i }),
      ).not.toBeInTheDocument(),
    );
    expect(
      screen.getByRole("button", { name: /^summarize$/i }),
    ).toBeInTheDocument();
    const entries = await screen.findAllByTestId("history-entry");
    expect(entries).toHaveLength(1);
    expect(entries[0]).toHaveTextContent("Hello world");
  });

  it("surfaces server error messages without crashing", async () => {
    setupFetchMock({
      post: () => ({
        ok: false,
        status: 400,
        data: { error: "Field 'text' must not be empty." },
      }),
    });
    const user = userEvent.setup();
    render(<HomePage />);
    await user.type(screen.getByLabelText(/feedback text/i), "x");
    await user.click(screen.getByRole("button", { name: /summarize/i }));

    expect(
      await screen.findByText(/must not be empty/i),
    ).toBeInTheDocument();
  });

  it("hydrates the history list from GET /api/summarize on mount", async () => {
    setupFetchMock({
      get: () => ({
        ok: true,
        data: {
          history: [
            mockEntry({ id: "a", summary: "First summary" }),
            mockEntry({ id: "b", summary: "Second summary", sentiment: "negative" }),
          ],
        },
      }),
    });
    render(<HomePage />);
    expect(await screen.findByText(/first summary/i)).toBeInTheDocument();
    expect(await screen.findByText(/second summary/i)).toBeInTheDocument();
  });
});
