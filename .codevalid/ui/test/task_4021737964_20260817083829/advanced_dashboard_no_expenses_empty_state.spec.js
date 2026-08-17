import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import {
  setupAuthenticatedSession,
  setupAdvancedDashboardScenario,
} from "../../helpers/mock-api.js";
import { advancedDashboardNoExpensesScenario } from "../../mock/mock-data.js";

test("No expenses? Net savings shows savings-only without expense subtraction", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("advanced_dashboard_no_expenses_empty_state", "No expenses? Net savings shows savings-only without expense subtraction");

  await recorder.step("Seed authenticated session");
  await setupAuthenticatedSession(page);

  await recorder.step("Mock advanced dashboard response with zero expenses and positive savings");
  await setupAdvancedDashboardScenario(page, {
    advanced: advancedDashboardNoExpensesScenario,
  });

  await recorder.step("Navigate to advanced dashboard");
  await page.goto("/dashboard/advanced");

  await recorder.step("Verify expenses and net savings values for monthly row");
  await expect(page.getByText("$0.00")).toBeVisible();
  await expect(page.getByText("$55.00")).toBeVisible();

  console.log("CODEVALID_TEST_ASSERTION_OK:advanced_dashboard_no_expenses_empty_state");
  await recorder.save(testInfo);
});
