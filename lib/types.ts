export type Sentiment = "positive" | "neutral" | "negative";

export interface SummaryResult {
  summary: string;
  sentiment: Sentiment;
}

export interface HistoryEntry extends SummaryResult {
  id: string;
  originalText: string;
  createdAt: string;
}

export interface SummarizeRequestBody {
  text?: unknown;
}

export interface SummarizeSuccessResponse {
  entry: HistoryEntry;
  history: HistoryEntry[];
}

export interface SummarizeErrorResponse {
  error: string;
}

export interface HistoryResponse {
  history: HistoryEntry[];
}
