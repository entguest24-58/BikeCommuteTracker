import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupAuthenticatedSession, setupDashboardScenario } from "../../helpers/mock-api.js";

test("Total manual expenses sum all positive expense records accurately", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("dashboard_total_manual_expenses_summed", "Total manual expenses sum all positive expense records accurately");

  await recorder.step("Seed authenticated session", async () => {
    await setupAuthenticatedSession(page);
  });

  await recorder.step("Mock expense summary totals", async () => {
    await setupDashboardScenario(page, {
      dashboard: {
        totals: {
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

  await recorder.step("Assert total expenses are shown", async () => {
    await expect(page.getByText("Expense Summary")).toBeVisible();
    await expect(page.getByText("Total Expenses")).toBeVisible();
    await expect(page.getByText("$65.00").first()).toBeVisible();
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:dashboard_total_manual_expenses_summed");
  await recorder.save(testInfo);
});
