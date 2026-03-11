import { expect, test } from "@playwright/test";

const REQUIRED_SVGS = ["rocSvg", "prSvg", "distSvg", "confusionSvg", "metricTrendSvg"];

test("cold startup renders all chart panels", async ({ page }) => {
  await page.goto("/");

  for (const id of REQUIRED_SVGS) {
    await expect
      .poll(
        async () => {
          return page.evaluate((svgId) => {
            const svg = document.getElementById(svgId);
            return svg ? svg.childElementCount : 0;
          }, id);
        },
        {
          message: `expected #${id} to render at least one SVG child on startup`,
        }
      )
      .toBeGreaterThan(0);
  }
});
