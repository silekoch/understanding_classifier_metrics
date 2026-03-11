import { PRESETS } from "./presets.js";
import { createInitialState } from "./core/state.js";
import { createStateStore } from "./core/state-store.js";
import { fmt, fmtPct } from "./core/format.js";
import { computeMetricCurves } from "./core/metrics.js";
import {
  computeCurveState as computeCurveStateCore,
  computeThresholdBounds as computeThresholdBoundsCore,
} from "./core/derived-state.js";
import { generateData as generateSampleData } from "./core/data.js";
import { drawRoc as drawRocView } from "./viz/roc.js";
import { drawPr as drawPrView } from "./viz/pr.js";
import { drawDist as drawDistView } from "./viz/dist.js";
import { drawConfusionMatrix as drawConfusionMatrixView } from "./viz/matrix.js";
import {
  drawMetricTrend as drawMetricTrendView,
  metricTrendHoverKeyFromPointer as metricTrendHoverKeyFromPointerView,
} from "./viz/metric-trend.js";
import { initHandlers as initControlHandlers } from "./ui/controls.js";
import {
  restoreStateFromUrl as restoreStateFromUrlImpl,
  saveStateToUrl as saveStateToUrlImpl,
  scheduleUrlSync as scheduleUrlSyncImpl,
} from "./ui/url-state.js";
import {
  applyPresetValues as applyPresetValuesUi,
  syncControlOutputs as syncControlOutputsUi,
} from "./ui/preset-controls.js";
import { getIds } from "./ui/dom-ids.js";
import { readControls as readControlsImpl } from "./ui/control-values.js";
import { URL_BOOL_KEYS, URL_NUM_KEYS } from "./ui/url-state-keys.js";
import { renderMetricsText as renderMetricsTextView } from "./ui/metrics-text.js";
import { runStartupRender } from "./ui/startup.js";
import { wireShapeControls } from "./ui/reactive-shape-controls.js";
import { PRESET_CONTROL_KEYS, sanitizeControlValue } from "./ui/control-specs.js";

const state = createInitialState();
const ids = getIds(document);
const store = createStateStore({
  preset: state.preset,
  muNeg: state.muNeg,
  sdNeg: state.sdNeg,
  muPos: state.muPos,
  sdPos: state.sdPos,
  logSigma: state.logSigma,
  dfNeg: state.dfNeg,
  dfPos: state.dfPos,
  mixWeight: state.mixWeight,
  mixOffset: state.mixOffset,
  mixSdMult: state.mixSdMult,
  p0Neg: state.p0Neg,
  p0Pos: state.p0Pos,
  zeroValue: state.zeroValue,
  alphaNeg: state.alphaNeg,
  betaNeg: state.betaNeg,
  alphaPos: state.alphaPos,
  betaPos: state.betaPos,
  epsPos: state.epsPos,
  epsNeg: state.epsNeg,
  confSharpness: state.confSharpness,
  nPerClass: state.nPerClass,
  samplePosFrac: state.samplePosFrac,
  outlierFrac: state.outlierFrac,
  seed: state.seed,
  threshold: state.threshold,
  metricTrendHoverKey: state.metricTrendHoverKey,
});

function clamp(x, a, b) {
  return Math.max(a, Math.min(b, x));
}

const readControls = () => readControlsImpl({ ids, state });

const {
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
} = wireShapeControls({
  store,
  state,
  ids,
  regenerateAndRender,
});

store.subscribe("threshold", (nextThreshold) => {
  state.threshold = nextThreshold;
  renderThresholdViews();
});

store.subscribe("preset", (nextPreset) => {
  state.preset = nextPreset;
  applyPresetValuesUi({ ids, presets: PRESETS, name: nextPreset });
  const preset = PRESETS[nextPreset];
  if (preset) {
    for (const key of PRESET_CONTROL_KEYS) {
      if (Object.prototype.hasOwnProperty.call(preset, key)) {
        state[key] = preset[key];
      }
    }
  }
  regenerateAndRender();
});

store.subscribe("muNeg", (nextMuNeg) => {
  state.muNeg = nextMuNeg;
  ids.muNeg.value = String(nextMuNeg);
  regenerateAndRender();
});

store.subscribe("sdNeg", (nextSdNeg) => {
  state.sdNeg = nextSdNeg;
  ids.sdNeg.value = String(nextSdNeg);
  regenerateAndRender();
});

store.subscribe("muPos", (nextMuPos) => {
  state.muPos = nextMuPos;
  ids.muPos.value = String(nextMuPos);
  regenerateAndRender();
});

store.subscribe("sdPos", (nextSdPos) => {
  state.sdPos = nextSdPos;
  ids.sdPos.value = String(nextSdPos);
  regenerateAndRender();
});

store.subscribe("logSigma", (nextLogSigma) => {
  state.logSigma = nextLogSigma;
  ids.logSigma.value = String(nextLogSigma);
  regenerateAndRender();
});

store.subscribe("dfNeg", (nextDfNeg) => {
  state.dfNeg = nextDfNeg;
  ids.dfNeg.value = String(nextDfNeg);
  regenerateAndRender();
});

store.subscribe("dfPos", (nextDfPos) => {
  state.dfPos = nextDfPos;
  ids.dfPos.value = String(nextDfPos);
  regenerateAndRender();
});

store.subscribe("mixWeight", (nextMixWeight) => {
  state.mixWeight = nextMixWeight;
  ids.mixWeight.value = String(nextMixWeight);
  regenerateAndRender();
});

store.subscribe("mixOffset", (nextMixOffset) => {
  state.mixOffset = nextMixOffset;
  ids.mixOffset.value = String(nextMixOffset);
  regenerateAndRender();
});

store.subscribe("mixSdMult", (nextMixSdMult) => {
  state.mixSdMult = nextMixSdMult;
  ids.mixSdMult.value = String(nextMixSdMult);
  regenerateAndRender();
});

store.subscribe("metricTrendHoverKey", (nextHoverKey) => {
  state.metricTrendHoverKey = nextHoverKey;
  drawMetricTrend();
});

store.subscribe("seed", (nextSeed) => {
  state.seed = nextSeed;
  ids.seed.value = String(nextSeed);
  regenerateAndRender();
});

store.subscribe("nPerClass", (nextNPerClass) => {
  state.nPerClass = nextNPerClass;
  ids.nPerClass.value = String(nextNPerClass);
  regenerateAndRender();
});

store.subscribe("samplePosFrac", (nextSamplePosFrac) => {
  state.samplePosFrac = nextSamplePosFrac;
  ids.samplePosFrac.value = String(nextSamplePosFrac);
  regenerateAndRender();
});

store.subscribe("outlierFrac", (nextOutlierFrac) => {
  state.outlierFrac = nextOutlierFrac;
  ids.outlierFrac.value = String(nextOutlierFrac);
  regenerateAndRender();
});

function applyThreshold(nextThreshold) {
  const clampedThreshold = clamp(nextThreshold, state.thresholdMin, state.thresholdMax);
  store.set("threshold", clampedThreshold);
}

const applyNumericControl = (key) => (rawValue) => {
  store.set(key, sanitizeControlValue(key, rawValue));
};

const applySeed = applyNumericControl("seed");
const applyMuNeg = applyNumericControl("muNeg");
const applySdNeg = applyNumericControl("sdNeg");
const applyMuPos = applyNumericControl("muPos");
const applySdPos = applyNumericControl("sdPos");
const applyLogSigma = applyNumericControl("logSigma");
const applyDfNeg = applyNumericControl("dfNeg");
const applyDfPos = applyNumericControl("dfPos");
const applyMixWeight = applyNumericControl("mixWeight");
const applyMixOffset = applyNumericControl("mixOffset");
const applyMixSdMult = applyNumericControl("mixSdMult");
const applyNPerClass = applyNumericControl("nPerClass");
const applySamplePosFrac = applyNumericControl("samplePosFrac");
const applyOutlierFrac = applyNumericControl("outlierFrac");

function applyMetricTrendHoverKey(nextHoverKey) {
  const key = nextHoverKey || null;
  store.set("metricTrendHoverKey", key);
}

function applyPreset(name) {
  store.set("preset", name);
}

function getActivePreset() {
  return PRESETS[state.preset] || PRESETS.separated;
}

function computeEverything() {
  const { roc, pr } = computeCurveStateCore({
    samples: state.data.all,
    threshold: state.threshold,
  });
  state.roc = roc;
  state.pr = pr;
}

function updateThresholdRange() {
  const bounds = computeThresholdBoundsCore({
    data: state.data,
    threshold: state.threshold,
  });
  state.thresholdMin = bounds.thresholdMin;
  state.thresholdMax = bounds.thresholdMax;
  state.thresholdStep = bounds.thresholdStep;
  state.threshold = bounds.threshold;
}

function saveStateToUrl() {
  saveStateToUrlImpl({
    state,
    ids,
    urlNumKeys: URL_NUM_KEYS,
    urlBoolKeys: URL_BOOL_KEYS,
  });
}

function scheduleUrlSync() {
  scheduleUrlSyncImpl({
    state,
    saveStateToUrl,
    delayMs: 120,
  });
}

function drawMetricTrend() {
  state.metricTrendBox = drawMetricTrendView({
    svg: ids.metricTrendSvg,
    curves: state.metricCurves,
    hoveredKey: state.metricTrendHoverKey,
    threshold: state.threshold,
    thresholdMin: state.thresholdMin,
    thresholdMax: state.thresholdMax,
    fmt,
  });
}

function renderThresholdViews() {
  computeEverything();
  state.distView = drawDistView({
    svg: ids.distSvg,
    data: state.data,
    threshold: state.threshold,
    fmt,
  });
  drawConfusionMatrixView({
    svg: ids.confusionSvg,
    op: state.roc.op,
    fmtPct,
  });
  state.rocClickBox = drawRocView({
    svg: ids.rocSvg,
    roc: state.roc,
    threshold: state.threshold,
    fmt,
  });
  state.prClickBox = drawPrView({
    svg: ids.prSvg,
    pr: state.pr,
    threshold: state.threshold,
    fmt,
  });
  renderMetricsTextView({
    metricsTextEl: ids.metricsText,
    op: state.roc.op,
    fmt,
  });
  drawMetricTrend();
  scheduleUrlSync();
}

function renderAll() {
  syncControlOutputsUi({ ids, state, presets: PRESETS, fmt, fmtPct });
  renderThresholdViews();
}

function regenerateAndRender() {
  state.data = generateSampleData(state, getActivePreset());
  updateThresholdRange();
  store.set("preset", state.preset, { silent: true });
  store.set("muNeg", state.muNeg, { silent: true });
  store.set("sdNeg", state.sdNeg, { silent: true });
  store.set("muPos", state.muPos, { silent: true });
  store.set("sdPos", state.sdPos, { silent: true });
  store.set("logSigma", state.logSigma, { silent: true });
  store.set("dfNeg", state.dfNeg, { silent: true });
  store.set("dfPos", state.dfPos, { silent: true });
  store.set("mixWeight", state.mixWeight, { silent: true });
  store.set("mixOffset", state.mixOffset, { silent: true });
  store.set("mixSdMult", state.mixSdMult, { silent: true });
  syncShapeControlsToStore();
  store.set("nPerClass", state.nPerClass, { silent: true });
  store.set("samplePosFrac", state.samplePosFrac, { silent: true });
  store.set("outlierFrac", state.outlierFrac, { silent: true });
  store.set("seed", state.seed, { silent: true });
  store.set("threshold", state.threshold, { silent: true });
  store.set("metricTrendHoverKey", state.metricTrendHoverKey, { silent: true });
  state.metricCurves = computeMetricCurves(state.data.all, state.thresholdMin, state.thresholdMax);
  renderAll();
}

function initHandlers() {
  initControlHandlers({
    ids,
    state,
    applyPreset,
    scheduleUrlSync,
    applyThreshold,
    applyMuNeg,
    applySdNeg,
    applyMuPos,
    applySdPos,
    applyLogSigma,
    applyDfNeg,
    applyDfPos,
    applyMixWeight,
    applyMixOffset,
    applyMixSdMult,
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
    applyNPerClass,
    applySamplePosFrac,
    applyOutlierFrac,
    applySeed,
    applyMetricTrendHoverKey,
    metricTrendHoverKeyFromPointer: metricTrendHoverKeyFromPointerView,
  });
}

function init() {
  initHandlers();
  const restored = restoreStateFromUrlImpl({
    ids,
    presets: PRESETS,
    applyPresetValues: (name) => applyPresetValuesUi({ ids, presets: PRESETS, name }),
    urlNumKeys: URL_NUM_KEYS,
    urlBoolKeys: URL_BOOL_KEYS,
  });
  readControls();
  runStartupRender({
    restored,
    setPresetFromControls: () => store.set("preset", ids.preset.value),
    regenerateAndRender,
  });
}

init();
