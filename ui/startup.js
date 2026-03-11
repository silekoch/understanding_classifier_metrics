export function runStartupRender({ restored, setPresetFromControls, readControls, regenerateAndRender }) {
  if (restored) {
    readControls();
    regenerateAndRender();
    return;
  }

  const didSetPreset = setPresetFromControls();
  if (!didSetPreset) {
    regenerateAndRender();
  }
}
