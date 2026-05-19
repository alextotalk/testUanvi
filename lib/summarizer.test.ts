import { describe, it, expect } from "vitest";
import {
  capitalize,
  detectSentiment,
  extractFirstSentence,
  summarizeText,
} from "./summarizer";

describe("extractFirstSentence", () => {
  it("returns the first sentence before a period", () => {
    expect(
      extractFirstSentence("Hello world. Second sentence here."),
    ).toBe("Hello world");
  });

  it("handles exclamation and question marks as terminators", () => {
    expect(extractFirstSentence("What a great day! Really?")).toBe(
      "What a great day",
    );
  });

  it("returns the entire trimmed text when no terminator is present", () => {
    expect(extractFirstSentence("  no terminator here  ")).toBe(
      "no terminator here",
    );
  });

  it("returns an empty string for blank input", () => {
    expect(extractFirstSentence("   ")).toBe("");
  });
});

describe("capitalize", () => {
  it("uppercases the first character", () => {
    expect(capitalize("hello")).toBe("Hello");
  });

  it("is a no-op on empty input", () => {
    expect(capitalize("")).toBe("");
  });
});

describe("detectSentiment", () => {
  it("flags clearly positive feedback", () => {
    expect(detectSentiment("This product is amazing and I love it"))
      .toBe("positive");
  });

  it("flags clearly negative feedback", () => {
    expect(detectSentiment("This is terrible and broken"))
      .toBe("negative");
  });

  it("defaults to neutral when signals are absent or balanced", () => {
    expect(detectSentiment("The release shipped on Tuesday.")).toBe("neutral");
    expect(detectSentiment("good but also bad")).toBe("neutral");
  });
});

describe("summarizeText", () => {
  it("returns the capitalized first sentence and a sentiment tag", () => {
    const result = summarizeText(
      "the dashboard is great. there are minor bugs.",
    );
    expect(result.summary).toBe("The dashboard is great");
    expect(result.sentiment).toBe("positive");
  });

  it("falls back to capitalizing the entire trimmed text when no terminator exists", () => {
    const result = summarizeText("nothing terminates here");
    expect(result.summary).toBe("Nothing terminates here");
  });
});
