import { describe, expect, it } from "vitest";
import { computeThresholdBounds } from "../core/derived-state.js";
import { computePaddedScoreRange } from "../core/score-range.js";

describe("score range padding", () => {
  it("uses the same padded range for threshold bounds as distribution rendering", () => {
    const data = { min: -2, max: 5 };
    const padded = computePaddedScoreRange(data.min, data.max);
    const bounds = computeThresholdBounds({ data, threshold: 0.5 });

    expect(bounds.thresholdMin).toBeCloseTo(padded.minX, 12);
    expect(bounds.thresholdMax).toBeCloseTo(padded.maxX, 12);
  });
});
