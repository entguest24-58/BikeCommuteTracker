import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import {
  setupAuthenticatedSession,
  mockExpenseHistoryScenario,
} from "../../helpers/mock-api.js";
import { expenseWithReceipt } from "../../mock/mock-data.js";

test("ExpenseHistoryPage does not display net savings or oil-change values", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "expense_history_does_not_show_net_savings",
    testTitle: testInfo.title,
  });

  await recorder.step("Set up authenticated rider with expenses", async () => {
    await setupAuthenticatedSession(page);
    await mockExpenseHistoryScenario(page, {
      expenses: [expenseWithReceipt],
    });
  });

  await recorder.step("Load ExpenseHistoryPage", async () => {
    await page.goto('/expenses/history');
  });

  await recorder.step("Assert expense-only UI and absence of dashboard savings copy", async () => {
    await expect(page.getByRole('heading', { name: 'Expense History' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Import Expenses' })).toBeVisible();
    await expect(page.getByText('Net Expense')).toHaveCount(0);
    await expect(page.getByText('Oil Change Savings')).toHaveCount(0);
    await expect(page.getByText('Net Savings')).toHaveCount(0);
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:expense_history_does_not_show_net_savings");
  await recorder.save(testInfo);
});
