import { SHAPE_CONTROL_KEYS, sanitizeControlValue } from "../core/control-specs.js";

function subscribeShapeControl({ store, key, state, ids, regenerateAndRender }) {
  store.subscribe(key, (nextValue) => {
    state.controls[key] = nextValue;
    ids[key].value = String(nextValue);
    if (state.ui.suppressReactiveRegenerate) {
      return;
    }
    regenerateAndRender();
  });
}

export function wireShapeControls({ store, state, ids, regenerateAndRender }) {
  for (const key of SHAPE_CONTROL_KEYS) {
    subscribeShapeControl({ store, key, state, ids, regenerateAndRender });
  }

  const applyByKey = {};
  for (const key of SHAPE_CONTROL_KEYS) {
    applyByKey[key] = (rawValue) => {
      store.set(key, sanitizeControlValue(key, rawValue));
    };
  }

  return {
    applyByKey,
  };
}
