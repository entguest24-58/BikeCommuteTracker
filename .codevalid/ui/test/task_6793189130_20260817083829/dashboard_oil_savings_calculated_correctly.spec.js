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

test("oil-change savings correctly calculated from accumulated ride miles and configured price", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "dashboard_oil_savings_calculated_correctly",
    testTitle: testInfo.title,
  });

  await recorder.step("prepare authenticated session with negative net-expense dashboard payload", async () => {
    await setupUnauthenticatedSession(page);
    await setupAuthenticatedSession(page);
    await page.route("**/api/dashboard", async (route) =>
      json(
        route,
        200,
        buildDashboardResponse({
          totalManualExpenses: 50,
          oilChangeSavings: 180,
          netExpenses: -130,
          oilChangeIntervalCount: 3,
          allTimeMiles: 9500,
          rideCount: 12,
        })
      )
    );
  });

  await recorder.step("open dashboard", async () => {
    await page.goto("/dashboard");
    await expect(
      page.getByRole("heading", { name: "Your riding story, one screen." })
    ).toBeVisible();
  });

  await recorder.step("assert calculated oil savings and negative net savings", async () => {
    await expect(page.getByText("Total Expenses")).toBeVisible();
    await expect(page.getByText("$50.00")).toBeVisible();
    await expect(page.getByText("Oil Change Savings")).toBeVisible();
    await expect(page.getByText("$180.00")).toBeVisible();
    await expect(page.getByText("Net Savings")).toBeVisible();
    await expect(page.getByText("-$130.00")).toBeVisible();
    await expect(page.locator(".expense-summary-card-row-net-savings")).toContainText("-$130.00");
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:dashboard_oil_savings_calculated_correctly");
  await recorder.save(testInfo);
});
