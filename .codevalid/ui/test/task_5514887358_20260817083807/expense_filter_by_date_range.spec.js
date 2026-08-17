import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import {
  setupAuthenticatedSession,
  mockExpenseHistoryScenario,
} from "../../helpers/mock-api.js";
import {
  aprilTenthExpense,
  mayFifteenthExpense,
  juneFirstExpense,
} from "../../mock/mock-data.js";

test("Expense list filters correctly by date range", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "expense_filter_by_date_range",
    testTitle: testInfo.title,
  });

  await recorder.step("Set up authenticated rider with filterable expense history", async () => {
    await setupAuthenticatedSession(page);
    await mockExpenseHistoryScenario(page, {
      expenses: [aprilTenthExpense, mayFifteenthExpense, juneFirstExpense],
    });
  });

  await recorder.step("Load the ExpenseHistoryPage", async () => {
    await page.goto("/expenses/history");
  });

  await recorder.step("Apply date range filter", async () => {
    await page.locator('#expense-filter-from').fill('2024-05-01');
    await page.locator('#expense-filter-to').fill('2024-06-10');
    await page.getByRole('button', { name: 'Apply Filter' }).click();
  });

  await recorder.step("Assert filtered rows and total", async () => {
    const rows = page.locator('tbody tr');
    await expect(rows).toHaveCount(2);
    await expect(page.getByText('2024-05-15')).toBeVisible();
    await expect(page.getByText('2024-06-01')).toBeVisible();
    await expect(page.getByText('2024-04-10')).toHaveCount(0);
    await expect(page.getByText('Filtered total: $35.00')).toBeVisible();
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:expense_filter_by_date_range");
  await recorder.save(testInfo);
});
