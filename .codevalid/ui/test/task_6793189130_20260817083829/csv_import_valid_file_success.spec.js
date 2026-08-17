import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupAuthenticatedSession } from "../../helpers/mock-api.js";
import {
  setupExpenseImportScenario,
  makeCsvFilePayload,
} from "../../helpers/expense-import-mock-api.js";
import { expenseImportFixtures } from "../../mock/expense-import-fixtures.js";

test("csv_import_valid_file_success", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "csv_import_valid_file_success",
    testTitle: testInfo.title,
  });

  await recorder.step("seed authenticated session and import mocks", async () => {
    await setupAuthenticatedSession(page);
    await setupExpenseImportScenario(page, expenseImportFixtures.validFileSuccess);
  });

  await recorder.step("open import page", async () => {
    await page.goto("/expenses/import");
    await expect(page.getByRole("heading", { name: "Import Expenses" })).toBeVisible();
  });

  await recorder.step("upload valid csv and preview", async () => {
    await page.locator("#expense-import-file").setInputFiles(makeCsvFilePayload("valid-expenses.csv", expenseImportFixtures.validFileSuccess.csv));
    await page.getByRole("button", { name: "Preview Import" }).click();
    await expect(page.getByRole("heading", { name: "Preview" })).toBeVisible();
    await expect(page.getByText("Total rows: 3")).toBeVisible();
    await expect(page.getByText("Valid rows: 3")).toBeVisible();
    await expect(page.getByText("Invalid rows: 0")).toBeVisible();
    await expect(page.getByText("Duplicate rows: 0")).toBeVisible();
  });

  await recorder.step("confirm import and verify summary", async () => {
    await page.getByRole("button", { name: "Confirm Import" }).click();
    await expect(page.getByRole("heading", { name: "Import complete" })).toBeVisible();
    await expect(page.getByText("Imported rows: 3")).toBeVisible();
    await expect(page.getByText("Skipped rows: 0")).toBeVisible();
    await expect(page.getByText("Failed rows: 0")).toBeVisible();
  });

  await recorder.step("navigate to expense history and verify imported rows", async () => {
    await page.getByRole("link", { name: "Back to Expense History" }).click();
    await expect(page).toHaveURL(/\/expenses\/history$/);
    await expect(page.getByRole("heading", { name: "Expense History" })).toBeVisible();
    await expect(page.getByText("$12.50")).toBeVisible();
    await expect(page.getByText("$24.99")).toBeVisible();
    await expect(page.getByText("$8.00")).toBeVisible();
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:csv_import_valid_file_success");
  await recorder.save(testInfo);
});
