import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupAuthenticatedSession, mockDashboardResponse } from "../../helpers/mock-api.js";
import { authSession } from "../../mock/mock-data.js";

test("Dashboard NetExpense subtracts oil-change savings from total manual expenses", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({ testId: "dashboard_net_expense_includes_oil_savings", testTitle: testInfo.title });

  await recorder.step("seed dashboard financial summary", async () => {
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

  await recorder.step("visit dashboard", async () => {
    await page.goto("/dashboard");
  });

  await recorder.step("verify expected values appear somewhere in dashboard", async () => {
    await expect(page.getByText(/\$150/)).toBeVisible();
    await expect(page.getByText(/\$90/)).toBeVisible();
    await expect(page.getByText(/\$60/)).toBeVisible();
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:dashboard_net_expense_includes_oil_savings");
  await recorder.save(testInfo);
});
