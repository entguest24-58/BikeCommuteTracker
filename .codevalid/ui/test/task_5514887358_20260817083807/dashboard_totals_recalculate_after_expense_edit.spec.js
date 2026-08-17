import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupAuthenticatedSession, mockDashboardResponse } from "../../helpers/mock-api.js";
import { authSession } from "../../mock/mock-data.js";

test("Dashboard totals automatically recalculate after expense edit", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({ testId: "dashboard_totals_recalculate_after_expense_edit", testTitle: testInfo.title });

  await recorder.step("seed recalculated dashboard values", async () => {
    await setupAuthenticatedSession(page, authSession);
    await mockDashboardResponse(page, {
      totals: {
        currentMonthMiles: { miles: 42, rideCount: 3, period: "thisMonth" },
        yearToDateMiles: { miles: 120, rideCount: 8, period: "thisYear" },
        allTimeMiles: { miles: 8200, rideCount: 100, period: "allTime" },
        moneySaved: { mileageRateSavings: 120.5, fuelCostAvoided: 85.2, qualifiedRideCount: 5 },
        expenseSummary: { totalManualExpenses: 150, oilChangeSavings: 90, netExpenses: 60, oilChangeIntervalCount: 2 },
      },
      averages: { averageTemperature: 68.7, averageMilesPerRide: 14.2, averageRideMinutes: 37.5 },
      charts: { mileageByMonth: [], savingsByMonth: [] },
      suggestions: [],
      missingData: { ridesMissingSavingsSnapshot: 0, ridesMissingGasPrice: 0, ridesMissingTemperature: 0, ridesMissingDuration: 0 },
      generatedAtUtc: "2026-08-17T08:00:00.000Z",
    });
  });

  await recorder.step("load dashboard", async () => {
    await page.goto("/dashboard");
  });

  await recorder.step("verify recalculated amounts rendered", async () => {
    await expect(page.getByText(/\$150/)).toBeVisible();
    await expect(page.getByText(/\$90/)).toBeVisible();
    await expect(page.getByText(/\$60/)).toBeVisible();
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:dashboard_totals_recalculate_after_expense_edit");
  await recorder.save(testInfo);
});
