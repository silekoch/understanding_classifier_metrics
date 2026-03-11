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
          const nextValue = sanitizeControlValue(key, preset[key]);
          store.set(key, nextValue, { silent: true });
          state.controls[key] = store.get(key);
          ids[key].value = String(state.controls[key]);
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

  return {
    applyByKey,
    applyThreshold,
    applyMetricTrendHoverKey,
    applyPreset,
  };
}
