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

test("dashboard correctly sums multiple manual expenses with unset oil price", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "dashboard_manual_expenses_only",
    testTitle: testInfo.title,
  });

  await recorder.step("prepare authenticated session and dashboard totals", async () => {
    await setupUnauthenticatedSession(page);
    await setupAuthenticatedSession(page);
    await page.route("**/api/dashboard", async (route) =>
      json(
        route,
        200,
        buildDashboardResponse({
          totalManualExpenses: 49.25,
          oilChangeSavings: null,
          netExpenses: 49.25,
          oilChangeIntervalCount: 0,
          allTimeMiles: 0,
          rideCount: 0,
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

  await recorder.step("verify manual expenses only state", async () => {
    await expect(page.getByText("Total Expenses")).toBeVisible();
    await expect(page.getByText("$49.25")).toBeVisible();
    await expect(page.getByText("Oil Change Savings")).toBeVisible();
    await expect(page.getByText("—")).toBeVisible();
    await expect(page.getByText("Net Expenses")).toBeVisible();
    await expect(page.locator(".expense-summary-card-row-net-expense")).toContainText("$49.25");
    await expect(page.locator(".expense-summary-card-row-net-savings")).toHaveCount(0);
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:dashboard_manual_expenses_only");
  await recorder.save(testInfo);
});
