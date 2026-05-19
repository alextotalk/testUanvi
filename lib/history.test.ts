import { beforeEach, describe, expect, it } from "vitest";
import { addHistoryEntry, getHistory, resetHistory } from "./history";

describe("history store", () => {
  beforeEach(() => {
    resetHistory();
  });

  it("starts empty", () => {
    expect(getHistory()).toEqual([]);
  });

  it("adds new entries to the front", () => {
    addHistoryEntry("first", { summary: "First", sentiment: "neutral" });
    addHistoryEntry("second", { summary: "Second", sentiment: "positive" });
    const history = getHistory();
    expect(history).toHaveLength(2);
    expect(history[0]?.summary).toBe("Second");
    expect(history[1]?.summary).toBe("First");
  });

  it("returns a defensive copy that cannot mutate the store", () => {
    addHistoryEntry("x", { summary: "X", sentiment: "neutral" });
    const snapshot = getHistory();
    snapshot.pop();
    expect(getHistory()).toHaveLength(1);
  });
});
