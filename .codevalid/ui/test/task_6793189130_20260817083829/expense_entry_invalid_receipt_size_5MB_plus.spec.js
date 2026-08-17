import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupAuthenticatedSession, setupExpenseApis } from "../../helpers/mock-api.js";
import { oversizedReceiptSavedExpense } from "../../mock/mock-data.js";

test("Expense rejects receipt larger than 5MB", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("expense_entry_invalid_receipt_size_5MB_plus", "Expense rejects receipt larger than 5MB");

  await recorder.step("Seed authenticated session and expense mocks");
  await setupAuthenticatedSession(page);
  await setupExpenseApis(page, {
    initialExpenses: [],
    createdExpenses: [oversizedReceiptSavedExpense],
  });

  await recorder.step("Open expense entry page and upload oversized PDF file");
  await page.goto("/expenses/entry");
  await page.locator('[name="expenseDate"]').fill("2024-06-15");
  await page.locator('[name="amount"]').fill("25.00");
  await page.locator('[name="receipt"]').setInputFiles({
    name: "receipt.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.alloc(5 * 1024 * 1024 + 1024, 7),
  });

  await recorder.step("Assert current UI shows combined receipt validation message and still allows saving without attachment");
  await expect(page.getByText("Receipt must be JPEG, PNG, WEBP, or PDF and cannot exceed 5 MB.")).toBeVisible();
  await page.getByRole("button", { name: "Record Expense" }).click();
  await expect(page.getByText("Expense recorded successfully")).toBeVisible();

  await recorder.step("Open history and verify no receipt indicator");
  await page.goto("/expenses/history");
  await expect(page.getByText("$25.00")).toBeVisible();
  await expect(page.getByText("No")).toBeVisible();

  console.log("CODEVALID_TEST_ASSERTION_OK:expense_entry_invalid_receipt_size_5MB_plus");
  await recorder.save(testInfo);
});
