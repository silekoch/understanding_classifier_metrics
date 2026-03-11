import { describe, expect, it } from "vitest";
import { clampPointLabelPosition } from "../viz/svg.js";

describe("svg label placement", () => {
  it("keeps point-following labels inside the plot box", () => {
    const box = { left: 10, top: 20, width: 100, height: 80 };

    const topRight = clampPointLabelPosition({ box, x: 200, y: 0, labelWidth: 40 });
    expect(topRight.x).toBeLessThanOrEqual(box.left + box.width - 40);
    expect(topRight.y).toBeGreaterThanOrEqual(box.top + 14);

    const bottomLeft = clampPointLabelPosition({ box, x: -100, y: 999, labelWidth: 40 });
    expect(bottomLeft.x).toBeGreaterThanOrEqual(box.left + 6);
    expect(bottomLeft.y).toBeLessThanOrEqual(box.top + box.height - 6);
  });
});
