import type { Sentiment, SummaryResult } from "./types";

export const MOCK_AI_DELAY_MS = 1500;

const POSITIVE_WORDS = [
  "good", "great", "love", "excellent", "amazing", "happy",
  "best", "wonderful", "fantastic", "awesome", "delight", "enjoy",
];

const NEGATIVE_WORDS = [
  "bad", "terrible", "hate", "worst", "awful", "angry",
  "poor", "broken", "horrible", "disappointed", "annoying", "frustrat",
];

const SENTENCE_TERMINATORS = /[.!?]+/;

export function extractFirstSentence(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return "";
  const [first] = trimmed.split(SENTENCE_TERMINATORS);
  return (first ?? "").trim();
}

export function capitalize(value: string): string {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function detectSentiment(text: string): Sentiment {
  const lower = text.toLowerCase();
  const positives = POSITIVE_WORDS.filter((word) => lower.includes(word)).length;
  const negatives = NEGATIVE_WORDS.filter((word) => lower.includes(word)).length;
  if (positives > negatives) return "positive";
  if (negatives > positives) return "negative";
  return "neutral";
}

/**
 * Pure synchronous summarization logic — easy to unit-test without timers.
 * Mirrors the requirement: first sentence, capitalized, with a sentiment tag.
 */
export function summarizeText(text: string): SummaryResult {
  const firstSentence = extractFirstSentence(text);
  const summary = capitalize(firstSentence) || capitalize(text.trim());
  return {
    summary,
    sentiment: detectSentiment(text),
  };
}

/**
 * Service-layer wrapper that simulates the AI round-trip latency.
 * Kept separate from `summarizeText` so tests can exercise the
 * pure logic without waiting 1.5s.
 */
export async function runMockSummarizer(text: string): Promise<SummaryResult> {
  await new Promise((resolve) => setTimeout(resolve, MOCK_AI_DELAY_MS));
  return summarizeText(text);
}
