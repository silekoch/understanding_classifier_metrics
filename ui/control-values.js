function toNumber(el) {
  return Number(el.value);
}

export function readControls({ ids, state }) {
  state.preset = ids.preset.value;
  state.muNeg = toNumber(ids.muNeg);
  state.sdNeg = toNumber(ids.sdNeg);
  state.muPos = toNumber(ids.muPos);
  state.sdPos = toNumber(ids.sdPos);
  state.logSigma = toNumber(ids.logSigma);
  state.dfNeg = Math.max(3, Math.round(toNumber(ids.dfNeg)));
  state.dfPos = Math.max(3, Math.round(toNumber(ids.dfPos)));
  state.mixWeight = toNumber(ids.mixWeight);
  state.mixOffset = toNumber(ids.mixOffset);
  state.mixSdMult = toNumber(ids.mixSdMult);
  state.p0Neg = toNumber(ids.p0Neg);
  state.p0Pos = toNumber(ids.p0Pos);
  state.zeroValue = toNumber(ids.zeroValue);
  state.alphaNeg = toNumber(ids.alphaNeg);
  state.betaNeg = toNumber(ids.betaNeg);
  state.alphaPos = toNumber(ids.alphaPos);
  state.betaPos = toNumber(ids.betaPos);
  state.epsPos = toNumber(ids.epsPos);
  state.epsNeg = toNumber(ids.epsNeg);
  state.confSharpness = toNumber(ids.confSharpness);
  state.nPerClass = Math.round(toNumber(ids.nPerClass));
  state.samplePosFrac = toNumber(ids.samplePosFrac);
  state.outlierFrac = toNumber(ids.outlierFrac);
  const seedRaw = Math.round(toNumber(ids.seed));
  state.seed = Number.isFinite(seedRaw) ? Math.max(1, seedRaw) : 1;
}
