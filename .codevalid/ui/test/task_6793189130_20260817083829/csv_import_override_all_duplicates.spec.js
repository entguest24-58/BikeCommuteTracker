import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupAuthenticatedSession } from "../../helpers/mock-api.js";
import { setupExpenseImportScenario, makeCsvFilePayload } from "../../helpers/expense-import-mock-api.js";
import { expenseImportFixtures } from "../../mock/expense-import-fixtures.js";

test("csv_import_override_all_duplicates", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({ testId: "csv_import_override_all_duplicates", testTitle: testInfo.title });

  await recorder.step("seed session and override scenario", async () => {
    await setupAuthenticatedSession(page);
    await setupExpenseImportScenario(page, expenseImportFixtures.overrideAllDuplicates);
  });

  await recorder.step("preview duplicate row", async () => {
    await page.goto("/expenses/import");
    await page.locator("#expense-import-file").setInputFiles(makeCsvFilePayload("override-all.csv", expenseImportFixtures.overrideAllDuplicates.csv));
    await page.getByRole("button", { name: "Preview Import" }).click();
  });

  await recorder.step("enable override all and confirm", async () => {
    await page.getByLabel("Override All Duplicates").check();
    await page.getByRole("button", { name: "Confirm Import" }).click();
    await expect(page.getByText("Imported rows: 1")).toBeVisible();
    await expect(page.getByText("Skipped rows: 0")).toBeVisible();
  });

  await recorder.step("history shows duplicate pair", async () => {
    await page.getByRole("link", { name: "Back to Expense History" }).click();
    await expect(page.locator('tbody tr')).toHaveCount(2);
    await expect(page.getByText("$45.00")).toHaveCount(2);
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:csv_import_override_all_duplicates");
  await recorder.save(testInfo);
});
