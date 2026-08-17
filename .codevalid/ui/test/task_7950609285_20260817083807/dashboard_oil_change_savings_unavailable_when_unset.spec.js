import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupAuthenticatedSession, setupDashboardScenario } from "../../helpers/mock-api.js";

test("OilChangeSavings is marked unavailable when OilChangePrice is not set by rider", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("dashboard_oil_change_savings_unavailable_when_unset", "OilChangeSavings is marked unavailable when OilChangePrice is not set by rider");

  await recorder.step("Seed authenticated session", async () => {
    await setupAuthenticatedSession(page);
  });

  await recorder.step("Mock dashboard with null oil change savings", async () => {
    await setupDashboardScenario(page, {
      dashboard: {
        totals: {
          allTimeMiles: { miles: 9000, rideCount: 10, period: "allTime" },
          expenseSummary: {
            totalManualExpenses: 65,
            oilChangeSavings: null,
            netExpenses: 65,
            oilChangeIntervalCount: 0,
          },
        },
      },
    });
  });

  await recorder.step("Open dashboard", async () => {
    await page.goto("/dashboard");
  });

  await recorder.step("Assert oil change savings show unavailable state used by UI", async () => {
    await expect(page.getByText("Oil Change Savings")).toBeVisible();
    await expect(page.getByText("—").first()).toBeVisible();
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:dashboard_oil_change_savings_unavailable_when_unset");
  await recorder.save(testInfo);
});
