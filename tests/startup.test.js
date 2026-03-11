import { describe, expect, it, vi } from "vitest";
import { runStartupRender } from "../ui/startup.js";

describe("startup render flow", () => {
  it("always triggers one initial render", () => {
    const regenerateAndRender = vi.fn();

    runStartupRender({
      regenerateAndRender,
    });

    expect(regenerateAndRender).toHaveBeenCalledTimes(1);
  });
});
