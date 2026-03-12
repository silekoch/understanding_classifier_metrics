import { describe, expect, it } from "vitest";
import {
  isThresholdTarget,
  nearestFiniteThreshold,
  thresholdFromDistPointer,
  thresholdFromMetricTrendPointer,
} from "../ui/chart-interactions.js";

describe("chart interaction helpers", () => {
  it("picks nearest point with a finite threshold", () => {
    const points = [
      { threshold: Number.NaN, fpr: 0.1, tpr: 0.9 },
      { threshold: 0.7, fpr: 0.2, tpr: 0.8 },
      { threshold: 0.4, fpr: 0.5, tpr: 0.5 },
    ];

    const nearest = nearestFiniteThreshold(points, 0.18, 0.82);
    expect(nearest).toEqual(points[1]);
  });

  it("supports custom x/y keys for PR-space nearest lookup", () => {
    const points = [
      { threshold: 0.8, recall: 0.1, precision: 0.95 },
      { threshold: 0.3, recall: 0.7, precision: 0.6 },
    ];

    const nearest = nearestFiniteThreshold(points, 0.66, 0.59, "recall", "precision");
    expect(nearest).toEqual(points[1]);
  });

  it("matches only threshold handle/line targets", () => {
    const makeTarget = (role) => ({
      getAttribute: (name) => (name === "data-role" ? role : null),
    });

    expect(isThresholdTarget(makeTarget("threshold-handle"))).toBe(true);
    expect(isThresholdTarget(makeTarget("threshold-line"))).toBe(true);
    expect(isThresholdTarget(makeTarget("other"))).toBe(false);
    expect(isThresholdTarget(null)).toBe(false);
  });

  it("falls back to current threshold when dist view is unavailable", () => {
    const view = { distView: null };
    const ids = { distSvg: {} };
    expect(thresholdFromDistPointer({ evt: {}, ids, view, getThreshold: () => 0.42 })).toBe(0.42);
  });

  it("falls back to current threshold when metric trend box is unavailable", () => {
    const state = { computed: { thresholdMin: 0, thresholdMax: 1 } };
    const view = { metricTrendBox: null };
    const ids = { metricTrendSvg: {} };
    expect(thresholdFromMetricTrendPointer({ evt: {}, state, ids, view, getThreshold: () => 0.42 })).toBe(
      0.42
    );
  });
});
