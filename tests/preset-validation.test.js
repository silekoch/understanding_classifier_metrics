import { describe, expect, it } from "vitest";
import { PRESETS } from "../presets.js";
import { assertValidPresets, validatePresets } from "../core/preset-validation.js";

describe("preset validation", () => {
  it("accepts configured presets", () => {
    expect(() => assertValidPresets(PRESETS)).not.toThrow();
    expect(validatePresets(PRESETS)).toHaveLength(0);
  });

  it("flags unknown preset keys", () => {
    const issues = validatePresets({
      bad: {
        mode: "normal",
        notARealControl: 1,
      },
    });

    expect(issues.some((issue) => issue.code === "unknown_preset_key")).toBe(true);
  });

  it("flags non-finite preset values", () => {
    const issues = validatePresets({
      bad: {
        mode: "normal",
        muNeg: Number.NaN,
      },
    });

    expect(issues.some((issue) => issue.code === "invalid_preset_value")).toBe(true);
  });
});
