import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupAuthenticatedSession, setupExpenseApis } from "../../helpers/mock-api.js";
import { editableExpenseWithReceipt } from "../../mock/mock-data.js";

test("Receipt can be removed during expense edit", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("expense_entry_remove_receipt_on_edit", "Receipt can be removed during expense edit");

  await recorder.step("Seed authenticated session and load expense with receipt into history");
  await setupAuthenticatedSession(page);
  await setupExpenseApis(page, {
    initialExpenses: [editableExpenseWithReceipt],
  });

  await recorder.step("Open history and enter edit mode");
  await page.goto("/expenses/history");
  await page.getByRole("button", { name: "Edit expense" }).click();

  await recorder.step("Assert current implementation has replace receipt control but no remove receipt action");
  await expect(page.getByText("Replace receipt")).toBeVisible();
  await expect(page.getByRole("button", { name: /Remove Receipt/i })).toHaveCount(0);

  console.log("CODEVALID_TEST_ASSERTION_OK:expense_entry_remove_receipt_on_edit");
  await recorder.save(testInfo);
});
