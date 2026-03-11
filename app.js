import { PRESETS } from "./presets.js";
import { createInitialState } from "./core/state.js";
import { fmt, fmtPct } from "./core/format.js";
import { computeMetricCurves } from "./core/metrics.js";
import {
  computeCurveState as computeCurveStateCore,
  computeThresholdBounds as computeThresholdBoundsCore,
} from "./core/derived-state.js";
import { generateData as generateSampleData } from "./core/data.js";
import {
  drawConfusionMatrix as drawConfusionMatrixUi,
  drawDist as drawDistUi,
  drawMetricTrend as drawMetricTrendUi,
  drawPr as drawPrUi,
  drawRoc as drawRocUi,
  metricTrendHoverKeyFromPointer as metricTrendHoverKeyFromPointerUi,
  renderMetrics as renderMetricsUi,
} from "./ui/view-renderers.js";
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

  function renderAll() {
    computeEverything();
    syncControlOutputs();
    drawDistUi({ ids, state, fmt });
    drawConfusionMatrixUi({ ids, state, fmtPct });
    drawRocUi({ ids, state, fmt });
    drawPrUi({ ids, state, fmt });
    renderMetricsUi({ ids, state, fmt });
    drawMetricTrendUi({ ids, state, fmt });
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
      drawMetricTrend: () => drawMetricTrendUi({ ids, state, fmt }),
      metricTrendHoverKeyFromPointer: metricTrendHoverKeyFromPointerUi,
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
