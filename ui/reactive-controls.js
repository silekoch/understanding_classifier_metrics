import {
  NON_SHAPE_REACTIVE_NUMERIC_CONTROL_KEYS,
  PRESET_CONTROL_KEYS,
  sanitizeControlValue,
} from "../core/control-specs.js";
import { clamp } from "../core/math.js";
import { buildApplyByKey, subscribeRegenerateKeys } from "./reactive-control-wiring.js";

// Non-shape controls own global control behaviors (preset, threshold, hover)
// and reuse shared wiring for per-key numeric controls.
export function wireReactiveControls({
  store,
  state,
  ids,
  presets,
  applyPresetValues,
  regenerateAndRender,
  renderThresholdViews,
  drawMetricTrend,
}) {
  store.subscribe("threshold", () => {
    renderThresholdViews();
  });

  store.subscribe("preset", (nextPreset) => {
    applyPresetValues({ ids, presets, name: nextPreset });
    const preset = presets[nextPreset];
    if (preset) {
      state.ui.suppressReactiveRegenerate = true;
      try {
        store.batch(() => {
          for (const key of PRESET_CONTROL_KEYS) {
            if (Object.prototype.hasOwnProperty.call(preset, key)) {
              const nextValue = sanitizeControlValue(key, preset[key]);
              store.set(key, nextValue);
            }
          }
        });
      } finally {
        state.ui.suppressReactiveRegenerate = false;
      }
    }
    regenerateAndRender();
  });

  store.subscribe("metricTrendHoverKey", (nextHoverKey) => {
    state.ui.metricTrendHoverKey = nextHoverKey;
    drawMetricTrend();
  });

  subscribeRegenerateKeys({
    store,
    keys: NON_SHAPE_REACTIVE_NUMERIC_CONTROL_KEYS,
    state,
    ids,
    regenerateAndRender,
  });

  const applyByKey = buildApplyByKey({
    store,
    keys: NON_SHAPE_REACTIVE_NUMERIC_CONTROL_KEYS,
  });

  function applyThreshold(nextThreshold) {
    const clampedThreshold = clamp(nextThreshold, state.computed.thresholdMin, state.computed.thresholdMax);
    store.set("threshold", clampedThreshold);
  }

  function applyMetricTrendHoverKey(nextHoverKey) {
    store.set("metricTrendHoverKey", nextHoverKey || null);
  }

  function applyPreset(name) {
    store.set("preset", name);
  }

  return {
    applyByKey,
    applyThreshold,
    applyMetricTrendHoverKey,
    applyPreset,
  };
}
