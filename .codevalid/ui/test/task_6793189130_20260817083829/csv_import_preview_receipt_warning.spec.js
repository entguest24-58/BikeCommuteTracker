import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupAuthenticatedSession } from "../../helpers/mock-api.js";
import { setupExpenseImportScenario, makeCsvFilePayload } from "../../helpers/expense-import-mock-api.js";
import { expenseImportFixtures } from "../../mock/expense-import-fixtures.js";

test("csv_import_preview_receipt_warning", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({ testId: "csv_import_preview_receipt_warning", testTitle: testInfo.title });

  await recorder.step("seed session and valid preview scenario", async () => {
    await setupAuthenticatedSession(page);
    await setupExpenseImportScenario(page, expenseImportFixtures.validFileSuccess);
  });

  await recorder.step("open import page and preview file", async () => {
    await page.goto("/expenses/import");
    await expect(page.getByText("Receipts cannot be imported. To add a receipt, find the expense in your history and use the edit option.")).toBeVisible();
    await page.locator("#expense-import-file").setInputFiles(makeCsvFilePayload("valid-expenses.csv", expenseImportFixtures.validFileSuccess.csv));
    await page.getByRole("button", { name: "Preview Import" }).click();
    await expect(page.getByRole("heading", { name: "Preview" })).toBeVisible();
    await expect(page.getByText("Receipts cannot be imported. To add a receipt, find the expense in your history and use the edit option.")).toBeVisible();
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:csv_import_preview_receipt_warning");
  await recorder.save(testInfo);
});
