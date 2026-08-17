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

test("dashboard recalculate net expense immediately after an expense is deleted", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "dashboard_expense_deleted_updates_dashboard",
    testTitle: testInfo.title,
  });

  let dashboardRequestCount = 0;

  await recorder.step("prepare authenticated session and sequential dashboard states", async () => {
    await setupUnauthenticatedSession(page);
    await setupAuthenticatedSession(page);
    await page.route("**/api/dashboard", async (route) => {
      dashboardRequestCount += 1;
      if (dashboardRequestCount === 1) {
        return json(
          route,
          200,
          buildDashboardResponse({
            totalManualExpenses: 55,
            oilChangeSavings: 120,
            netExpenses: -65,
            oilChangeIntervalCount: 2,
            allTimeMiles: 6000,
            rideCount: 10,
          })
        );
      }

      return json(
        route,
        200,
        buildDashboardResponse({
          totalManualExpenses: 15,
          oilChangeSavings: 120,
          netExpenses: -105,
          oilChangeIntervalCount: 2,
          allTimeMiles: 6000,
          rideCount: 10,
        })
      );
    });
  });

  await recorder.step("load dashboard and confirm initial totals", async () => {
    await page.goto("/dashboard");
    await expect(page.locator(".expense-summary-card-row").filter({ hasText: "Total Expenses" })).toContainText("$55.00");
    await expect(page.locator(".expense-summary-card-row-net-savings")).toContainText("-$65.00");
  });

  await recorder.step("simulate dashboard refresh after deletion", async () => {
    await page.reload();
    await expect(page.locator(".expense-summary-card-row").filter({ hasText: "Total Expenses" })).toContainText("$15.00");
    await expect(page.locator(".expense-summary-card-row").filter({ hasText: "Oil Change Savings" })).toContainText("$120.00");
    await expect(page.locator(".expense-summary-card-row-net-savings")).toContainText("-$105.00");
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:dashboard_expense_deleted_updates_dashboard");
  await recorder.save(testInfo);
});
