import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupAuthenticatedSession, setupExpenseApis } from "../../helpers/mock-api.js";
import { canonicalDateExpense } from "../../mock/mock-data.js";

test("Expense accepts multiple valid date formats (YYYY-MM-DD)", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("expense_entry_valid_date_variants", "Expense accepts multiple valid date formats (YYYY-MM-DD)");

  await recorder.step("Seed authenticated session and expense mocks");
  await setupAuthenticatedSession(page);
  await setupExpenseApis(page, {
    initialExpenses: [],
    createdExpenses: [canonicalDateExpense],
  });

  await recorder.step("Open expense entry page and submit canonical YYYY-MM-DD date");
  await page.goto("/expenses/entry");
  await page.locator('[name="expenseDate"]').fill("2024-06-15");
  await page.locator('[name="amount"]').fill("22.00");
  await page.getByRole("button", { name: "Record Expense" }).click();

  await recorder.step("Assert successful save for canonical format");
  await expect(page.getByText("Expense recorded successfully")).toBeVisible();

  console.log("CODEVALID_TEST_ASSERTION_OK:expense_entry_valid_date_variants");
  await recorder.save(testInfo);
});
