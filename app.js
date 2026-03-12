import { PRESETS } from "./presets.js";
import { createInitialControlValues, createInitialState } from "./core/state.js";
import { createStateStore } from "./core/state-store.js";
import { assertValidPresets } from "./core/preset-validation.js";
import { fmt, fmtPct } from "./core/format.js";
import { computeMetricCurves, computeOperatingPoint } from "./core/metrics.js";
import { computeCurveState, computeThresholdBounds } from "./core/derived-state.js";
import { generateData } from "./core/data.js";
import { drawRoc } from "./viz/roc.js";
import { drawPr } from "./viz/pr.js";
import { drawDist } from "./viz/dist.js";
import { drawConfusionMatrix } from "./viz/matrix.js";
import { drawMetricTrend, metricTrendHoverKeyFromPointer } from "./viz/metric-trend.js";
import { initHandlers } from "./ui/controls.js";
import { restoreStateFromUrl, saveStateToUrl, scheduleUrlSync } from "./ui/url-state.js";
import { applyPresetValues, syncControlOutputs } from "./ui/preset-controls.js";
import { getIds } from "./ui/dom-ids.js";
import { writeControls } from "./ui/control-values.js";
import { URL_BOOL_KEYS, URL_NUM_KEYS } from "./ui/url-state-keys.js";
import { runStartupRender } from "./ui/startup.js";
import { wireShapeControls } from "./ui/reactive-shape-controls.js";
import { wireReactiveControls } from "./ui/reactive-controls.js";
import { clearStatusBanner, showStatusBanner } from "./ui/status-banner.js";
import { renderMetricTooltip } from "./ui/metric-tooltip.js";

const state = createInitialState();
const view = {
  rocClickBox: null,
  prClickBox: null,
  metricTrendBox: null,
  distView: null,
};
const ids = getIds(document);
const store = createStateStore({
  ...createInitialControlValues(),
  metricTrendHoverKey: state.ui.metricTrendHoverKey,
  metricTooltipKey: state.ui.metricTooltipKey,
});

function getControl(key) {
  return store.get(key);
}

const { applyByKey: shapeApplyByKey } = wireShapeControls({
  store,
  state,
  ids,
  regenerateAndRender,
});

const {
  applyByKey: nonShapeApplyByKey,
  applyThreshold,
  applyMetricTrendHoverState,
  applyPreset,
} = wireReactiveControls({
  store,
  state,
  ids,
  presets: PRESETS,
  applyPresetValues,
  regenerateAndRender,
  renderThresholdViews,
  drawMetricTrend: renderMetricTrend,
});

const applyByKey = {
  ...nonShapeApplyByKey,
  ...shapeApplyByKey,
};

function getActivePreset() {
  return PRESETS[getControl("preset")] || PRESETS.separated;
}

function computeEverything() {
  const threshold = getControl("threshold");
  const { roc, pr } = computeCurveState({
    samples: state.computed.data.all,
    threshold,
  });
  state.computed.roc = roc;
  state.computed.pr = pr;
}

function updateOperatingPoint() {
  if (!state.computed.data || !state.computed.roc || !state.computed.pr) {
    return;
  }
  const op = computeOperatingPoint(getControl("threshold"), state.computed.data.all);
  state.computed.roc.op = op;
  state.computed.pr.op = { recall: op.recall, precision: op.precision };
}

function updateThresholdRange() {
  const bounds = computeThresholdBounds({
    data: state.computed.data,
    threshold: getControl("threshold"),
  });
  state.computed.thresholdMin = bounds.thresholdMin;
  state.computed.thresholdMax = bounds.thresholdMax;
  state.computed.thresholdStep = bounds.thresholdStep;
  store.set("threshold", bounds.threshold, { silent: true });
}

function persistUrlState() {
  saveStateToUrl({
    store,
    ids,
    urlNumKeys: URL_NUM_KEYS,
    urlBoolKeys: URL_BOOL_KEYS,
  });
}

function schedulePersistUrlState() {
  scheduleUrlSync({
    state,
    saveStateToUrl: persistUrlState,
    delayMs: 120,
  });
}

function renderMetricTrend() {
  view.metricTrendBox = drawMetricTrend({
    svg: ids.metricTrendSvg,
    curves: state.computed.metricCurves,
    hoveredKey: state.ui.metricTrendHoverKey,
    threshold: getControl("threshold"),
    thresholdMin: state.computed.thresholdMin,
    thresholdMax: state.computed.thresholdMax,
    fmt,
  });
  renderMetricTooltip({
    el: ids.metricTooltip,
    metricKey: state.ui.metricTooltipKey,
  });
}

function renderThresholdViews() {
  const threshold = getControl("threshold");
  updateOperatingPoint();
  view.distView = drawDist({
    svg: ids.distSvg,
    data: state.computed.data,
    threshold,
    fmt,
  });
  drawConfusionMatrix({
    svg: ids.confusionSvg,
    op: state.computed.roc.op,
    fmtPct,
  });
  view.rocClickBox = drawRoc({
    svg: ids.rocSvg,
    roc: state.computed.roc,
    threshold,
    fmt,
  });
  view.prClickBox = drawPr({
    svg: ids.prSvg,
    pr: state.computed.pr,
    threshold,
    fmt,
  });
  renderMetricTrend();
  schedulePersistUrlState();
}

function renderAll() {
  syncControlOutputs({ ids, store, presets: PRESETS, fmt, fmtPct });
  renderThresholdViews();
}

function regenerateAndRender() {
  state.computed.data = generateData(store.get(), getActivePreset());
  updateThresholdRange();
  computeEverything();
  state.computed.metricCurves = computeMetricCurves(
    state.computed.data.all,
    state.computed.thresholdMin,
    state.computed.thresholdMax
  );
  renderAll();
}

function initAppHandlers() {
  initHandlers({
    ids,
    state,
    view,
    actions: {
      applyPreset,
      applyThreshold,
      applySeed: applyByKey.seed,
      applyMetricTrendHoverState,
    },
    applyByKey,
    deps: {
      scheduleUrlSync: schedulePersistUrlState,
      metricTrendHoverKeyFromPointer,
      getControl,
    },
  });
}

function init() {
  try {
    assertValidPresets(PRESETS);
  } catch (error) {
    showStatusBanner({
      el: ids.statusBanner,
      level: "error",
      message: error instanceof Error ? error.message : "Preset validation failed.",
    });
    throw error;
  }

  initAppHandlers();
  clearStatusBanner({ el: ids.statusBanner });
  restoreStateFromUrl({
    store,
    ids,
    presets: PRESETS,
    urlNumKeys: URL_NUM_KEYS,
    urlBoolKeys: URL_BOOL_KEYS,
    onIssue: (message) =>
      showStatusBanner({
        el: ids.statusBanner,
        level: "warning",
        message,
      }),
  });
  writeControls({ ids, store });
  runStartupRender({
    regenerateAndRender,
  });
}

init();
