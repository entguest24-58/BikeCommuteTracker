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

test("net expense is visually highlighted in red when negative", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "dashboard_negative_net_expense_highlighted",
    testTitle: testInfo.title,
  });

  await recorder.step("prepare authenticated session and negative net-expense mock", async () => {
    await setupUnauthenticatedSession(page);
    await setupAuthenticatedSession(page);
    await page.route("**/api/dashboard", async (route) =>
      json(
        route,
        200,
        buildDashboardResponse({
          totalManualExpenses: 10,
          oilChangeSavings: 140,
          netExpenses: -130,
          oilChangeIntervalCount: 2,
          allTimeMiles: 6000,
          rideCount: 8,
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

  await recorder.step("verify negative net expense uses savings styling class", async () => {
    const savingsRow = page.locator(".expense-summary-card-row-net-savings");
    await expect(page.getByText("Net Savings")).toBeVisible();
    await expect(savingsRow).toBeVisible();
    await expect(savingsRow).toContainText("-$130.00");
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:dashboard_negative_net_expense_highlighted");
  await recorder.save(testInfo);
});
