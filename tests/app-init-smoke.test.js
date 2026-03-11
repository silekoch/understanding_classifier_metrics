import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CONTROL_SPECS } from "../core/control-specs.js";

function makeIds() {
  const ids = {
    preset: { value: "separated" },
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

vi.mock("../ui/dom-ids.js", () => ({
  getIds: () => globalThis.__TEST_IDS__,
}));

vi.mock("../ui/controls.js", () => ({
  initHandlers: () => {},
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

describe("app startup smoke", () => {
  beforeEach(() => {
    vi.resetModules();
    globalThis.document = {};
    globalThis.__TEST_IDS__ = makeIds();
  });

  afterEach(() => {
    delete globalThis.document;
    delete globalThis.__TEST_IDS__;
  });

  it("renders key charts on fresh startup", async () => {
    await import("../app.js");
    const ids = globalThis.__TEST_IDS__;
    expect(ids.rocSvg._drawn).toBe(true);
    expect(ids.prSvg._drawn).toBe(true);
    expect(ids.distSvg._drawn).toBe(true);
    expect(ids.confusionSvg._drawn).toBe(true);
    expect(ids.metricTrendSvg._drawn).toBe(true);
  });
});
