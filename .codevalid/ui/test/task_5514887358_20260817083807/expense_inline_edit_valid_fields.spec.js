import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import {
  setupAuthenticatedSession,
  mockExpenseHistoryScenario,
} from "../../helpers/mock-api.js";
import { editableExpense } from "../../mock/mock-data.js";

test("Inline editing allows valid updates to date, amount, and note", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "expense_inline_edit_valid_fields",
    testTitle: testInfo.title,
  });

  await recorder.step("Set up authenticated rider with one editable expense", async () => {
    await setupAuthenticatedSession(page);
    await mockExpenseHistoryScenario(page, {
      expenses: [editableExpense],
    });
  });

  await recorder.step("Load ExpenseHistoryPage", async () => {
    await page.goto("/expenses/history");
  });

  await recorder.step("Enter edit mode and change values", async () => {
    await page.getByRole('button', { name: 'Edit expense' }).click();
    await page.getByLabel('Edit date').fill('2024-06-20');
    await page.getByLabel('Edit amount').fill('32.50');
    await page.getByLabel('Edit notes').fill('New, more expensive chain');
  });

  await recorder.step("Save edit and assert updated row", async () => {
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByText('Expense updated')).toBeVisible();
    await expect(page.getByText('2024-06-20')).toBeVisible();
    await expect(page.getByText('$32.50')).toBeVisible();
    await expect(page.getByText('New, more expensive chain')).toBeVisible();
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:expense_inline_edit_valid_fields");
  await recorder.save(testInfo);
});
