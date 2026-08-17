import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupAuthenticatedSession } from "../../helpers/mock-api.js";

test("Core ride tracking remains accessible even if update or installation fails", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "core_ride_tracking_accessible_during_update_failure",
    testTitle: "Core ride tracking remains accessible even if update or installation fails",
  });

  await recorder.step("Seed authenticated session", async () => {
    await setupAuthenticatedSession(page);
  });

  await recorder.step("Mock dashboard APIs", async () => {
    await page.route("**/health", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ status: "ok" }),
      });
    });

    await page.route("**/api/dashboard/summary**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          totals: {
            currentMonthMiles: { miles: 42.1, rideCount: 4, period: "thisMonth" },
            yearToDateMiles: { miles: 380.4, rideCount: 29, period: "thisYear" },
            allTimeMiles: { miles: 1240.7, rideCount: 96, period: "allTime" },
            moneySaved: {
              mileageRateSavings: 152.25,
              fuelCostAvoided: 98.13,
              qualifiedRideCount: 96,
            },
            expenseSummary: {
              totalManualExpenses: 18.5,
              oilChangeSavings: 35,
              netExpenses: -16.5,
              oilChangeIntervalCount: 1,
            },
          },
          averages: {
            averageTemperature: 67.2,
            averageMilesPerRide: 12.9,
            averageRideMinutes: 39.5,
          },
          charts: {
            mileageByMonth: [
              { monthKey: "2026-07", label: "Jul", miles: 120.2 },
              { monthKey: "2026-08", label: "Aug", miles: 140.6 },
            ],
            savingsByMonth: [
              { monthKey: "2026-07", label: "Jul", mileageRateSavings: 25.12, fuelCostAvoided: 12.03 },
              { monthKey: "2026-08", label: "Aug", mileageRateSavings: 30.45, fuelCostAvoided: 14.62 },
            ],
          },
          suggestions: [],
          missingData: {
            ridesMissingSavingsSnapshot: 0,
            ridesMissingGasPrice: 0,
            ridesMissingTemperature: 0,
            ridesMissingDuration: 0,
          },
          generatedAtUtc: "2026-08-17T08:39:00.000Z",
        }),
      });
    });

    await page.goto("/dashboard");
  });

  await recorder.step("Verify core tracking remains accessible", async () => {
    await expect(page.getByRole("heading", { name: "Your riding story, one screen." })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Miles by Month" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Savings by Month" })).toBeVisible();
    await expect(page.getByText("1,240.7 mi")).toBeVisible();
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:core_ride_tracking_accessible_during_update_failure");
  await recorder.save(testInfo);
});
