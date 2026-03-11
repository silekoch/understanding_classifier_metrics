const STATUS_LEVEL_CLASSES = ["status-banner--warning", "status-banner--error", "status-banner--info"];

function removeStatusLevelClasses(el) {
  if (!el?.classList) {
    return;
  }
  for (const className of STATUS_LEVEL_CLASSES) {
    el.classList.remove(className);
  }
}

export function showStatusBanner({ el, level = "warning", message }) {
  if (!el || !message) {
    return;
  }
  removeStatusLevelClasses(el);
  el.classList.add(`status-banner--${level}`);
  el.textContent = message;
  el.hidden = false;
}

export function clearStatusBanner({ el }) {
  if (!el) {
    return;
  }
  removeStatusLevelClasses(el);
  el.textContent = "";
  el.hidden = true;
}
