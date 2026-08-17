import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupAuthenticatedSession } from "../../helpers/mock-api.js";
import { setupExpenseImportScenario, makeCsvFilePayload } from "../../helpers/expense-import-mock-api.js";
import { expenseImportFixtures } from "../../mock/expense-import-fixtures.js";

test("csv_import_summary_after_import_completed", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({ testId: "csv_import_summary_after_import_completed", testTitle: testInfo.title });

  await recorder.step("seed session and summary scenario", async () => {
    await setupAuthenticatedSession(page);
    await setupExpenseImportScenario(page, expenseImportFixtures.summaryCounts);
  });

  await recorder.step("preview and confirm import", async () => {
    await page.goto("/expenses/import");
    await page.locator("#expense-import-file").setInputFiles(makeCsvFilePayload("summary.csv", expenseImportFixtures.summaryCounts.csv));
    await page.getByRole("button", { name: "Preview Import" }).click();
    await page.getByRole("button", { name: "Confirm Import" }).click();
  });

  await recorder.step("assert completion metrics", async () => {
    await expect(page.getByRole("heading", { name: "Import complete" })).toBeVisible();
    await expect(page.getByText("Imported rows: 7")).toBeVisible();
    await expect(page.getByText("Skipped rows: 1")).toBeVisible();
    await expect(page.getByText("Failed rows: 2")).toBeVisible();
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:csv_import_summary_after_import_completed");
  await recorder.save(testInfo);
});
