function subscribeShapeControl({ store, key, state, ids, regenerateAndRender }) {
  store.subscribe(key, (nextValue) => {
    state[key] = nextValue;
    ids[key].value = String(nextValue);
    regenerateAndRender();
  });
}

export function wireShapeControls({ store, state, ids, regenerateAndRender, clamp }) {
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

  function applyP0Neg(nextP0NegRaw) {
    const raw = Number(nextP0NegRaw);
    const nextP0Neg = Number.isFinite(raw) ? clamp(raw, 0, 0.95) : 0.42;
    store.set("p0Neg", nextP0Neg);
  }

  function applyP0Pos(nextP0PosRaw) {
    const raw = Number(nextP0PosRaw);
    const nextP0Pos = Number.isFinite(raw) ? clamp(raw, 0, 0.95) : 0.12;
    store.set("p0Pos", nextP0Pos);
  }

  function applyZeroValue(nextZeroValueRaw) {
    const raw = Number(nextZeroValueRaw);
    const nextZeroValue = Number.isFinite(raw) ? clamp(raw, -3, 3) : 0;
    store.set("zeroValue", nextZeroValue);
  }

  function applyAlphaNeg(nextAlphaNegRaw) {
    const raw = Number(nextAlphaNegRaw);
    const nextAlphaNeg = Number.isFinite(raw) ? clamp(raw, 0.2, 20) : 2;
    store.set("alphaNeg", nextAlphaNeg);
  }

  function applyBetaNeg(nextBetaNegRaw) {
    const raw = Number(nextBetaNegRaw);
    const nextBetaNeg = Number.isFinite(raw) ? clamp(raw, 0.2, 20) : 8;
    store.set("betaNeg", nextBetaNeg);
  }

  function applyAlphaPos(nextAlphaPosRaw) {
    const raw = Number(nextAlphaPosRaw);
    const nextAlphaPos = Number.isFinite(raw) ? clamp(raw, 0.2, 20) : 8;
    store.set("alphaPos", nextAlphaPos);
  }

  function applyBetaPos(nextBetaPosRaw) {
    const raw = Number(nextBetaPosRaw);
    const nextBetaPos = Number.isFinite(raw) ? clamp(raw, 0.2, 20) : 2;
    store.set("betaPos", nextBetaPos);
  }

  function applyEpsPos(nextEpsPosRaw) {
    const raw = Number(nextEpsPosRaw);
    const nextEpsPos = Number.isFinite(raw) ? clamp(raw, 0, 0.45) : 0.12;
    store.set("epsPos", nextEpsPos);
  }

  function applyEpsNeg(nextEpsNegRaw) {
    const raw = Number(nextEpsNegRaw);
    const nextEpsNeg = Number.isFinite(raw) ? clamp(raw, 0, 0.45) : 0.08;
    store.set("epsNeg", nextEpsNeg);
  }

  function applyConfSharpness(nextConfSharpnessRaw) {
    const raw = Number(nextConfSharpnessRaw);
    const nextConfSharpness = Number.isFinite(raw) ? clamp(raw, 2, 40) : 14;
    store.set("confSharpness", nextConfSharpness);
  }

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
