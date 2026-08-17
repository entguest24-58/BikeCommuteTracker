import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupAuthenticatedSession } from "../../helpers/mock-api.js";
import { setupExpenseImportScenario, makeCsvFilePayload } from "../../helpers/expense-import-mock-api.js";
import { expenseImportFixtures } from "../../mock/expense-import-fixtures.js";

test("csv_import_duplicate_replace_with_note", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({ testId: "csv_import_duplicate_replace_with_note", testTitle: testInfo.title });

  await recorder.step("seed session and replace scenario", async () => {
    await setupAuthenticatedSession(page);
    await setupExpenseImportScenario(page, expenseImportFixtures.duplicateReplaceWithNote);
  });

  await recorder.step("preview duplicate row", async () => {
    await page.goto("/expenses/import");
    await page.locator("#expense-import-file").setInputFiles(makeCsvFilePayload("replace-note.csv", expenseImportFixtures.duplicateReplaceWithNote.csv));
    await page.getByRole("button", { name: "Preview Import" }).click();
    await expect(page.getByText("Duplicate rows: 1")).toBeVisible();
  });

  await recorder.step("choose replace and confirm", async () => {
    await page.getByLabel("Replace with Import").check();
    await page.getByRole("button", { name: "Confirm Import" }).click();
    await expect(page.getByRole("heading", { name: "Import complete" })).toBeVisible();
  });

  await recorder.step("open history and verify updated note", async () => {
    await page.getByRole("link", { name: "Back to Expense History" }).click();
    await expect(page).toHaveURL(/\/expenses\/history$/);
    await expect(page.getByText("New note")).toBeVisible();
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:csv_import_duplicate_replace_with_note");
  await recorder.save(testInfo);
});
