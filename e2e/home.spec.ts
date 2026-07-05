import { expect, test } from "@playwright/test";

// SCAFFOLD EXAMPLE — a smoke test for the home overview. Keep/adapt as the home
// surface evolves; delete if the example fleet-summary grid is removed.
test("home overview renders fleet KPIs", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Overview" })).toBeVisible();
  await expect(page.getByText("In transit")).toBeVisible();
  await expect(page.getByText("On-time rate")).toBeVisible();
});
