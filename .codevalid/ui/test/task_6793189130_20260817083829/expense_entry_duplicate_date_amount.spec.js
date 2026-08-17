import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupAuthenticatedSession, setupExpenseApis } from "../../helpers/mock-api.js";
import { existingDuplicateExpense, newlyCreatedDuplicateExpense } from "../../mock/mock-data.js";

test("Duplicate date+amount entries allowed (not restricted)", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("expense_entry_duplicate_date_amount", "Duplicate date+amount entries allowed (not restricted)");

  await recorder.step("Seed authenticated session and expense mocks with an existing matching expense");
  await setupAuthenticatedSession(page);
  await setupExpenseApis(page, {
    initialExpenses: [existingDuplicateExpense],
    createdExpenses: [newlyCreatedDuplicateExpense],
  });

  await recorder.step("Create another expense with the same date and amount");
  await page.goto("/expenses/entry");
  await page.locator('[name="expenseDate"]').fill("2024-06-15");
  await page.locator('[name="amount"]').fill("25.00");
  await page.getByRole("button", { name: "Record Expense" }).click();
  await expect(page.getByText("Expense recorded successfully")).toBeVisible();

  await recorder.step("Open history and verify duplicate rows are both present");
  await page.goto("/expenses/history");
  await expect(page.getByText("$25.00")).toHaveCount(2);

  console.log("CODEVALID_TEST_ASSERTION_OK:expense_entry_duplicate_date_amount");
  await recorder.save(testInfo);
});
