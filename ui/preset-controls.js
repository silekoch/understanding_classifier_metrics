import { CONTROL_SPECS, PRESET_CONTROL_KEYS } from "../core/control-specs.js";

const OUTPUT_ID_OVERRIDES = {
  zeroValue: "zeroValueOut",
};
const PERCENT_OUTPUT_KEYS = new Set(["epsPos", "epsNeg", "samplePosFrac"]);

function getOutputId(key) {
  return OUTPUT_ID_OVERRIDES[key] || `${key}Value`;
}

function decimalsFromStep(step) {
  const stepText = String(step);
  const dot = stepText.indexOf(".");
  if (dot < 0) {
    return 0;
  }
  return stepText.length - dot - 1;
}

function formatControlOutput({ key, spec, value, outlierEnabled, fmt, fmtPct }) {
  if (key === "nPerClass") {
    return String(2 * value);
  }
  if (key === "outlierFrac") {
    const base = fmt(value, 2);
    return outlierEnabled ? base : `${base} (normal only)`;
  }
  if (PERCENT_OUTPUT_KEYS.has(key)) {
    return fmtPct(value, 1);
  }
  if (spec.integer) {
    return String(value);
  }
  return fmt(value, decimalsFromStep(spec.step));
}

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

  for (const [key, spec] of Object.entries(CONTROL_SPECS)) {
    const outputEl = ids[getOutputId(key)];
    if (!outputEl) {
      continue;
    }
    outputEl.textContent = formatControlOutput({
      key,
      spec,
      value: state[key],
      outlierEnabled,
      fmt,
      fmtPct,
    });
  }

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
