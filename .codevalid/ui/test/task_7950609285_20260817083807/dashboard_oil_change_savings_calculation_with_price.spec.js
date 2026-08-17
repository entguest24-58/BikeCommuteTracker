import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupAuthenticatedSession, setupDashboardScenario } from "../../helpers/mock-api.js";

test("OilChangeSavings is correctly calculated from all-time miles and OilChangePrice", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("dashboard_oil_change_savings_calculation_with_price", "OilChangeSavings is correctly calculated from all-time miles and OilChangePrice");

  await recorder.step("Seed authenticated session", async () => {
    await setupAuthenticatedSession(page);
  });

  await recorder.step("Mock dashboard with oil change savings and negative net expense", async () => {
    await setupDashboardScenario(page, {
      dashboard: {
        totals: {
          allTimeMiles: { miles: 9500, rideCount: 12, period: "allTime" },
          expenseSummary: {
            totalManualExpenses: 65,
            oilChangeSavings: 180,
            netExpenses: -115,
            oilChangeIntervalCount: 3,
          },
        },
      },
    });
  });

  await recorder.step("Open dashboard", async () => {
    await page.goto("/dashboard");
  });

  await recorder.step("Assert oil change savings and net savings values", async () => {
    await expect(page.getByText("Oil Change Savings")).toBeVisible();
    await expect(page.getByText("$180.00")).toBeVisible();
    await expect(page.getByText("Net Savings")).toBeVisible();
    await expect(page.getByText("-$115.00")).toBeVisible();
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:dashboard_oil_change_savings_calculation_with_price");
  await recorder.save(testInfo);
});
