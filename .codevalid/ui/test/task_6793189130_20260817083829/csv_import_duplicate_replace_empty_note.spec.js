import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupAuthenticatedSession } from "../../helpers/mock-api.js";
import { setupExpenseImportScenario, makeCsvFilePayload } from "../../helpers/expense-import-mock-api.js";
import { expenseImportFixtures } from "../../mock/expense-import-fixtures.js";

test("csv_import_duplicate_replace_empty_note", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({ testId: "csv_import_duplicate_replace_empty_note", testTitle: testInfo.title });

  await recorder.step("seed session and replace blank note scenario", async () => {
    await setupAuthenticatedSession(page);
    await setupExpenseImportScenario(page, expenseImportFixtures.duplicateReplaceEmptyNote);
  });

  await recorder.step("preview duplicate row", async () => {
    await page.goto("/expenses/import");
    await page.locator("#expense-import-file").setInputFiles(makeCsvFilePayload("replace-empty-note.csv", expenseImportFixtures.duplicateReplaceEmptyNote.csv));
    await page.getByRole("button", { name: "Preview Import" }).click();
  });

  await recorder.step("replace duplicate and verify original note preserved", async () => {
    await page.getByLabel("Replace with Import").check();
    await page.getByRole("button", { name: "Confirm Import" }).click();
    await page.getByRole("link", { name: "Back to Expense History" }).click();
    await expect(page.getByText("Original note")).toBeVisible();
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:csv_import_duplicate_replace_empty_note");
  await recorder.save(testInfo);
});
