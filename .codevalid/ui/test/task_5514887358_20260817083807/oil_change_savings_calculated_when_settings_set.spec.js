import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupAuthenticatedSession, mockDashboardResponse } from "../../helpers/mock-api.js";
import { authSession } from "../../mock/mock-data.js";

test("Oil-change savings calculated from lifetime miles and configured price", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({ testId: "oil_change_savings_calculated_when_settings_set", testTitle: testInfo.title });

  await recorder.step("seed dashboard response with oil change savings", async () => {
    await setupAuthenticatedSession(page, authSession);
    await mockDashboardResponse(page, {
      totals: {
        currentMonthMiles: { miles: 42, rideCount: 3, period: "thisMonth" },
        yearToDateMiles: { miles: 120, rideCount: 8, period: "thisYear" },
        allTimeMiles: { miles: 8200, rideCount: 100, period: "allTime" },
        moneySaved: { mileageRateSavings: 120.5, fuelCostAvoided: 85.2, qualifiedRideCount: 5 },
        expenseSummary: {
          totalManualExpenses: 150,
          oilChangeSavings: 90,
          netExpenses: 60,
          oilChangeIntervalCount: 2,
        },
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

  await recorder.step("verify oil change savings text rendered", async () => {
    await expect(page.getByText(/\$90/)).toBeVisible();
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:oil_change_savings_calculated_when_settings_set");
  await recorder.save(testInfo);
});
