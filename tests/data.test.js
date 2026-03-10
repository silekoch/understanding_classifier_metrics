import { describe, expect, it } from "vitest";
import { generateData } from "../core/data.js";

const BASE_PARAMS = {
  muNeg: 0,
  sdNeg: 1,
  muPos: 2.2,
  sdPos: 1,
  logSigma: 0.7,
  dfNeg: 3,
  dfPos: 3,
  mixWeight: 0.24,
  mixOffset: 0.15,
  mixSdMult: 1.1,
  p0Neg: 0.42,
  p0Pos: 0.12,
  zeroValue: 0,
  alphaNeg: 2,
  betaNeg: 8,
  alphaPos: 8,
  betaPos: 2,
  epsPos: 0.12,
  epsNeg: 0.08,
  confSharpness: 14,
  samplePosFrac: 0.5,
  nPerClass: 200,
  outlierFrac: 0.05,
  seed: 13,
};

describe("data generation invariants", () => {
  it("is deterministic for the same seed and params", () => {
    const preset = { mode: "normal" };
    const a = generateData(BASE_PARAMS, preset);
    const b = generateData(BASE_PARAMS, preset);
    expect(a).toStrictEqual(b);
  });

  it("returns finite values and valid min/max stats across modes", () => {
    const modes = [
      "normal",
      "lognormal",
      "student_t",
      "mixture_pos",
      "zero_inflated",
      "uniform",
      "exponential",
      "beta",
      "beta_conf_mixture",
    ];

    for (const mode of modes) {
      const data = generateData(BASE_PARAMS, { mode });
      expect(data.all.length).toBeGreaterThan(0);
      expect(Number.isFinite(data.min)).toBe(true);
      expect(Number.isFinite(data.max)).toBe(true);
      expect(data.min).toBeLessThanOrEqual(data.max);

      for (const row of data.all) {
        expect(Number.isFinite(row.score)).toBe(true);
        expect(row.label === 0 || row.label === 1).toBe(true);
      }
    }
  });

  it("keeps class counts consistent and bounded", () => {
    const params = { ...BASE_PARAMS, nPerClass: 123, samplePosFrac: 0.93 };
    const data = generateData(params, { mode: "normal" });
    expect(data.nNeg + data.nPos).toBe(2 * params.nPerClass);
    expect(data.nNeg).toBeGreaterThan(0);
    expect(data.nPos).toBeGreaterThan(0);
    expect(data.samplePrevalence).toBeGreaterThan(0);
    expect(data.samplePrevalence).toBeLessThan(1);
  });

  it("keeps beta-family scores in [0, 1]", () => {
    for (const mode of ["beta", "beta_conf_mixture"]) {
      const data = generateData(BASE_PARAMS, { mode });
      for (const row of data.all) {
        expect(row.score).toBeGreaterThanOrEqual(0);
        expect(row.score).toBeLessThanOrEqual(1);
      }
    }
  });
});
