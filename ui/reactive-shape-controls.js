import { sanitizeControlValue } from "./control-specs.js";

function subscribeShapeControl({ store, key, state, ids, regenerateAndRender }) {
  store.subscribe(key, (nextValue) => {
    state[key] = nextValue;
    ids[key].value = String(nextValue);
    regenerateAndRender();
  });
}

export function wireShapeControls({ store, state, ids, regenerateAndRender }) {
  subscribeShapeControl({ store, key: "p0Neg", state, ids, regenerateAndRender });
  subscribeShapeControl({ store, key: "p0Pos", state, ids, regenerateAndRender });
  subscribeShapeControl({ store, key: "zeroValue", state, ids, regenerateAndRender });
  subscribeShapeControl({ store, key: "alphaNeg", state, ids, regenerateAndRender });
  subscribeShapeControl({ store, key: "betaNeg", state, ids, regenerateAndRender });
  subscribeShapeControl({ store, key: "alphaPos", state, ids, regenerateAndRender });
  subscribeShapeControl({ store, key: "betaPos", state, ids, regenerateAndRender });
  subscribeShapeControl({ store, key: "epsPos", state, ids, regenerateAndRender });
  subscribeShapeControl({ store, key: "epsNeg", state, ids, regenerateAndRender });
  subscribeShapeControl({ store, key: "confSharpness", state, ids, regenerateAndRender });

  const applyShapeControl = (key) => (rawValue) => {
    store.set(key, sanitizeControlValue(key, rawValue));
  };

  const applyP0Neg = applyShapeControl("p0Neg");
  const applyP0Pos = applyShapeControl("p0Pos");
  const applyZeroValue = applyShapeControl("zeroValue");
  const applyAlphaNeg = applyShapeControl("alphaNeg");
  const applyBetaNeg = applyShapeControl("betaNeg");
  const applyAlphaPos = applyShapeControl("alphaPos");
  const applyBetaPos = applyShapeControl("betaPos");
  const applyEpsPos = applyShapeControl("epsPos");
  const applyEpsNeg = applyShapeControl("epsNeg");
  const applyConfSharpness = applyShapeControl("confSharpness");

  function syncShapeControlsToStore() {
    store.set("p0Neg", state.p0Neg, { silent: true });
    store.set("p0Pos", state.p0Pos, { silent: true });
    store.set("zeroValue", state.zeroValue, { silent: true });
    store.set("alphaNeg", state.alphaNeg, { silent: true });
    store.set("betaNeg", state.betaNeg, { silent: true });
    store.set("alphaPos", state.alphaPos, { silent: true });
    store.set("betaPos", state.betaPos, { silent: true });
    store.set("epsPos", state.epsPos, { silent: true });
    store.set("epsNeg", state.epsNeg, { silent: true });
    store.set("confSharpness", state.confSharpness, { silent: true });
  }

  return {
    applyP0Neg,
    applyP0Pos,
    applyZeroValue,
    applyAlphaNeg,
    applyBetaNeg,
    applyAlphaPos,
    applyBetaPos,
    applyEpsPos,
    applyEpsNeg,
    applyConfSharpness,
    syncShapeControlsToStore,
  };
}
