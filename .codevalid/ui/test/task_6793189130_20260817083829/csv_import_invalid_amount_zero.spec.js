import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupAuthenticatedSession } from "../../helpers/mock-api.js";
import { setupExpenseImportScenario, makeCsvFilePayload } from "../../helpers/expense-import-mock-api.js";
import { expenseImportFixtures } from "../../mock/expense-import-fixtures.js";

test("csv_import_invalid_amount_zero", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({ testId: "csv_import_invalid_amount_zero", testTitle: testInfo.title });

  await recorder.step("seed session and route mocks", async () => {
    await setupAuthenticatedSession(page);
    await setupExpenseImportScenario(page, expenseImportFixtures.invalidZeroAmount);
  });

  await recorder.step("upload csv and preview", async () => {
    await page.goto("/expenses/import");
    await page.locator("#expense-import-file").setInputFiles(makeCsvFilePayload("zero.csv", expenseImportFixtures.invalidZeroAmount.csv));
    await page.getByRole("button", { name: "Preview Import" }).click();
  });

  await recorder.step("assert zero amount validation", async () => {
    await expect(page.getByText("Total rows: 1")).toBeVisible();
    await expect(page.getByText("Valid rows: 0")).toBeVisible();
    await expect(page.getByText("Invalid rows: 1")).toBeVisible();
    await expect(page.getByText(/Amount must be greater than zero\./)).toBeVisible();
    await expect(page.getByRole("button", { name: "Confirm Import" })).toBeDisabled();
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:csv_import_invalid_amount_zero");
  await recorder.save(testInfo);
});
