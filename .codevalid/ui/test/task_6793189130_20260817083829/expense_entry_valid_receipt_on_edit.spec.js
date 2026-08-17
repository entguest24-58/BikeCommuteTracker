import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupAuthenticatedSession, setupExpenseApis } from "../../helpers/mock-api.js";
import { editableExpenseWithoutReceipt, editedExpenseWithReceipt } from "../../mock/mock-data.js";

test("Receipt can be added to existing expense during edit", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("expense_entry_valid_receipt_on_edit", "Receipt can be added to existing expense during edit");

  await recorder.step("Seed authenticated session and expense history/edit mocks");
  await setupAuthenticatedSession(page);
  await setupExpenseApis(page, {
    initialExpenses: [editableExpenseWithoutReceipt],
    uploadedReceiptExpenseId: editableExpenseWithoutReceipt.expenseId,
    editedExpenses: [editedExpenseWithReceipt],
  });

  await recorder.step("Open expense history and start editing the existing expense");
  await page.goto("/expenses/history");
  await expect(page.getByRole("heading", { name: "Expense History" })).toBeVisible();
  await page.getByRole("button", { name: "Edit expense" }).click();

  await recorder.step("Upload valid PNG receipt and save the edit");
  await page.getByLabel("Replace receipt").setInputFiles({
    name: "receipt.png",
    mimeType: "image/png",
    buffer: Buffer.alloc(1024 * 1024, 3),
  });
  await page.getByRole("button", { name: "Save" }).click();

  await recorder.step("Assert update success and receipt indicator after save");
  await expect(page.getByText("Expense updated")).toBeVisible();
  await expect(page.getByRole("link", { name: "View receipt" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Download receipt" })).toBeVisible();

  console.log("CODEVALID_TEST_ASSERTION_OK:expense_entry_valid_receipt_on_edit");
  await recorder.save(testInfo);
});
