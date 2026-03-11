function parseBoolParam(value, fallback = false) {
  if (value == null) {
    return fallback;
  }
  return value === "1" || value === "true";
}

export function saveStateToUrl({ state, ids, urlNumKeys, urlBoolKeys }) {
  const params = new URLSearchParams();
  params.set("preset", state.controls.preset);
  for (const key of urlNumKeys) {
    if (typeof state.controls[key] === "number" && Number.isFinite(state.controls[key])) {
      params.set(key, String(state.controls[key]));
    }
  }
  for (const key of urlBoolKeys) {
    params.set(key, state.controls[key] ? "1" : "0");
  }
  params.set("advancedOpen", ids.advancedDetails.open ? "1" : "0");

  const next = `${window.location.pathname}?${params.toString()}${window.location.hash}`;
  window.history.replaceState(null, "", next);
}

export function scheduleUrlSync({ state, saveStateToUrl, delayMs = 120 }) {
  if (state.ui.urlSyncTimer) {
    window.clearTimeout(state.ui.urlSyncTimer);
  }
  state.ui.urlSyncTimer = window.setTimeout(() => {
    saveStateToUrl();
    state.ui.urlSyncTimer = null;
  }, delayMs);
}

export function restoreStateFromUrl({ ids, presets, applyPresetValues, urlNumKeys, urlBoolKeys }) {
  const params = new URLSearchParams(window.location.search);
  if (!params.toString()) {
    return false;
  }

  // Precedence contract: apply preset first, then apply explicit URL control params,
  // so a shared link can tweak individual controls on top of a base preset.
  const preset = params.get("preset");
  if (preset && presets[preset]) {
    applyPresetValues(preset);
  } else {
    applyPresetValues(ids.preset.value);
  }

  for (const key of urlNumKeys) {
    if (!ids[key]) {
      continue;
    }
    const raw = params.get(key);
    if (raw == null) {
      continue;
    }
    const num = Number(raw);
    if (Number.isFinite(num)) {
      ids[key].value = String(num);
    }
  }

  for (const key of urlBoolKeys) {
    if (!ids[key]) {
      continue;
    }
    const raw = params.get(key);
    if (raw == null) {
      continue;
    }
    ids[key].checked = parseBoolParam(raw, ids[key].checked);
  }

  if (params.has("advancedOpen")) {
    ids.advancedDetails.open = parseBoolParam(params.get("advancedOpen"));
  }
  return true;
}
