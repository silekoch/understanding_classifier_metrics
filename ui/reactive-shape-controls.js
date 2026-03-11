import { SHAPE_CONTROL_KEYS, sanitizeControlValue } from "./control-specs.js";

function subscribeShapeControl({ store, key, state, ids, regenerateAndRender }) {
  store.subscribe(key, (nextValue) => {
    state[key] = nextValue;
    ids[key].value = String(nextValue);
    regenerateAndRender();
  });
}

export function wireShapeControls({ store, state, ids, regenerateAndRender }) {
  for (const key of SHAPE_CONTROL_KEYS) {
    subscribeShapeControl({ store, key, state, ids, regenerateAndRender });
  }

  const applyShapeByKey = {};
  for (const key of SHAPE_CONTROL_KEYS) {
    applyShapeByKey[key] = (rawValue) => {
      store.set(key, sanitizeControlValue(key, rawValue));
    };
  }

  function syncShapeControlsToStore() {
    for (const key of SHAPE_CONTROL_KEYS) {
      store.set(key, state[key], { silent: true });
    }
  }

  return {
    applyP0Neg: applyShapeByKey.p0Neg,
    applyP0Pos: applyShapeByKey.p0Pos,
    applyZeroValue: applyShapeByKey.zeroValue,
    applyAlphaNeg: applyShapeByKey.alphaNeg,
    applyBetaNeg: applyShapeByKey.betaNeg,
    applyAlphaPos: applyShapeByKey.alphaPos,
    applyBetaPos: applyShapeByKey.betaPos,
    applyEpsPos: applyShapeByKey.epsPos,
    applyEpsNeg: applyShapeByKey.epsNeg,
    applyConfSharpness: applyShapeByKey.confSharpness,
    syncShapeControlsToStore,
  };
}
