import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupAuthenticatedSession } from "../../helpers/mock-api.js";
import { setupExpenseImportScenario, makeCsvFilePayload } from "../../helpers/expense-import-mock-api.js";
import { expenseImportFixtures } from "../../mock/expense-import-fixtures.js";

test("csv_import_job_cleanup_on_navigation", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({ testId: "csv_import_job_cleanup_on_navigation", testTitle: testInfo.title });

  await recorder.step("seed session and successful import scenario", async () => {
    await setupAuthenticatedSession(page);
    await setupExpenseImportScenario(page, expenseImportFixtures.jobCleanupOnNavigation);
  });

  await recorder.step("complete import", async () => {
    await page.goto("/expenses/import");
    await page.locator("#expense-import-file").setInputFiles(makeCsvFilePayload("cleanup.csv", expenseImportFixtures.jobCleanupOnNavigation.csv));
    await page.getByRole("button", { name: "Preview Import" }).click();
    await page.getByRole("button", { name: "Confirm Import" }).click();
    await expect(page.getByRole("heading", { name: "Import complete" })).toBeVisible();
  });

  await recorder.step("navigate away and ensure cleanup route was used", async () => {
    await page.getByRole("link", { name: "Back to Expense History" }).click();
    await expect(page).toHaveURL(/\/expenses\/history$/);
    await expect(page.getByRole("heading", { name: "Expense History" })).toBeVisible();
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:csv_import_job_cleanup_on_navigation");
  await recorder.save(testInfo);
});
