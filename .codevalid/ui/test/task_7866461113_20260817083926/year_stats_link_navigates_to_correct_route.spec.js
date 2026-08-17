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

test("Clicking Year Stats Dashboard link navigates to /dashboard/year-stats", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "year_stats_link_navigates_to_correct_route",
    testTitle: testInfo.title,
  });

  await recorder.step("Seed authenticated session", async () => {
    await setupAuthenticatedSession(page, authSession);
  });

  await recorder.step("Mock APIs required by the source dashboard and year stats destination", async () => {
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

    await page.route("**/api/dashboard/available-years", async (route) =>
      json(route, 200, { years: [2026] })
    );

    await page.route(/.*\/api\/dashboard\/year-stats\/\d{4}$/, async (route) =>
      json(route, 200, {
        year: 2026,
        hasDataForYear: false,
        totals: {
          totalMiles: 0,
          totalCombinedSavings: 0,
          expenseSummary: {
            totalManualExpenses: 0,
          },
        },
        mileageByMonth: [],
        savingsByMonth: [],
        difficulty: {
          hasData: false,
          overallAverageDifficulty: null,
          byMonth: [],
          mostDifficultMonths: [],
        },
        windResistance: {
          hasData: false,
          bins: [],
        },
      })
    );
  });

  await recorder.step("Open an authenticated page with the Year Stats link visible", async () => {
    await page.goto("/dashboard");
    await expect(page.getByRole("heading", { name: "Your riding story, one screen." })).toBeVisible();
    await expect(page.getByRole("link", { name: "Year Stats" })).toBeVisible();
  });

  await recorder.step("Click the Year Stats link and verify client-side navigation", async () => {
    await page.getByRole("link", { name: "Year Stats" }).click();
    await expect(page).toHaveURL(/\/dashboard\/year-stats$/);
    await expect(page.getByRole("heading", { name: "Pick a year, see the whole story." })).toBeVisible();
    await expect(page.getByText("No ride data for 2026.")).toBeVisible();
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:year_stats_link_navigates_to_correct_route");
  await recorder.save(testInfo);
});
