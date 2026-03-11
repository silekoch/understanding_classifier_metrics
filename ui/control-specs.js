function pickKeysByFlag(flag) {
  return Object.entries(CONTROL_SPECS)
    .filter(([, spec]) => spec[flag])
    .map(([key]) => key);
}

function clamp(x, min, max) {
  return Math.max(min, Math.min(max, x));
}

export const CONTROL_SPECS = {
  seed: { type: "number", min: 1, max: 999999, step: 1, default: 13, integer: true, reactive: true },
  nPerClass: {
    type: "range",
    min: 50,
    max: 2000,
    step: 10,
    default: 500,
    integer: true,
    reactive: true,
    preset: true,
  },
  samplePosFrac: {
    type: "range",
    min: 0.02,
    max: 0.98,
    step: 0.01,
    default: 0.5,
    reactive: true,
    preset: true,
  },
  muNeg: { type: "range", min: -4, max: 4, step: 0.05, default: 0, reactive: true, preset: true },
  sdNeg: { type: "range", min: 0.2, max: 3, step: 0.05, default: 1, reactive: true, preset: true },
  muPos: { type: "range", min: -4, max: 6, step: 0.05, default: 2, reactive: true, preset: true },
  sdPos: { type: "range", min: 0.2, max: 3, step: 0.05, default: 1, reactive: true, preset: true },
  outlierFrac: { type: "range", min: 0, max: 0.5, step: 0.01, default: 0, reactive: true, preset: true },
  logSigma: { type: "range", min: 0.2, max: 1.6, step: 0.01, default: 0.7, reactive: true, preset: true },
  dfNeg: { type: "range", min: 3, max: 30, step: 1, default: 3, integer: true, reactive: true, preset: true },
  dfPos: { type: "range", min: 3, max: 30, step: 1, default: 3, integer: true, reactive: true, preset: true },
  mixWeight: { type: "range", min: 0, max: 0.8, step: 0.01, default: 0.24, reactive: true, preset: true },
  mixOffset: { type: "range", min: -1, max: 2, step: 0.01, default: 0.15, reactive: true, preset: true },
  mixSdMult: { type: "range", min: 0.2, max: 2.5, step: 0.01, default: 1.1, reactive: true, preset: true },
  p0Neg: {
    type: "range",
    min: 0,
    max: 0.95,
    step: 0.01,
    default: 0.42,
    reactive: true,
    preset: true,
    shape: true,
  },
  p0Pos: {
    type: "range",
    min: 0,
    max: 0.95,
    step: 0.01,
    default: 0.12,
    reactive: true,
    preset: true,
    shape: true,
  },
  zeroValue: {
    type: "range",
    min: -3,
    max: 3,
    step: 0.05,
    default: 0,
    reactive: true,
    preset: true,
    shape: true,
  },
  alphaNeg: {
    type: "range",
    min: 0.2,
    max: 20,
    step: 0.1,
    default: 2,
    reactive: true,
    preset: true,
    shape: true,
  },
  betaNeg: {
    type: "range",
    min: 0.2,
    max: 20,
    step: 0.1,
    default: 8,
    reactive: true,
    preset: true,
    shape: true,
  },
  alphaPos: {
    type: "range",
    min: 0.2,
    max: 20,
    step: 0.1,
    default: 8,
    reactive: true,
    preset: true,
    shape: true,
  },
  betaPos: {
    type: "range",
    min: 0.2,
    max: 20,
    step: 0.1,
    default: 2,
    reactive: true,
    preset: true,
    shape: true,
  },
  epsPos: {
    type: "range",
    min: 0,
    max: 0.45,
    step: 0.01,
    default: 0.12,
    reactive: true,
    preset: true,
    shape: true,
  },
  epsNeg: {
    type: "range",
    min: 0,
    max: 0.45,
    step: 0.01,
    default: 0.08,
    reactive: true,
    preset: true,
    shape: true,
  },
  confSharpness: {
    type: "range",
    min: 2,
    max: 40,
    step: 0.5,
    default: 14,
    reactive: true,
    preset: true,
    shape: true,
  },
};

export const PRESET_CONTROL_KEYS = pickKeysByFlag("preset");
export const REACTIVE_NUMERIC_CONTROL_KEYS = pickKeysByFlag("reactive");
export const SHAPE_CONTROL_KEYS = pickKeysByFlag("shape");
export const NON_SHAPE_REACTIVE_NUMERIC_CONTROL_KEYS = REACTIVE_NUMERIC_CONTROL_KEYS.filter(
  (key) => !SHAPE_CONTROL_KEYS.includes(key)
);

export function sanitizeControlValue(key, rawValue) {
  const spec = CONTROL_SPECS[key];
  if (!spec) {
    throw new Error(`Unknown control key: ${key}`);
  }

  const raw = Number(rawValue);
  if (!Number.isFinite(raw)) {
    return spec.default;
  }

  const normalized = spec.integer ? Math.round(raw) : raw;
  return clamp(normalized, spec.min, spec.max);
}
