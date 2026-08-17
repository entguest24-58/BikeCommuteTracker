import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupAuthenticatedSession, setupDashboardScenario } from "../../helpers/mock-api.js";

test("NetExpense correctly reflects net savings when oil-change savings exceed expenses", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("dashboard_net_expense_may_be_negative", "NetExpense correctly reflects net savings when oil-change savings exceed expenses");

  await recorder.step("Seed authenticated session", async () => {
    await setupAuthenticatedSession(page);
  });

  await recorder.step("Mock negative net expense state", async () => {
    await setupDashboardScenario(page, {
      dashboard: {
        totals: {
          expenseSummary: {
            totalManualExpenses: 40,
            oilChangeSavings: 180,
            netExpenses: -140,
            oilChangeIntervalCount: 3,
          },
        },
      },
    });
  });

  await recorder.step("Load dashboard", async () => {
    await page.goto("/dashboard");
  });

  await recorder.step("Verify net savings presentation", async () => {
    await expect(page.getByText("Net Savings")).toBeVisible();
    await expect(page.getByText("-$140.00")).toBeVisible();
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:dashboard_net_expense_may_be_negative");
  await recorder.save(testInfo);
});
