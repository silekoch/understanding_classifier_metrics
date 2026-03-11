export function runStartupRender({ restored, setPresetFromControls, regenerateAndRender }) {
  if (restored) {
    regenerateAndRender();
    return;
  }

  // setPresetFromControls should return true only when it triggered a preset change
  // that will produce an immediate reactive render through subscriptions.
  const didSetPreset = setPresetFromControls();
  if (!didSetPreset) {
    regenerateAndRender();
  }
}
