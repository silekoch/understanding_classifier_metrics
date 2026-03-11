import { describe, expect, it, vi } from "vitest";
import { CONTROL_SPECS } from "../core/control-specs.js";
import { createInitialState } from "../core/state.js";
import { createStateStore } from "../core/state-store.js";
import { wireReactiveControls } from "../ui/reactive-controls.js";
import { wireShapeControls } from "../ui/reactive-shape-controls.js";

function makeIds() {
  const ids = {
    preset: { value: "separated" },
  };
  for (const [key, spec] of Object.entries(CONTROL_SPECS)) {
    ids[key] = { value: String(spec.default) };
  }
  return ids;
}

const PRESETS = {
  separated: {
    mode: "normal",
    muNeg: 0,
    alphaNeg: 2,
  },
  shifted: {
    mode: "normal",
    muNeg: 0.8,
    alphaNeg: 6,
  },
};

describe("preset reactive wiring", () => {
  it("notifies key subscribers on preset apply and triggers one full render", () => {
    const state = createInitialState();
    const store = createStateStore({
      ...state.controls,
      metricTrendHoverKey: state.ui.metricTrendHoverKey,
    });
    const ids = makeIds();
    const regenerateAndRender = vi.fn();

    wireShapeControls({
      store,
      state,
      ids,
      regenerateAndRender,
    });

    const { applyPreset } = wireReactiveControls({
      store,
      state,
      ids,
      presets: PRESETS,
      applyPresetValues: ({ name }) => {
        ids.preset.value = name;
      },
      regenerateAndRender,
      renderThresholdViews: vi.fn(),
      drawMetricTrend: vi.fn(),
    });

    const muNegSubscriber = vi.fn();
    const alphaNegSubscriber = vi.fn();
    store.subscribe("muNeg", muNegSubscriber);
    store.subscribe("alphaNeg", alphaNegSubscriber);

    applyPreset("shifted");

    expect(muNegSubscriber).toHaveBeenCalledTimes(1);
    expect(alphaNegSubscriber).toHaveBeenCalledTimes(1);
    expect(regenerateAndRender).toHaveBeenCalledTimes(1);
    expect(ids.muNeg.value).toBe("0.8");
    expect(ids.alphaNeg.value).toBe("6");
  });
});
