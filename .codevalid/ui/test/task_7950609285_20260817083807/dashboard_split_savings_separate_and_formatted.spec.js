import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupAuthenticatedSession, setupDashboardScenario } from "../../helpers/mock-api.js";

test("Split savings metrics are displayed separately with correct formatting and units", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("dashboard_split_savings_separate_and_formatted", "Split savings metrics are displayed separately with correct formatting and units");

  await recorder.step("Seed authenticated session", async () => {
    await setupAuthenticatedSession(page);
  });

  await recorder.step("Mock dashboard split savings totals", async () => {
    await setupDashboardScenario(page, {
      dashboard: {
        totals: {
          allTimeMiles: { miles: 60, rideCount: 3, period: "allTime" },
          moneySaved: {
            mileageRateSavings: 39,
            fuelCostAvoided: 8.75,
            qualifiedRideCount: 3,
          },
        },
      },
    });
  });

  await recorder.step("Open dashboard", async () => {
    await page.goto("/dashboard");
  });

  await recorder.step("Verify split savings labels and formatting", async () => {
    await expect(page.getByText("Money Saved")).toBeVisible();
    await expect(page.getByText("Mileage rate savings $39.00")).toBeVisible();
    await expect(page.getByText("Gallons-based savings $8.75")).toBeVisible();
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:dashboard_split_savings_separate_and_formatted");
  await recorder.save(testInfo);
});
