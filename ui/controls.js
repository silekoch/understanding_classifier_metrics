import { eventToSvgCoordinates } from "../viz/svg.js";

function clamp(x, a, b) {
  return Math.max(a, Math.min(b, x));
}

function nearestFiniteThreshold(points, xTarget, yTarget, xKey = "fpr", yKey = "tpr") {
  let best = null;
  let bestDist = Infinity;

  for (const p of points) {
    if (!Number.isFinite(p.threshold)) {
      continue;
    }
    const dx = p[xKey] - xTarget;
    const dy = p[yKey] - yTarget;
    const d2 = dx * dx + dy * dy;
    if (d2 < bestDist) {
      bestDist = d2;
      best = p;
    }
  }

  return best;
}

function thresholdFromDistPointer({ evt, state, ids }) {
  const view = state.distView;
  if (!view) {
    return state.threshold;
  }
  const point = eventToSvgCoordinates(evt, ids.distSvg, 760, 320);
  const x = point.x;
  const u = clamp((x - view.box.left) / view.box.width, 0, 1);
  return view.minX + u * (view.maxX - view.minX);
}

function thresholdFromMetricTrendPointer({ evt, state, ids }) {
  const box = state.metricTrendBox;
  if (!box) {
    return state.threshold;
  }
  const point = eventToSvgCoordinates(evt, ids.metricTrendSvg, 760, 240);
  const u = clamp((point.x - box.left) / box.width, 0, 1);
  return state.thresholdMin + u * (state.thresholdMax - state.thresholdMin);
}

function isThresholdTarget(el) {
  if (!el || typeof el.getAttribute !== "function") {
    return false;
  }
  const role = el.getAttribute("data-role");
  return role === "threshold-handle" || role === "threshold-line";
}

function attachRegenerateListeners({ ids, readControls, regenerateAndRender }) {
  const regenerateIds = [
    ids.muNeg,
    ids.sdNeg,
    ids.muPos,
    ids.sdPos,
    ids.logSigma,
    ids.dfNeg,
    ids.dfPos,
    ids.mixWeight,
    ids.mixOffset,
    ids.mixSdMult,
    ids.p0Neg,
    ids.p0Pos,
    ids.zeroValue,
    ids.alphaNeg,
    ids.betaNeg,
    ids.alphaPos,
    ids.betaPos,
    ids.epsPos,
    ids.epsNeg,
    ids.confSharpness,
  ];

  regenerateIds.forEach((el) => {
    if (!el) {
      return;
    }
    el.addEventListener("input", () => {
      readControls();
      regenerateAndRender();
    });
    el.addEventListener("change", () => {
      readControls();
      regenerateAndRender();
    });
  });
}

function attachSeedListeners({ ids, applySeed }) {
  const handleSeedInput = () => {
    applySeed(Number(ids.seed.value));
  };
  ids.seed.addEventListener("input", handleSeedInput);
  ids.seed.addEventListener("change", handleSeedInput);
}

function attachNPerClassListeners({ ids, applyNPerClass }) {
  const handleNPerClassInput = () => {
    applyNPerClass(Number(ids.nPerClass.value));
  };
  ids.nPerClass.addEventListener("input", handleNPerClassInput);
  ids.nPerClass.addEventListener("change", handleNPerClassInput);
}

function attachSamplePosFracListeners({ ids, applySamplePosFrac }) {
  const handleSamplePosFracInput = () => {
    applySamplePosFrac(Number(ids.samplePosFrac.value));
  };
  ids.samplePosFrac.addEventListener("input", handleSamplePosFracInput);
  ids.samplePosFrac.addEventListener("change", handleSamplePosFracInput);
}

function attachOutlierFracListeners({ ids, applyOutlierFrac }) {
  const handleOutlierFracInput = () => {
    applyOutlierFrac(Number(ids.outlierFrac.value));
  };
  ids.outlierFrac.addEventListener("input", handleOutlierFracInput);
  ids.outlierFrac.addEventListener("change", handleOutlierFracInput);
}

function attachRocClickHandler({ ids, state, setThreshold }) {
  ids.rocSvg.addEventListener("click", (evt) => {
    const box = state.rocClickBox;
    if (!box) {
      return;
    }

    const point = eventToSvgCoordinates(evt, ids.rocSvg, 760, 420);
    const x = point.x;
    const y = point.y;

    const fpr = clamp((x - box.left) / box.width, 0, 1);
    const tpr = clamp(1 - (y - box.top) / box.height, 0, 1);

    const nearest = nearestFiniteThreshold(state.roc.empirical, fpr, tpr);
    if (!nearest) {
      return;
    }

    setThreshold(nearest.threshold);
  });
}

function attachPrClickHandler({ ids, state, setThreshold }) {
  ids.prSvg.addEventListener("click", (evt) => {
    const box = state.prClickBox;
    if (!box) {
      return;
    }

    const point = eventToSvgCoordinates(evt, ids.prSvg, 760, 420);
    const x = point.x;
    const y = point.y;

    const recall = clamp((x - box.left) / box.width, 0, 1);
    const precision = clamp(1 - (y - box.top) / box.height, 0, 1);

    const nearest = nearestFiniteThreshold(state.pr.points, recall, precision, "recall", "precision");
    if (!nearest) {
      return;
    }

    setThreshold(nearest.threshold);
  });
}

function attachMetricTrendHandlers({
  ids,
  state,
  setThreshold,
  setMetricTrendHoverKey,
  metricTrendHoverKeyFromPointer,
}) {
  ids.metricTrendSvg.addEventListener("pointerdown", (evt) => {
    const box = state.metricTrendBox;
    if (!box) {
      return;
    }
    const point = eventToSvgCoordinates(evt, ids.metricTrendSvg, 760, 240);
    if (
      point.x < box.left ||
      point.x > box.left + box.width ||
      point.y < box.top ||
      point.y > box.top + box.height
    ) {
      return;
    }
    evt.preventDefault();
    setMetricTrendHoverKey(null);
    state.draggingMetricThreshold = true;
    ids.metricTrendSvg.setPointerCapture(evt.pointerId);
    setThreshold(thresholdFromMetricTrendPointer({ evt, state, ids }));
  });

  ids.metricTrendSvg.addEventListener("pointermove", (evt) => {
    if (state.draggingMetricThreshold) {
      evt.preventDefault();
      setThreshold(thresholdFromMetricTrendPointer({ evt, state, ids }));
      return;
    }
    const legendKey =
      evt.target && typeof evt.target.getAttribute === "function"
        ? evt.target.getAttribute("data-legend-key")
        : null;
    if (legendKey) {
      setMetricTrendHoverKey(legendKey);
      return;
    }
    setMetricTrendHoverKey(
      metricTrendHoverKeyFromPointer({
        evt,
        svg: ids.metricTrendSvg,
        box: state.metricTrendBox,
        curves: state.metricCurves,
      })
    );
  });

  ids.metricTrendSvg.addEventListener("pointerup", (evt) => {
    if (!state.draggingMetricThreshold) {
      return;
    }
    state.draggingMetricThreshold = false;
    if (ids.metricTrendSvg.hasPointerCapture(evt.pointerId)) {
      ids.metricTrendSvg.releasePointerCapture(evt.pointerId);
    }
  });

  ids.metricTrendSvg.addEventListener("pointercancel", (evt) => {
    if (!state.draggingMetricThreshold) {
      return;
    }
    state.draggingMetricThreshold = false;
    if (ids.metricTrendSvg.hasPointerCapture(evt.pointerId)) {
      ids.metricTrendSvg.releasePointerCapture(evt.pointerId);
    }
  });

  ids.metricTrendSvg.addEventListener("pointerleave", () => {
    if (state.draggingMetricThreshold) {
      return;
    }
    setMetricTrendHoverKey(null);
  });
}

function attachDistThresholdHandlers({ ids, state, setThreshold }) {
  ids.distSvg.addEventListener("pointerdown", (evt) => {
    if (!isThresholdTarget(evt.target)) {
      return;
    }
    evt.preventDefault();
    state.draggingThreshold = true;
    ids.distSvg.setPointerCapture(evt.pointerId);
    setThreshold(thresholdFromDistPointer({ evt, state, ids }));
  });

  ids.distSvg.addEventListener("pointermove", (evt) => {
    if (!state.draggingThreshold) {
      return;
    }
    evt.preventDefault();
    setThreshold(thresholdFromDistPointer({ evt, state, ids }));
  });

  ids.distSvg.addEventListener("pointerup", (evt) => {
    if (!state.draggingThreshold) {
      return;
    }
    state.draggingThreshold = false;
    if (ids.distSvg.hasPointerCapture(evt.pointerId)) {
      ids.distSvg.releasePointerCapture(evt.pointerId);
    }
  });

  ids.distSvg.addEventListener("pointercancel", (evt) => {
    if (!state.draggingThreshold) {
      return;
    }
    state.draggingThreshold = false;
    if (ids.distSvg.hasPointerCapture(evt.pointerId)) {
      ids.distSvg.releasePointerCapture(evt.pointerId);
    }
  });

  ids.distSvg.addEventListener("keydown", (evt) => {
    if (!isThresholdTarget(evt.target)) {
      return;
    }
    const step = state.thresholdStep || 0.001;
    const delta = evt.shiftKey ? step * 20 : step;
    let nextThreshold = null;
    if (evt.key === "ArrowLeft") {
      evt.preventDefault();
      nextThreshold = state.threshold - delta;
    } else if (evt.key === "ArrowRight") {
      evt.preventDefault();
      nextThreshold = state.threshold + delta;
    } else if (evt.key === "Home") {
      evt.preventDefault();
      nextThreshold = state.thresholdMin;
    } else if (evt.key === "End") {
      evt.preventDefault();
      nextThreshold = state.thresholdMax;
    } else {
      return;
    }
    setThreshold(nextThreshold);
  });
}

export function initHandlers({
  ids,
  state,
  readControls,
  regenerateAndRender,
  applyPreset,
  scheduleUrlSync,
  applyThreshold,
  applyNPerClass,
  applySamplePosFrac,
  applyOutlierFrac,
  applySeed,
  applyMetricTrendHoverKey,
  metricTrendHoverKeyFromPointer,
}) {
  const setThreshold = applyThreshold;
  const setMetricTrendHoverKey = applyMetricTrendHoverKey;

  attachRegenerateListeners({ ids, readControls, regenerateAndRender });
  attachNPerClassListeners({ ids, applyNPerClass });
  attachSamplePosFracListeners({ ids, applySamplePosFrac });
  attachOutlierFracListeners({ ids, applyOutlierFrac });
  attachSeedListeners({ ids, applySeed });

  ids.resample.addEventListener("click", () => {
    applySeed(state.seed + 1);
  });

  ids.preset.addEventListener("change", (e) => {
    applyPreset(e.target.value);
  });

  ids.advancedDetails.addEventListener("toggle", () => {
    scheduleUrlSync();
  });

  attachRocClickHandler({ ids, state, setThreshold });
  attachPrClickHandler({ ids, state, setThreshold });
  attachMetricTrendHandlers({
    ids,
    state,
    setThreshold,
    setMetricTrendHoverKey,
    metricTrendHoverKeyFromPointer,
  });
  attachDistThresholdHandlers({ ids, state, setThreshold });
}
