import { NextResponse } from "next/server";
import { runMockSummarizer } from "@/lib/summarizer";
import { addHistoryEntry, getHistory } from "@/lib/history";
import type {
  SummarizeErrorResponse,
  SummarizeSuccessResponse,
  HistoryResponse,
} from "@/lib/types";

export const runtime = "nodejs";

const MAX_INPUT_CHARS = 10_000;

export async function POST(
  request: Request,
): Promise<NextResponse<SummarizeSuccessResponse | SummarizeErrorResponse>> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON." },
      { status: 400 },
    );
  }

  const rawText = (body as { text?: unknown })?.text;
  if (typeof rawText !== "string") {
    return NextResponse.json(
      { error: "Field 'text' is required and must be a string." },
      { status: 400 },
    );
  }

  const text = rawText.trim();
  if (!text) {
    return NextResponse.json(
      { error: "Field 'text' must not be empty." },
      { status: 400 },
    );
  }
  if (text.length > MAX_INPUT_CHARS) {
    return NextResponse.json(
      { error: `Field 'text' is too long (max ${MAX_INPUT_CHARS} characters).` },
      { status: 413 },
    );
  }

  try {
    const result = await runMockSummarizer(text);
    const entry = addHistoryEntry(text, result);
    return NextResponse.json(
      { entry, history: getHistory() },
      { status: 201 },
    );
  } catch (error) {
    console.error("Summarization failed", error);
    return NextResponse.json(
      { error: "Failed to summarize text." },
      { status: 500 },
    );
  }
}

export async function GET(): Promise<NextResponse<HistoryResponse>> {
  return NextResponse.json({ history: getHistory() }, { status: 200 });
}
