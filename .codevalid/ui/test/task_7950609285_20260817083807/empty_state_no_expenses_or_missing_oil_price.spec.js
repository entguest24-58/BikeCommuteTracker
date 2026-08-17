import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupAuthenticatedSession, setupDashboardScenario } from "../../helpers/mock-api.js";

test("Dashboard handles no expenses and missing oil-change price gracefully", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("empty_state_no_expenses_or_missing_oil_price", "Dashboard handles no expenses and missing oil-change price gracefully");

  await recorder.step("Seed authenticated session", async () => {
    await setupAuthenticatedSession(page);
  });

  await recorder.step("Mock dashboard with zero expenses and null oil price output", async () => {
    await setupDashboardScenario(page, {
      dashboard: {
        totals: {
          expenseSummary: {
            totalManualExpenses: 0,
            oilChangeSavings: null,
            netExpenses: 0,
            oilChangeIntervalCount: 0,
          },
        },
      },
    });
  });

  await recorder.step("Open dashboard", async () => {
    await page.goto("/dashboard");
  });

  await recorder.step("Assert expense card remains visible", async () => {
    await expect(page.getByText("Total Expenses")).toBeVisible();
    await expect(page.getByText("$0.00").first()).toBeVisible();
    await expect(page.getByText("Oil Change Savings")).toBeVisible();
    await expect(page.getByText("—").first()).toBeVisible();
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:empty_state_no_expenses_or_missing_oil_price");
  await recorder.save(testInfo);
});
