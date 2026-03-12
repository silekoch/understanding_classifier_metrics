import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  CONTROL_SPECS,
  NON_SHAPE_REACTIVE_NUMERIC_CONTROL_KEYS,
  PRESET_CONTROL_KEYS,
  REACTIVE_NUMERIC_CONTROL_KEYS,
  SHAPE_CONTROL_KEYS,
  sanitizeControlValue,
} from "../core/control-specs.js";
import { createInitialControlValues } from "../core/state.js";

const INDEX_HTML = readFileSync(new URL("../index.html", import.meta.url), "utf8");

function getInputAttrsById(id) {
  const match = INDEX_HTML.match(new RegExp(`<input[^>]*\\bid="${id}"[^>]*>`, "m"));
  if (!match) {
    return null;
  }

  const attrs = {};
  const attrRegex = /(\w+)="([^"]*)"/g;
  let attrMatch;
  while ((attrMatch = attrRegex.exec(match[0])) !== null) {
    attrs[attrMatch[1]] = attrMatch[2];
  }
  return attrs;
}

describe("control specs", () => {
  it("are internally consistent with derived key lists", () => {
    for (const key of PRESET_CONTROL_KEYS) {
      expect(CONTROL_SPECS[key]?.preset).toBe(true);
    }
    for (const key of REACTIVE_NUMERIC_CONTROL_KEYS) {
      expect(CONTROL_SPECS[key]?.reactive).toBe(true);
    }
    for (const key of SHAPE_CONTROL_KEYS) {
      expect(CONTROL_SPECS[key]?.shape).toBe(true);
    }
    for (const key of NON_SHAPE_REACTIVE_NUMERIC_CONTROL_KEYS) {
      expect(CONTROL_SPECS[key]?.shape).not.toBe(true);
    }
  });

  it("match input constraints declared in index.html", () => {
    for (const [key, spec] of Object.entries(CONTROL_SPECS)) {
      const attrs = getInputAttrsById(key);
      expect(attrs, `Missing input in index.html for ${key}`).not.toBeNull();

      expect(attrs.type).toBe(spec.type);
      expect(Number(attrs.min)).toBeCloseTo(spec.min, 10);
      expect(Number(attrs.max)).toBeCloseTo(spec.max, 10);
      expect(Number(attrs.step)).toBeCloseTo(spec.step, 10);
      expect(Number(attrs.value)).toBeCloseTo(spec.default, 10);
    }
  });

  it("sanitizes to defaults, bounds, and integer requirements", () => {
    for (const [key, spec] of Object.entries(CONTROL_SPECS)) {
      expect(sanitizeControlValue(key, Number.NaN)).toBe(spec.default);

      const below = spec.min - 100;
      const above = spec.max + 100;
      expect(sanitizeControlValue(key, below)).toBe(spec.min);
      expect(sanitizeControlValue(key, above)).toBe(spec.max);
    }

    expect(sanitizeControlValue("dfNeg", 9.6)).toBe(10);
    expect(sanitizeControlValue("seed", 3.2)).toBe(3);
  });

  it("drive initial control defaults from control specs", () => {
    const controls = createInitialControlValues();
    for (const [key, spec] of Object.entries(CONTROL_SPECS)) {
      expect(controls[key]).toBe(spec.default);
    }
  });
});
