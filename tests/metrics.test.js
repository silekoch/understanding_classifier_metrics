import { describe, expect, it } from "vitest";
import {
  computeAucRank,
  computeMetricCurves,
  computeOperatingPoint,
  computePrPoints,
  computeRocPoints,
} from "../core/metrics.js";

function computeAucTrapezoidReference(points) {
  let auc = 0;
  for (let i = 1; i < points.length; i += 1) {
    const x0 = points[i - 1].fpr;
    const x1 = points[i].fpr;
    const y0 = points[i - 1].tpr;
    const y1 = points[i].tpr;
    auc += (x1 - x0) * (y0 + y1) * 0.5;
  }
  return auc;
}

function makeRng(seed) {
  let x = seed >>> 0;
  return () => {
    x = (1664525 * x + 1013904223) >>> 0;
    return x / 4294967296;
  };
}

function makeSyntheticScores(seed, nPerClass, shift, noise = 1) {
  const rng = makeRng(seed);
  const data = [];
  for (let i = 0; i < nPerClass; i += 1) {
    data.push({ score: (rng() - 0.5) * noise, label: 0 });
    data.push({ score: shift + (rng() - 0.5) * noise, label: 1 });
  }
  return data;
}

function makeTiedScores(seed, nPerClass) {
  const rng = makeRng(seed);
  const bins = [-2, -1, 0, 1, 2];
  const data = [];
  for (let i = 0; i < nPerClass; i += 1) {
    data.push({ score: bins[Math.floor(rng() * bins.length)], label: 0 });
    data.push({ score: bins[Math.floor(rng() * bins.length)], label: 1 });
  }
  return data;
}

const DATASETS = [
  makeSyntheticScores(1, 120, 0.15, 2.2),
  makeSyntheticScores(2, 120, 0.9, 1.4),
  makeTiedScores(3, 120),
];

describe("core metrics invariants", () => {
  it("keeps ROC monotonic and bounded", () => {
    for (const all of DATASETS) {
      const roc = computeRocPoints(all);
      expect(roc.length).toBeGreaterThan(1);
      expect(roc[0].fpr).toBe(0);
      expect(roc[0].tpr).toBe(0);

      const last = roc[roc.length - 1];
      expect(last.fpr).toBe(1);
      expect(last.tpr).toBe(1);

      let prevFpr = -Infinity;
      let prevTpr = -Infinity;
      for (const p of roc) {
        expect(p.fpr).toBeGreaterThanOrEqual(prevFpr - 1e-12);
        expect(p.tpr).toBeGreaterThanOrEqual(prevTpr - 1e-12);
        expect(p.fpr).toBeGreaterThanOrEqual(0);
        expect(p.fpr).toBeLessThanOrEqual(1);
        expect(p.tpr).toBeGreaterThanOrEqual(0);
        expect(p.tpr).toBeLessThanOrEqual(1);
        prevFpr = p.fpr;
        prevTpr = p.tpr;
      }
    }
  });

  it("matches trapezoid AUC and rank AUC", () => {
    for (const all of DATASETS) {
      const roc = computeRocPoints(all);
      const aucTrap = computeAucTrapezoidReference(roc);
      const aucRank = computeAucRank(all);
      expect(Math.abs(aucTrap - aucRank)).toBeLessThan(1e-10);
    }
  });

  it("returns valid PR points", () => {
    for (const all of DATASETS) {
      const pr = computePrPoints(all);
      expect(pr.prevalence).toBeGreaterThan(0);
      expect(pr.prevalence).toBeLessThan(1);
      expect(pr.points[0].recall).toBe(0);
      expect(pr.points[0].precision).toBe(1);

      let prevRecall = -Infinity;
      for (const p of pr.points) {
        expect(p.recall).toBeGreaterThanOrEqual(prevRecall - 1e-12);
        expect(p.recall).toBeGreaterThanOrEqual(0);
        expect(p.recall).toBeLessThanOrEqual(1);
        expect(p.precision).toBeGreaterThanOrEqual(0);
        expect(p.precision).toBeLessThanOrEqual(1);
        prevRecall = p.recall;
      }
    }
  });

  it("keeps confusion matrix counts consistent", () => {
    for (const all of DATASETS) {
      for (const threshold of [-Infinity, -0.25, 0.25, Infinity]) {
        const op = computeOperatingPoint(threshold, all);
        expect(op.tp + op.fp + op.tn + op.fn).toBe(all.length);
        expect(op.P + op.N).toBe(all.length);
      }
    }
  });

  it("samples metric curves at consistent lengths", () => {
    const all = DATASETS[1];
    const curves = computeMetricCurves(all, -2, 2, 40);
    expect(curves.recall.length).toBe(41);
    expect(curves.precision.length).toBe(41);
    expect(curves.specificity.length).toBe(41);
    expect(curves.f1.length).toBe(41);
    expect(curves.mcc.length).toBe(41);
    expect(curves.accuracy.length).toBe(41);
  });
});
