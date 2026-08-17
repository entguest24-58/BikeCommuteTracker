import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupAuthenticatedSession, setupExpenseApis } from "../../helpers/mock-api.js";
import { receiptAtLimitExpense } from "../../mock/mock-data.js";

test("Expense accepts receipt exactly at 5MB limit", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("expense_entry_receipt_5MB_exact", "Expense accepts receipt exactly at 5MB limit");

  await recorder.step("Seed authenticated session and expense mocks");
  await setupAuthenticatedSession(page);
  await setupExpenseApis(page, {
    initialExpenses: [],
    createdExpenses: [receiptAtLimitExpense],
  });

  await recorder.step("Open expense entry page and upload exact-limit PDF");
  await page.goto("/expenses/entry");
  await page.locator('[name="expenseDate"]').fill("2024-06-15");
  await page.locator('[name="amount"]').fill("40.00");
  await page.locator('[name="receipt"]').setInputFiles({
    name: "receipt.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.alloc(5 * 1024 * 1024, 9),
  });
  await page.getByRole("button", { name: "Record Expense" }).click();

  await recorder.step("Assert successful save and receipt indicator in history");
  await expect(page.getByText("Expense recorded successfully")).toBeVisible();
  await page.goto("/expenses/history");
  await expect(page.getByText("$40.00")).toBeVisible();
  await expect(page.getByRole("link", { name: "View receipt" })).toBeVisible();

  console.log("CODEVALID_TEST_ASSERTION_OK:expense_entry_receipt_5MB_exact");
  await recorder.save(testInfo);
});
