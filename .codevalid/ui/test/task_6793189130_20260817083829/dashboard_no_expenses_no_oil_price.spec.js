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

test("dashboard shows zero net expense and unavailable oil savings with no expenses and unset oil price", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "dashboard_no_expenses_no_oil_price",
    testTitle: testInfo.title,
  });

  await recorder.step("prepare authenticated session and dashboard mock", async () => {
    await setupUnauthenticatedSession(page);
    await setupAuthenticatedSession(page);
    await page.route("**/api/dashboard", async (route) =>
      json(
        route,
        200,
        buildDashboardResponse({
          totalManualExpenses: 0,
          oilChangeSavings: null,
          netExpenses: null,
          oilChangeIntervalCount: 0,
          allTimeMiles: 0,
          rideCount: 0,
        })
      )
    );
  });

  await recorder.step("load dashboard page", async () => {
    await page.goto("/dashboard");
    await expect(
      page.getByRole("heading", { name: "Your riding story, one screen." })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Miles by Month" })
    ).toBeVisible();
  });

  await recorder.step("verify expense summary shows unavailable oil savings and zero totals", async () => {
    await expect(page.getByText("Total Expenses")).toBeVisible();
    await expect(page.getByText("Oil Change Savings")).toBeVisible();
    await expect(page.getByText("Net Expenses")).toBeVisible();
    await expect(page.getByText("$0.00").first()).toBeVisible();
    await expect(page.getByText("—")).toBeVisible();
    await expect(page.locator(".expense-summary-card-row-net-expense")).toBeVisible();
    await expect(page.locator(".expense-summary-card-row-net-savings")).toHaveCount(0);
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:dashboard_no_expenses_no_oil_price");
  await recorder.save(testInfo);
});
