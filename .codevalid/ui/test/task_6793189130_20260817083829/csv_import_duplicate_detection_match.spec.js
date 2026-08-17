import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupAuthenticatedSession } from "../../helpers/mock-api.js";
import { setupExpenseImportScenario, makeCsvFilePayload } from "../../helpers/expense-import-mock-api.js";
import { expenseImportFixtures } from "../../mock/expense-import-fixtures.js";

test("csv_import_duplicate_detection_match", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({ testId: "csv_import_duplicate_detection_match", testTitle: testInfo.title });

  await recorder.step("seed session and duplicate preview mocks", async () => {
    await setupAuthenticatedSession(page);
    await setupExpenseImportScenario(page, expenseImportFixtures.duplicateDetected);
  });

  await recorder.step("upload duplicate csv row", async () => {
    await page.goto("/expenses/import");
    await page.locator("#expense-import-file").setInputFiles(makeCsvFilePayload("duplicate.csv", expenseImportFixtures.duplicateDetected.csv));
    await page.getByRole("button", { name: "Preview Import" }).click();
  });

  await recorder.step("verify duplicate controls shown", async () => {
    await expect(page.getByText("Duplicate rows: 1")).toBeVisible();
    await expect(page.getByText(/Row 1: 2024-05-10/)).toBeVisible();
    await expect(page.getByLabel("Keep Existing")).toBeVisible();
    await expect(page.getByLabel("Replace with Import")).toBeVisible();
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:csv_import_duplicate_detection_match");
  await recorder.save(testInfo);
});
