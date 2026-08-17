import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { authSession } from "../../mock/mock-data.js";
import { setupAuthenticatedSession } from "../../helpers/mock-api.js";

function json(route, status, body) {
  return route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  });
}

test("Year Stats Dashboard link is rendered for authenticated users", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "year_stats_link_rendered_for_authenticated_user",
    testTitle: testInfo.title,
  });

  await recorder.step("Seed authenticated session", async () => {
    await setupAuthenticatedSession(page, authSession);
  });

  await recorder.step("Mock dashboard APIs needed for protected page load", async () => {
    await page.route("**/api/dashboard", async (route) =>
      json(route, 200, {
        totals: {
          totalMiles: 0,
          totalRideCount: 0,
          totalSavings: 0,
          totalGasSavings: 0,
          totalParkingSavings: 0,
          totalTransitSavings: 0,
          totalCombinedSavings: 0,
        },
        mileageByMonth: [],
        savingsByMonth: [],
        insights: {
          hasRideData: false,
        },
      })
    );
  });

  await recorder.step("Load an authenticated page", async () => {
    await page.goto("/dashboard");
    await expect(page.getByRole("heading", { name: "Your riding story, one screen." })).toBeVisible();
  });

  await recorder.step("Verify the Year Stats navigation link is visible with correct href", async () => {
    const yearStatsLink = page.getByRole("link", { name: "Year Stats" });
    await expect(yearStatsLink).toBeVisible();
    await expect(yearStatsLink).toHaveAttribute("href", "/dashboard/year-stats");
    await expect(page.getByRole("link", { name: "Dashboard" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Advanced Stats" })).toBeVisible();
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:year_stats_link_rendered_for_authenticated_user");
  await recorder.save(testInfo);
});
