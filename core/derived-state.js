import { computeOperatingPoint, computePrPoints, computeRocPoints } from "./metrics.js";
import { clamp } from "./math.js";
import { computePaddedScoreRange } from "./score-range.js";

export function computeCurveState({ samples, threshold }) {
  const rocPoints = computeRocPoints(samples);
  const pr = computePrPoints(samples);
  const op = computeOperatingPoint(threshold, samples);

  return {
    roc: {
      empirical: rocPoints,
      op,
    },
    pr: {
      points: pr.points,
      prevalence: pr.prevalence,
      op: { recall: op.recall, precision: op.precision },
    },
  };
}

export function computeThresholdBounds({ data, threshold }) {
  const { minX, maxX, span } = computePaddedScoreRange(data.min, data.max);
  return {
    thresholdMin: minX,
    thresholdMax: maxX,
    thresholdStep: span / 1000,
    threshold: clamp(threshold, minX, maxX),
  };
}
