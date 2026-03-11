import { PRESET_CONTROL_KEYS } from "./control-specs.js";

function setHidden(el, hidden) {
  if (!el) {
    return;
  }
  el.style.display = hidden ? "none" : "";
}

function updateConditionalParameterUI({ ids, preset }) {
  const mode = preset.mode || "normal";
  const isNormal = mode === "normal";
  const isBeta = mode === "beta";
  const isBetaConf = mode === "beta_conf_mixture";
  const hideLoc = isBeta || isBetaConf;
  ids.muNegLabel.textContent = isNormal ? "Negative mean" : "Negative location";
  ids.sdNegLabel.textContent = isNormal ? "Negative sd" : "Negative scale";
  ids.muPosLabel.textContent = isNormal ? "Positive mean" : "Positive location";
  ids.sdPosLabel.textContent = isNormal ? "Positive sd" : "Positive scale";
  setHidden(ids.locationScaleGrid, hideLoc);

  setHidden(ids.shapeNormal, mode !== "normal");
  setHidden(ids.shapeLognormal, mode !== "lognormal");
  setHidden(ids.shapeStudent, mode !== "student_t");
  setHidden(ids.shapeMixture, mode !== "mixture_pos");
  setHidden(ids.shapeZeroInflated, mode !== "zero_inflated");
  setHidden(ids.shapeBeta, mode !== "beta");
  setHidden(ids.shapeBetaConf, mode !== "beta_conf_mixture");
}

export function syncControlOutputs({ ids, state, presets, fmt, fmtPct }) {
  const preset = presets[state.preset] || presets.separated;
  const outlierEnabled = preset.mode === "normal";

  ids.muNegValue.textContent = fmt(state.muNeg, 2);
  ids.sdNegValue.textContent = fmt(state.sdNeg, 2);
  ids.muPosValue.textContent = fmt(state.muPos, 2);
  ids.sdPosValue.textContent = fmt(state.sdPos, 2);
  ids.logSigmaValue.textContent = fmt(state.logSigma, 2);
  ids.dfNegValue.textContent = String(state.dfNeg);
  ids.dfPosValue.textContent = String(state.dfPos);
  ids.mixWeightValue.textContent = fmt(state.mixWeight, 2);
  ids.mixOffsetValue.textContent = fmt(state.mixOffset, 2);
  ids.mixSdMultValue.textContent = fmt(state.mixSdMult, 2);
  ids.p0NegValue.textContent = fmt(state.p0Neg, 2);
  ids.p0PosValue.textContent = fmt(state.p0Pos, 2);
  ids.zeroValueOut.textContent = fmt(state.zeroValue, 2);
  ids.alphaNegValue.textContent = fmt(state.alphaNeg, 2);
  ids.betaNegValue.textContent = fmt(state.betaNeg, 2);
  ids.alphaPosValue.textContent = fmt(state.alphaPos, 2);
  ids.betaPosValue.textContent = fmt(state.betaPos, 2);
  ids.epsPosValue.textContent = fmtPct(state.epsPos, 1);
  ids.epsNegValue.textContent = fmtPct(state.epsNeg, 1);
  ids.confSharpnessValue.textContent = fmt(state.confSharpness, 1);
  ids.nPerClassValue.textContent = String(2 * state.nPerClass);
  ids.samplePosFracValue.textContent = fmtPct(state.samplePosFrac, 1);
  ids.outlierFracValue.textContent = outlierEnabled
    ? fmt(state.outlierFrac, 2)
    : `${fmt(state.outlierFrac, 2)} (normal only)`;
  ids.outlierFrac.disabled = !outlierEnabled;
  ids.seed.value = String(state.seed);
  ids.presetDesc.textContent = preset.desc || "";

  updateConditionalParameterUI({ ids, preset });
}

export function applyPresetValues({ ids, presets, name }) {
  const p = presets[name];
  if (!p) {
    return;
  }
  ids.preset.value = name;
  for (const key of PRESET_CONTROL_KEYS) {
    if (Object.prototype.hasOwnProperty.call(p, key) && ids[key]) {
      ids[key].value = String(p[key]);
    }
  }
}
