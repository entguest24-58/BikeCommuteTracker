import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupAuthenticatedSession } from "../../helpers/mock-api.js";
import { setupExpenseImportScenario, makeCsvFilePayload } from "../../helpers/expense-import-mock-api.js";
import { expenseImportFixtures } from "../../mock/expense-import-fixtures.js";

test("csv_import_missing_required_column_amount", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({ testId: "csv_import_missing_required_column_amount", testTitle: testInfo.title });

  await recorder.step("seed session and preview mock", async () => {
    await setupAuthenticatedSession(page);
    await setupExpenseImportScenario(page, expenseImportFixtures.missingAmountColumn);
  });

  await recorder.step("open import page and upload file", async () => {
    await page.goto("/expenses/import");
    await page.locator("#expense-import-file").setInputFiles(makeCsvFilePayload("missing-amount.csv", expenseImportFixtures.missingAmountColumn.csv));
    await page.getByRole("button", { name: "Preview Import" }).click();
  });

  await recorder.step("verify missing amount column error", async () => {
    await expect(page.getByRole("heading", { name: "Preview" })).toBeVisible();
    await expect(page.getByText("Valid rows: 0")).toBeVisible();
    await expect(page.getByText("Invalid rows: 1")).toBeVisible();
    await expect(page.getByText(/Required column missing: Amount\./)).toBeVisible();
    await expect(page.getByRole("button", { name: "Confirm Import" })).toBeDisabled();
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:csv_import_missing_required_column_amount");
  await recorder.save(testInfo);
});
