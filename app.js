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
import { wireReactiveControls } from "./ui/reactive-controls.js";

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

const {
  applyNumericByKey,
  applyThreshold,
  applyMetricTrendHoverKey,
  applyPreset,
  syncNonShapeControlsToStore,
} = wireReactiveControls({
  store,
  state,
  ids,
  presets: PRESETS,
  applyPresetValues: applyPresetValuesUi,
  regenerateAndRender,
  renderThresholdViews,
  drawMetricTrend,
  clamp,
});

const applyByKey = {
  ...applyNumericByKey,
  p0Neg: applyP0Neg,
  p0Pos: applyP0Pos,
  zeroValue: applyZeroValue,
  alphaNeg: applyAlphaNeg,
  betaNeg: applyBetaNeg,
  alphaPos: applyAlphaPos,
  betaPos: applyBetaPos,
  epsPos: applyEpsPos,
  epsNeg: applyEpsNeg,
  confSharpness: applyConfSharpness,
};

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
  syncNonShapeControlsToStore();
  syncShapeControlsToStore();
  state.metricCurves = computeMetricCurves(state.data.all, state.thresholdMin, state.thresholdMax);
  renderAll();
}

function initHandlers() {
  initControlHandlers({
    ids,
    state,
    actions: {
      applyPreset,
      applyThreshold,
      applySeed: applyNumericByKey.seed,
      applyMetricTrendHoverKey,
    },
    applyByKey,
    deps: {
      scheduleUrlSync,
      metricTrendHoverKeyFromPointer: metricTrendHoverKeyFromPointerView,
    },
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
