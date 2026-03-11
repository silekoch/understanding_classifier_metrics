import { PRESETS } from "./presets.js";
import { createInitialState } from "./core/state.js";
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
  applyPresetValues as applyPresetValuesImpl,
  syncControlOutputs as syncControlOutputsImpl,
} from "./ui/preset-controls.js";
import { getIds } from "./ui/dom-ids.js";
import { renderMetricsText as renderMetricsTextView } from "./ui/metrics-text.js";
import { readControls as readControlsImpl } from "./ui/control-values.js";
import { URL_BOOL_KEYS, URL_NUM_KEYS } from "./ui/url-state-keys.js";

(function () {
  const state = createInitialState();

  const ids = getIds(document);

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
