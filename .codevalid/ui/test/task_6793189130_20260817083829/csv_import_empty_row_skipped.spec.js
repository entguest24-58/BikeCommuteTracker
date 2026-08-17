import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupAuthenticatedSession } from "../../helpers/mock-api.js";
import { setupExpenseImportScenario, makeCsvFilePayload } from "../../helpers/expense-import-mock-api.js";
import { expenseImportFixtures } from "../../mock/expense-import-fixtures.js";

test("csv_import_empty_row_skipped", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({ testId: "csv_import_empty_row_skipped", testTitle: testInfo.title });

  await recorder.step("seed session and mocks", async () => {
    await setupAuthenticatedSession(page);
    await setupExpenseImportScenario(page, expenseImportFixtures.emptyRowsSkipped);
  });

  await recorder.step("upload csv with blank lines", async () => {
    await page.goto("/expenses/import");
    await page.locator("#expense-import-file").setInputFiles(makeCsvFilePayload("blank-lines.csv", expenseImportFixtures.emptyRowsSkipped.csv));
    await page.getByRole("button", { name: "Preview Import" }).click();
  });

  await recorder.step("verify blank rows skipped", async () => {
    await expect(page.getByText("Total rows: 3")).toBeVisible();
    await expect(page.getByText("Valid rows: 3")).toBeVisible();
    await expect(page.getByText("Invalid rows: 0")).toBeVisible();
    await expect(page.getByText("Duplicate rows: 0")).toBeVisible();
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:csv_import_empty_row_skipped");
  await recorder.save(testInfo);
});
