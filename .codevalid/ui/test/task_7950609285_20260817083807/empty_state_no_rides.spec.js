import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupAuthenticatedSession, setupDashboardScenario } from "../../helpers/mock-api.js";

test("Dashboard shows descriptive empty state when rider has no recorded rides", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("empty_state_no_rides", "Dashboard shows descriptive empty state when rider has no recorded rides");

  await recorder.step("Seed authenticated session", async () => {
    await setupAuthenticatedSession(page);
  });

  await recorder.step("Mock empty dashboard state", async () => {
    await setupDashboardScenario(page, {
      dashboard: {
        totals: {
          currentMonthMiles: { miles: 0, rideCount: 0, period: "thisMonth" },
          yearToDateMiles: { miles: 0, rideCount: 0, period: "thisYear" },
          allTimeMiles: { miles: 0, rideCount: 0, period: "allTime" },
          moneySaved: {
            mileageRateSavings: null,
            fuelCostAvoided: null,
            qualifiedRideCount: 0,
          },
        },
      },
    });
  });

  await recorder.step("Open dashboard", async () => {
    await page.goto("/dashboard");
  });

  await recorder.step("Assert empty-state card and non-breaking totals", async () => {
    await expect(page.getByRole("heading", { name: "No ride history yet" })).toBeVisible();
    await expect(page.getByText("Record a commute to start building your dashboard totals, averages, and monthly trends.")).toBeVisible();
    await expect(page.getByText("0.0 mi").first()).toBeVisible();
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:empty_state_no_rides");
  await recorder.save(testInfo);
});
