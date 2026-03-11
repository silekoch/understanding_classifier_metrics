export function runStartupRender({ restored, setPresetFromControls, regenerateAndRender }) {
  if (restored) {
    regenerateAndRender();
    return;
  }

  const didSetPreset = setPresetFromControls();
  if (!didSetPreset) {
    regenerateAndRender();
  }
}
