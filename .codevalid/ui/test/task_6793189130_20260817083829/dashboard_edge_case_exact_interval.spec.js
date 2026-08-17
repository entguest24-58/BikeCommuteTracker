import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import {
  setupAuthenticatedSession,
  setupUnauthenticatedSession,
} from "../../helpers/mock-api.js";

function json(route, status, body) {
  return route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  });
}

function buildDashboardResponse({
  totalManualExpenses = 0,
  oilChangeSavings = null,
  netExpenses = null,
  oilChangeIntervalCount = 0,
  allTimeMiles = 0,
  rideCount = 0,
} = {}) {
  return {
    totals: {
      currentMonthMiles: { miles: 0, rideCount: 0, period: "thisMonth" },
      yearToDateMiles: { miles: 0, rideCount: 0, period: "thisYear" },
      allTimeMiles: { miles: allTimeMiles, rideCount, period: "allTime" },
      moneySaved: {
        mileageRateSavings: null,
        fuelCostAvoided: null,
        qualifiedRideCount: 0,
      },
      expenseSummary: {
        totalManualExpenses,
        oilChangeSavings,
        netExpenses,
        oilChangeIntervalCount,
      },
    },
    averages: {
      averageTemperature: null,
      averageMilesPerRide: null,
      averageRideMinutes: null,
    },
    charts: {
      mileageByMonth: [],
      savingsByMonth: [],
    },
    suggestions: [],
    missingData: {
      ridesMissingSavingsSnapshot: 0,
      ridesMissingGasPrice: 0,
      ridesMissingTemperature: 0,
      ridesMissingDuration: 0,
    },
    generatedAtUtc: new Date().toISOString(),
  };
}

test("dashboard correctly handles edge case of exactly 3000-mile intervals for oil-change savings", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "dashboard_edge_case_exact_interval",
    testTitle: testInfo.title,
  });

  await recorder.step("prepare authenticated session and exact-interval dashboard data", async () => {
    await setupUnauthenticatedSession(page);
    await setupAuthenticatedSession(page);
    await page.route("**/api/dashboard", async (route) =>
      json(
        route,
        200,
        buildDashboardResponse({
          totalManualExpenses: 100,
          oilChangeSavings: 50,
          netExpenses: 50,
          oilChangeIntervalCount: 1,
          allTimeMiles: 3000,
          rideCount: 5,
        })
      )
    );
  });

  await recorder.step("load dashboard", async () => {
    await page.goto("/dashboard");
    await expect(
      page.getByRole("heading", { name: "Your riding story, one screen." })
    ).toBeVisible();
  });

  await recorder.step("verify exact interval calculation", async () => {
    await expect(page.locator(".expense-summary-card-row").filter({ hasText: "Total Expenses" })).toContainText("$100.00");
    await expect(page.locator(".expense-summary-card-row").filter({ hasText: "Oil Change Savings" })).toContainText("$50.00");
    await expect(page.locator(".expense-summary-card-row-net-expense")).toContainText("$50.00");
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:dashboard_edge_case_exact_interval");
  await recorder.save(testInfo);
});
