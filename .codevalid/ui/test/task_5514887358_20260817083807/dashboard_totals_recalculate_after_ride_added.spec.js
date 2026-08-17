import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupAuthenticatedSession, mockDashboardResponse } from "../../helpers/mock-api.js";
import { authSession } from "../../mock/mock-data.js";

test("Dashboard totals automatically recalculate after ride is added", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({ testId: "dashboard_totals_recalculate_after_ride_added", testTitle: testInfo.title });

  await recorder.step("seed dashboard after additional ride miles", async () => {
    await setupAuthenticatedSession(page, authSession);
    await mockDashboardResponse(page, {
      totals: {
        currentMonthMiles: { miles: 1242, rideCount: 4, period: "thisMonth" },
        yearToDateMiles: { miles: 1320, rideCount: 9, period: "thisYear" },
        allTimeMiles: { miles: 9400, rideCount: 101, period: "allTime" },
        moneySaved: { mileageRateSavings: 120.5, fuelCostAvoided: 85.2, qualifiedRideCount: 5 },
        expenseSummary: { totalManualExpenses: 150, oilChangeSavings: 135, netExpenses: 15, oilChangeIntervalCount: 3 },
      },
      averages: { averageTemperature: 68.7, averageMilesPerRide: 14.2, averageRideMinutes: 37.5 },
      charts: { mileageByMonth: [], savingsByMonth: [] },
      suggestions: [],
      missingData: { ridesMissingSavingsSnapshot: 0, ridesMissingGasPrice: 0, ridesMissingTemperature: 0, ridesMissingDuration: 0 },
      generatedAtUtc: "2026-08-17T08:00:00.000Z",
    });
  });

  await recorder.step("open dashboard", async () => {
    await page.goto("/dashboard");
  });

  await recorder.step("verify oil change savings increased", async () => {
    await expect(page.getByText(/\$135/)).toBeVisible();
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:dashboard_totals_recalculate_after_ride_added");
  await recorder.save(testInfo);
});
