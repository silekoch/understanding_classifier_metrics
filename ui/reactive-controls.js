import {
  NON_SHAPE_REACTIVE_NUMERIC_CONTROL_KEYS,
  PRESET_CONTROL_KEYS,
  sanitizeControlValue,
} from "./control-specs.js";

function subscribeRegenerateControl({ store, key, state, ids, regenerateAndRender }) {
  store.subscribe(key, (nextValue) => {
    state[key] = nextValue;
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
  clamp,
}) {
  store.subscribe("threshold", (nextThreshold) => {
    state.threshold = nextThreshold;
    renderThresholdViews();
  });

  store.subscribe("preset", (nextPreset) => {
    state.preset = nextPreset;
    applyPresetValues({ ids, presets, name: nextPreset });
    const preset = presets[nextPreset];
    if (preset) {
      for (const key of PRESET_CONTROL_KEYS) {
        if (Object.prototype.hasOwnProperty.call(preset, key)) {
          state[key] = preset[key];
        }
      }
    }
    regenerateAndRender();
  });

  store.subscribe("metricTrendHoverKey", (nextHoverKey) => {
    state.metricTrendHoverKey = nextHoverKey;
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
    const clampedThreshold = clamp(nextThreshold, state.thresholdMin, state.thresholdMax);
    store.set("threshold", clampedThreshold);
  }

  function applyMetricTrendHoverKey(nextHoverKey) {
    store.set("metricTrendHoverKey", nextHoverKey || null);
  }

  function applyPreset(name) {
    store.set("preset", name);
  }

  function syncNonShapeControlsToStore() {
    store.set("preset", state.preset, { silent: true });
    for (const key of NON_SHAPE_REACTIVE_NUMERIC_CONTROL_KEYS) {
      store.set(key, state[key], { silent: true });
    }
    store.set("threshold", state.threshold, { silent: true });
    store.set("metricTrendHoverKey", state.metricTrendHoverKey, { silent: true });
  }

  return {
    applyByKey,
    applyThreshold,
    applyMetricTrendHoverKey,
    applyPreset,
    syncNonShapeControlsToStore,
  };
}
