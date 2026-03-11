import { PRESETS } from "./presets.js";
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
  applyPresetValues as applyPresetValuesImpl,
  syncControlOutputs as syncControlOutputsImpl,
} from "./ui/preset-controls.js";
import { getIds } from "./ui/dom-ids.js";
import { renderMetricsText as renderMetricsTextView } from "./ui/metrics-text.js";
import { readControls as readControlsImpl } from "./ui/control-values.js";

(function () {
  const state = {
    preset: "separated",
    muNeg: 0,
    sdNeg: 1,
    muPos: 2,
    sdPos: 1,
    logSigma: 0.7,
    dfNeg: 3,
    dfPos: 3,
    mixWeight: 0.24,
    mixOffset: 0.15,
    mixSdMult: 1.1,
    p0Neg: 0.42,
    p0Pos: 0.12,
    zeroValue: 0,
    alphaNeg: 2.0,
    betaNeg: 8.0,
    alphaPos: 8.0,
    betaPos: 2.0,
    epsPos: 0.12,
    epsNeg: 0.08,
    confSharpness: 14.0,
    samplePosFrac: 0.5,
    nPerClass: 500,
    outlierFrac: 0,
    seed: 13,
    threshold: 1,
    rocClickBox: null,
    prClickBox: null,
    metricTrendBox: null,
    metricTrendHoverKey: null,
    distView: null,
    draggingThreshold: false,
    draggingMetricThreshold: false,
    urlSyncTimer: null,
    data: null,
    roc: null,
    pr: null,
    metricCurves: null,
  };

  const ids = getIds(document);

  const URL_NUM_KEYS = [
    "muNeg",
    "sdNeg",
    "muPos",
    "sdPos",
    "logSigma",
    "dfNeg",
    "dfPos",
    "mixWeight",
    "mixOffset",
    "mixSdMult",
    "p0Neg",
    "p0Pos",
    "zeroValue",
    "alphaNeg",
    "betaNeg",
    "alphaPos",
    "betaPos",
    "epsPos",
    "epsNeg",
    "confSharpness",
    "nPerClass",
    "samplePosFrac",
    "outlierFrac",
    "seed",
    "threshold",
  ];

  const URL_BOOL_KEYS = [];

  function fmt(num, digits = 4) {
    if (!Number.isFinite(num)) return "NaN";
    return num.toFixed(digits);
  }

  function fmtPct(value, digits = 1) {
    return `${fmt(value * 100, digits)}%`;
  }

  function readControls() {
    readControlsImpl({ ids, state });
  }

  function syncControlOutputs() {
    syncControlOutputsImpl({
      ids,
      state,
      presets: PRESETS,
      fmt,
      fmtPct,
    });
  }

  function applyPresetValues(name) {
    applyPresetValuesImpl({
      ids,
      presets: PRESETS,
      name,
    });
  }

  function applyPreset(name) {
    applyPresetValues(name);
    readControls();
    regenerateAndRender();
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

  function drawRoc() {
    state.rocClickBox = drawRocView({
      svg: ids.rocSvg,
      roc: state.roc,
      threshold: state.threshold,
      fmt,
    });
  }

  function drawPr() {
    state.prClickBox = drawPrView({
      svg: ids.prSvg,
      pr: state.pr,
      threshold: state.threshold,
      fmt,
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

  function drawDist() {
    state.distView = drawDistView({
      svg: ids.distSvg,
      data: state.data,
      threshold: state.threshold,
      fmt,
    });
  }

  function drawConfusionMatrix() {
    drawConfusionMatrixView({
      svg: ids.confusionSvg,
      op: state.roc.op,
      fmtPct,
    });
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

  function restoreStateFromUrl() {
    return restoreStateFromUrlImpl({
      ids,
      presets: PRESETS,
      applyPresetValues,
      urlNumKeys: URL_NUM_KEYS,
      urlBoolKeys: URL_BOOL_KEYS,
    });
  }

  function renderMetrics() {
    renderMetricsTextView({
      metricsTextEl: ids.metricsText,
      op: state.roc.op,
      fmt,
    });
  }

  function renderAll() {
    computeEverything();
    syncControlOutputs();
    drawDist();
    drawConfusionMatrix();
    drawRoc();
    drawPr();
    renderMetrics();
    drawMetricTrend();
    scheduleUrlSync();
  }

  function regenerateAndRender() {
    readControls();
    state.data = generateSampleData(state, getActivePreset());
    updateThresholdRange();
    state.metricCurves = computeMetricCurves(state.data.all, state.thresholdMin, state.thresholdMax);
    renderAll();
  }

  function initHandlers() {
    initControlHandlers({
      ids,
      state,
      readControls,
      regenerateAndRender,
      applyPreset,
      scheduleUrlSync,
      renderAll,
      drawMetricTrend,
      metricTrendHoverKeyFromPointer: metricTrendHoverKeyFromPointerView,
    });
  }

  function init() {
    initHandlers();
    if (restoreStateFromUrl()) {
      readControls();
      regenerateAndRender();
    } else {
      applyPreset(ids.preset.value);
    }
  }

  init();
})();
