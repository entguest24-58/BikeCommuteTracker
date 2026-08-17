import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupAuthenticatedSession, setupExpenseApis } from "../../helpers/mock-api.js";
import { expenseWith500CharNote } from "../../mock/mock-data.js";

test("Expense accepts note with exactly 500 characters", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("expense_entry_note_exactly_500_chars", "Expense accepts note with exactly 500 characters");
  const note500 = "a".repeat(500);

  await recorder.step("Seed authenticated session and expense mocks");
  await setupAuthenticatedSession(page);
  await setupExpenseApis(page, {
    initialExpenses: [],
    createdExpenses: [expenseWith500CharNote],
  });

  await recorder.step("Open expense entry page and submit with exactly 500 characters in note");
  await page.goto("/expenses/entry");
  await page.locator('[name="expenseDate"]').fill("2024-06-15");
  await page.locator('[name="amount"]').fill("12.00");
  await page.locator('[name="note"]').fill(note500);
  await page.getByRole("button", { name: "Record Expense" }).click();

  await recorder.step("Assert successful save with no note validation error");
  await expect(page.getByText("Expense recorded successfully")).toBeVisible();
  await expect(page.getByText("Note must be 500 characters or fewer")).toHaveCount(0);

  await recorder.step("Open history and verify expense exists");
  await page.goto("/expenses/history");
  await expect(page.getByText("$12.00")).toBeVisible();

  console.log("CODEVALID_TEST_ASSERTION_OK:expense_entry_note_exactly_500_chars");
  await recorder.save(testInfo);
});
