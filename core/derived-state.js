import { computeOperatingPoint, computePrPoints, computeRocPoints } from "./metrics.js";
import { clamp } from "./math.js";

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
  const span = Math.max(1e-6, data.max - data.min);
  const min = data.min - 0.08 * span;
  const max = data.max + 0.08 * span;
  return {
    thresholdMin: min,
    thresholdMax: max,
    thresholdStep: span / 1000,
    threshold: clamp(threshold, min, max),
  };
}
