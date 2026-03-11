import { describe, expect, it, vi } from "vitest";
import { REACTIVE_NUMERIC_CONTROL_KEYS } from "../ui/control-specs.js";
import { bindReactiveNumericControls } from "../ui/control-bindings.js";

function makeFakeElement() {
  return {
    addEventListener: vi.fn(),
  };
}

function makeIds() {
  const ids = {};
  for (const key of REACTIVE_NUMERIC_CONTROL_KEYS) {
    ids[key] = makeFakeElement();
  }
  return ids;
}

function makeApplyByKey() {
  const applyByKey = {};
  for (const key of REACTIVE_NUMERIC_CONTROL_KEYS) {
    applyByKey[key] = vi.fn();
  }
  return applyByKey;
}

describe("reactive control bindings", () => {
  it("binds input and change listeners for all configured controls", () => {
    const ids = makeIds();
    const applyByKey = makeApplyByKey();

    bindReactiveNumericControls({ ids, applyByKey });

    for (const key of REACTIVE_NUMERIC_CONTROL_KEYS) {
      expect(ids[key].addEventListener).toHaveBeenCalledTimes(2);
      expect(ids[key].addEventListener).toHaveBeenNthCalledWith(1, "input", expect.any(Function));
      expect(ids[key].addEventListener).toHaveBeenNthCalledWith(2, "change", expect.any(Function));
    }
  });

  it("throws when an expected control element is missing", () => {
    const ids = makeIds();
    const applyByKey = makeApplyByKey();
    delete ids.muNeg;

    expect(() => bindReactiveNumericControls({ ids, applyByKey })).toThrow(
      "Missing reactive control element: muNeg"
    );
  });

  it("throws when an expected control handler is missing", () => {
    const ids = makeIds();
    const applyByKey = makeApplyByKey();
    delete applyByKey.muNeg;

    expect(() => bindReactiveNumericControls({ ids, applyByKey })).toThrow(
      "Missing reactive control handler: muNeg"
    );
  });
});
