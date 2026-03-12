import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CONTROL_SPECS } from "../core/control-specs.js";

const mocks = vi.hoisted(() => {
  const operatingPoint = {
    tp: 1,
    fp: 0,
    tn: 1,
    fn: 0,
    tpr: 1,
    fpr: 0,
    precision: 1,
    recall: 1,
    specificity: 1,
    f1: 1,
    accuracy: 1,
    mcc: 1,
    P: 1,
    N: 1,
  };

  return {
    computeCurveState: vi.fn(() => ({
      roc: {
        empirical: [
          { threshold: Number.POSITIVE_INFINITY, tpr: 0, fpr: 0 },
          { threshold: Number.NEGATIVE_INFINITY, tpr: 1, fpr: 1 },
        ],
        op: operatingPoint,
      },
      pr: {
        points: [
          { threshold: Number.POSITIVE_INFINITY, recall: 0, precision: 1 },
          { threshold: Number.NEGATIVE_INFINITY, recall: 1, precision: 0.5 },
        ],
        prevalence: 0.5,
        op: { recall: 1, precision: 1 },
      },
    })),
    computeThresholdBounds: vi.fn(() => ({
      thresholdMin: 0,
      thresholdMax: 1,
      thresholdStep: 0.001,
      threshold: 0.5,
    })),
    computeMetricCurves: vi.fn(() => ({
      recall: [],
      precision: [],
      specificity: [],
      f1: [],
      mcc: [],
      accuracy: [],
    })),
    computeOperatingPoint: vi.fn(() => operatingPoint),
    generateData: vi.fn(() => ({
      min: 0,
      max: 1,
      neg: [{ score: 0.2, label: 0 }],
      pos: [{ score: 0.8, label: 1 }],
      all: [
        { score: 0.2, label: 0 },
        { score: 0.8, label: 1 },
      ],
    })),
  };
});

function makeIds() {
  const ids = {
    preset: { value: "separated" },
    advancedDetails: { open: false },
    metricsText: { textContent: "" },
    distSvg: { _drawn: false },
    confusionSvg: { _drawn: false },
    rocSvg: { _drawn: false },
    prSvg: { _drawn: false },
    metricTrendSvg: { _drawn: false },
  };

  for (const [key, spec] of Object.entries(CONTROL_SPECS)) {
    ids[key] = { value: String(spec.default) };
  }

  return ids;
}

let capturedActions = null;

vi.mock("../ui/dom-ids.js", () => ({
  getIds: () => globalThis.__TEST_IDS__,
}));

vi.mock("../ui/controls.js", () => ({
  initHandlers: ({ actions }) => {
    capturedActions = actions;
  },
}));

vi.mock("../ui/url-state.js", () => ({
  restoreStateFromUrl: () => false,
  saveStateToUrl: () => {},
  scheduleUrlSync: () => {},
}));

vi.mock("../ui/preset-controls.js", () => ({
  applyPresetValues: () => {},
  syncControlOutputs: () => {},
}));

vi.mock("../core/derived-state.js", () => ({
  computeCurveState: mocks.computeCurveState,
  computeThresholdBounds: mocks.computeThresholdBounds,
}));

vi.mock("../core/metrics.js", () => ({
  computeMetricCurves: mocks.computeMetricCurves,
  computeOperatingPoint: mocks.computeOperatingPoint,
}));

vi.mock("../core/data.js", () => ({
  generateData: mocks.generateData,
}));

vi.mock("../viz/roc.js", () => ({
  drawRoc: ({ svg }) => {
    svg._drawn = true;
    return { left: 0, top: 0, width: 1, height: 1 };
  },
}));

vi.mock("../viz/pr.js", () => ({
  drawPr: ({ svg }) => {
    svg._drawn = true;
    return { left: 0, top: 0, width: 1, height: 1 };
  },
}));

vi.mock("../viz/dist.js", () => ({
  drawDist: ({ svg }) => {
    svg._drawn = true;
    return { box: { left: 0, width: 1 }, minX: 0, maxX: 1 };
  },
}));

vi.mock("../viz/matrix.js", () => ({
  drawConfusionMatrix: ({ svg }) => {
    svg._drawn = true;
  },
}));

vi.mock("../viz/metric-trend.js", () => ({
  drawMetricTrend: ({ svg }) => {
    svg._drawn = true;
    return { left: 0, top: 0, width: 1, height: 1 };
  },
  metricTrendHoverKeyFromPointer: () => null,
}));

describe("app threshold fast path", () => {
  beforeEach(() => {
    vi.resetModules();
    capturedActions = null;
    globalThis.document = {};
    globalThis.__TEST_IDS__ = makeIds();
    mocks.computeCurveState.mockClear();
    mocks.computeThresholdBounds.mockClear();
    mocks.computeMetricCurves.mockClear();
    mocks.computeOperatingPoint.mockClear();
    mocks.generateData.mockClear();
  });

  afterEach(() => {
    delete globalThis.document;
    delete globalThis.__TEST_IDS__;
  });

  it("does not recompute full curve state when threshold changes", async () => {
    await import("../app.js");

    expect(mocks.computeCurveState).toHaveBeenCalledTimes(1);
    const initialOperatingCalls = mocks.computeOperatingPoint.mock.calls.length;
    expect(capturedActions).toBeTruthy();

    capturedActions.applyThreshold(0.2);

    expect(mocks.computeCurveState).toHaveBeenCalledTimes(1);
    expect(mocks.computeOperatingPoint.mock.calls.length).toBe(initialOperatingCalls + 1);
  });

  it("renders from store values instead of unsynchronized DOM control values", async () => {
    await import("../app.js");
    expect(capturedActions).toBeTruthy();

    const ids = globalThis.__TEST_IDS__;
    ids.muNeg.value = "999";

    capturedActions.applySeed(42);

    const latestCall = mocks.generateData.mock.calls.at(-1);
    expect(latestCall).toBeTruthy();
    const [params] = latestCall;
    expect(params.seed).toBe(42);
    expect(params.muNeg).toBe(0);
  });
});
