import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupAuthenticatedSession, setupExpenseApis } from "../../helpers/mock-api.js";
import { expenseWithReceipt } from "../../mock/mock-data.js";

test("Valid expense with date, amount, note, and valid receipt", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("expense_entry_valid_input_with_receipt", "Valid expense with date, amount, note, and valid receipt");

  await recorder.step("Seed authenticated session and expense mocks");
  await setupAuthenticatedSession(page);
  await setupExpenseApis(page, {
    initialExpenses: [],
    createdExpenses: [expenseWithReceipt],
  });

  await recorder.step("Open expense entry page and fill valid values including receipt");
  await page.goto("/expenses/entry");
  await page.locator('[name="expenseDate"]').fill("2024-06-15");
  await page.locator('[name="amount"]').fill("45.99");
  await page.locator('[name="note"]').fill("New brake pads");
  await page.locator('[name="receipt"]').setInputFiles({
    name: "receipt.jpg",
    mimeType: "image/jpeg",
    buffer: Buffer.alloc(2 * 1024 * 1024, 1),
  });
  await page.getByRole("button", { name: "Record Expense" }).click();

  await recorder.step("Assert success and no receipt validation error");
  await expect(page.getByText("Expense recorded successfully")).toBeVisible();
  await expect(page.getByText("Receipt must be JPEG, PNG, WEBP, or PDF and cannot exceed 5 MB.")).toHaveCount(0);

  await recorder.step("Open history and verify receipt indicator links are shown");
  await page.goto("/expenses/history");
  await expect(page.getByText("$45.99")).toBeVisible();
  await expect(page.getByText("New brake pads")).toBeVisible();
  await expect(page.getByRole("link", { name: "View receipt" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Download receipt" })).toBeVisible();

  console.log("CODEVALID_TEST_ASSERTION_OK:expense_entry_valid_input_with_receipt");
  await recorder.save(testInfo);
});
