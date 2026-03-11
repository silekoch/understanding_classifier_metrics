function parseBoolParam(value) {
  if (value === "1" || value === "true") {
    return true;
  }
  if (value === "0" || value === "false") {
    return false;
  }
  return null;
}

function formatRestoreIssues(issues) {
  if (!issues.length) {
    return "";
  }
  if (issues.length === 1) {
    return `URL parameter warning: ${issues[0]}`;
  }
  return `URL parameter warnings (${issues.length}): ${issues.join(" ")}`;
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

export function restoreStateFromUrl({
  ids,
  presets,
  applyPresetValues,
  urlNumKeys,
  urlBoolKeys,
  onIssue = null,
}) {
  const params = new URLSearchParams(window.location.search);
  if (!params.toString()) {
    return false;
  }
  const issues = [];

  // Precedence contract: apply preset first, then apply explicit URL control params,
  // so a shared link can tweak individual controls on top of a base preset.
  const preset = params.get("preset");
  if (preset && presets[preset]) {
    applyPresetValues(preset);
  } else {
    if (preset) {
      issues.push(`Unknown preset "${preset}" was ignored.`);
    }
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
    } else {
      issues.push(`Invalid numeric value "${raw}" for "${key}" was ignored.`);
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
    const parsed = parseBoolParam(raw);
    if (parsed == null) {
      issues.push(`Invalid boolean value "${raw}" for "${key}" was ignored.`);
      continue;
    }
    ids[key].checked = parsed;
  }

  if (params.has("advancedOpen")) {
    const raw = params.get("advancedOpen");
    const parsed = parseBoolParam(raw);
    if (parsed == null) {
      issues.push(`Invalid boolean value "${raw}" for "advancedOpen" was ignored.`);
    } else {
      ids.advancedDetails.open = parsed;
    }
  }

  if (issues.length && typeof onIssue === "function") {
    onIssue(formatRestoreIssues(issues));
  }
  return true;
}
