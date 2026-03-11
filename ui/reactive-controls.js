import {
  NON_SHAPE_REACTIVE_NUMERIC_CONTROL_KEYS,
  PRESET_CONTROL_KEYS,
  sanitizeControlValue,
} from "../core/control-specs.js";
import { clamp } from "../core/math.js";

function subscribeRegenerateControl({ store, key, state, ids, regenerateAndRender }) {
  store.subscribe(key, (nextValue) => {
    state.controls[key] = nextValue;
    ids[key].value = String(nextValue);
    regenerateAndRender();
  });
}

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
  store.subscribe("threshold", (nextThreshold) => {
    state.controls.threshold = nextThreshold;
    renderThresholdViews();
  });

  store.subscribe("preset", (nextPreset) => {
    state.controls.preset = nextPreset;
    applyPresetValues({ ids, presets, name: nextPreset });
    const preset = presets[nextPreset];
    if (preset) {
      for (const key of PRESET_CONTROL_KEYS) {
        if (Object.prototype.hasOwnProperty.call(preset, key)) {
          state.controls[key] = preset[key];
        }
      }
    }
    regenerateAndRender();
  });

  store.subscribe("metricTrendHoverKey", (nextHoverKey) => {
    state.ui.metricTrendHoverKey = nextHoverKey;
    drawMetricTrend();
  });

  for (const key of NON_SHAPE_REACTIVE_NUMERIC_CONTROL_KEYS) {
    subscribeRegenerateControl({ store, key, state, ids, regenerateAndRender });
  }

  const applyByKey = {};
  for (const key of NON_SHAPE_REACTIVE_NUMERIC_CONTROL_KEYS) {
    applyByKey[key] = (rawValue) => {
      store.set(key, sanitizeControlValue(key, rawValue));
    };
  }

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

  function syncNonShapeControlsToStore() {
    store.set("preset", state.controls.preset, { silent: true });
    for (const key of NON_SHAPE_REACTIVE_NUMERIC_CONTROL_KEYS) {
      store.set(key, state.controls[key], { silent: true });
    }
    store.set("threshold", state.controls.threshold, { silent: true });
    store.set("metricTrendHoverKey", state.ui.metricTrendHoverKey, { silent: true });
  }

  return {
    applyByKey,
    applyThreshold,
    applyMetricTrendHoverKey,
    applyPreset,
    syncNonShapeControlsToStore,
  };
}
