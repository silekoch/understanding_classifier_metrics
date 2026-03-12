import { sanitizeControlValue } from "../core/control-specs.js";

function shouldSkipRegenerate(state) {
  return Boolean(state.ui?.suppressReactiveRegenerate);
}

function subscribeRegenerateKey({ store, key, state, ids, regenerateAndRender }) {
  store.subscribe(key, (nextValue) => {
    if (ids[key]) {
      ids[key].value = String(nextValue);
    }
    if (shouldSkipRegenerate(state)) {
      return;
    }
    regenerateAndRender();
  });
}

export function subscribeRegenerateKeys({ store, keys, state, ids, regenerateAndRender }) {
  for (const key of keys) {
    subscribeRegenerateKey({ store, key, state, ids, regenerateAndRender });
  }
}

export function buildApplyByKey({ store, keys }) {
  const applyByKey = {};
  for (const key of keys) {
    applyByKey[key] = (rawValue) => {
      store.set(key, sanitizeControlValue(key, rawValue));
    };
  }
  return applyByKey;
}
