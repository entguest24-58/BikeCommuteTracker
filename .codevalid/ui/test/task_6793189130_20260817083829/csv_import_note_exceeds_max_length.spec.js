import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupAuthenticatedSession } from "../../helpers/mock-api.js";
import { setupExpenseImportScenario, makeCsvFilePayload } from "../../helpers/expense-import-mock-api.js";
import { expenseImportFixtures } from "../../mock/expense-import-fixtures.js";

test("csv_import_note_exceeds_max_length", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({ testId: "csv_import_note_exceeds_max_length", testTitle: testInfo.title });

  await recorder.step("seed session and mocks", async () => {
    await setupAuthenticatedSession(page);
    await setupExpenseImportScenario(page, expenseImportFixtures.noteTooLong);
  });

  await recorder.step("upload csv with long note", async () => {
    await page.goto("/expenses/import");
    await page.locator("#expense-import-file").setInputFiles(makeCsvFilePayload("long-note.csv", expenseImportFixtures.noteTooLong.csv));
    await page.getByRole("button", { name: "Preview Import" }).click();
  });

  await recorder.step("assert note length validation", async () => {
    await expect(page.getByText("Total rows: 1")).toBeVisible();
    await expect(page.getByText("Valid rows: 0")).toBeVisible();
    await expect(page.getByText("Invalid rows: 1")).toBeVisible();
    await expect(page.getByText(/Note cannot exceed 500 characters\./)).toBeVisible();
    await expect(page.getByRole("button", { name: "Confirm Import" })).toBeDisabled();
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:csv_import_note_exceeds_max_length");
  await recorder.save(testInfo);
});
