import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupAuthenticatedSession, setupExpenseApis } from "../../helpers/mock-api.js";
import { invalidReceiptFormatSavedExpense } from "../../mock/mock-data.js";

test("Expense rejects invalid receipt file format (e.g., TXT)", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("expense_entry_invalid_receipt_format", "Expense rejects invalid receipt file format (e.g., TXT)");

  await recorder.step("Seed authenticated session and expense mocks");
  await setupAuthenticatedSession(page);
  await setupExpenseApis(page, {
    initialExpenses: [],
    createdExpenses: [invalidReceiptFormatSavedExpense],
  });

  await recorder.step("Open expense entry page and upload invalid TXT file");
  await page.goto("/expenses/entry");
  await page.locator('[name="expenseDate"]').fill("2024-06-15");
  await page.locator('[name="amount"]').fill("20.00");
  await page.locator('[name="receipt"]').setInputFiles({
    name: "receipt.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("receipt text"),
  });

  await recorder.step("Assert client-side receipt validation message and submit anyway without attached receipt");
  await expect(page.getByText("Receipt must be JPEG, PNG, WEBP, or PDF and cannot exceed 5 MB.")).toBeVisible();
  await page.getByRole("button", { name: "Record Expense" }).click();
  await expect(page.getByText("Expense recorded successfully")).toBeVisible();

  await recorder.step("Open history and verify saved expense has no receipt indicator");
  await page.goto("/expenses/history");
  await expect(page.getByText("$20.00")).toBeVisible();
  await expect(page.getByText("No")).toBeVisible();

  console.log("CODEVALID_TEST_ASSERTION_OK:expense_entry_invalid_receipt_format");
  await recorder.save(testInfo);
});
