import { describe, expect, it } from "vitest";
import { metricTrendHoverKeyFromPointer } from "../viz/metric-trend.js";

function makeSvg() {
  return {
    viewBox: { baseVal: { width: 100, height: 100 } },
    getBoundingClientRect: () => ({
      left: 0,
      top: 0,
      width: 100,
      height: 100,
    }),
  };
}

describe("metric trend hover hit test", () => {
  it("detects hover on line segments between sample points", () => {
    const svg = makeSvg();
    const box = { left: 10, top: 10, width: 80, height: 80 };
    const curves = {
      recall: [
        { u: 0, v: 0 },
        { u: 1, v: 1 },
      ],
      precision: [],
      specificity: [],
      f1: [],
      mcc: [],
      accuracy: [],
    };
    const evt = { clientX: 50, clientY: 50 };

    const key = metricTrendHoverKeyFromPointer({ evt, svg, box, curves });
    expect(key).toBe("recall");
  });

  it("returns null when pointer is far from all lines", () => {
    const svg = makeSvg();
    const box = { left: 10, top: 10, width: 80, height: 80 };
    const curves = {
      recall: [
        { u: 0, v: 0 },
        { u: 1, v: 0 },
      ],
      precision: [],
      specificity: [],
      f1: [],
      mcc: [],
      accuracy: [],
    };
    const evt = { clientX: 50, clientY: 10 };

    const key = metricTrendHoverKeyFromPointer({ evt, svg, box, curves });
    expect(key).toBe(null);
  });
});
