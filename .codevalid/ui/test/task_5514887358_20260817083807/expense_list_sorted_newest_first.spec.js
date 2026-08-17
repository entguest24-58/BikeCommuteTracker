import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import {
  setupAuthenticatedSession,
  mockExpenseHistoryScenario,
} from "../../helpers/mock-api.js";
import {
  expenseNewestMayFifteenth,
  expenseMayFirst,
  expenseAprilTwentieth,
} from "../../mock/mock-data.js";

test("Expense list is sorted by newest date first", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "expense_list_sorted_newest_first",
    testTitle: testInfo.title,
  });

  await recorder.step("Set up authenticated rider with sorted history response", async () => {
    await setupAuthenticatedSession(page);
    await mockExpenseHistoryScenario(page, {
      expenses: [expenseNewestMayFifteenth, expenseMayFirst, expenseAprilTwentieth],
    });
  });

  await recorder.step("Load the ExpenseHistoryPage", async () => {
    await page.goto("/expenses/history");
  });

  await recorder.step("Assert visible row order by date", async () => {
    const rows = page.locator("tbody tr");
    await expect(rows).toHaveCount(3);
    await expect(rows.nth(0)).toContainText("2024-05-15");
    await expect(rows.nth(1)).toContainText("2024-05-01");
    await expect(rows.nth(2)).toContainText("2024-04-20");
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:expense_list_sorted_newest_first");
  await recorder.save(testInfo);
});
