import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupAuthenticatedSession } from "../../helpers/mock-api.js";
import { setupExpenseImportScenario, makeCsvFilePayload } from "../../helpers/expense-import-mock-api.js";
import { expenseImportFixtures } from "../../mock/expense-import-fixtures.js";

test("csv_import_parsing_trailing_iso_currency", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({ testId: "csv_import_parsing_trailing_iso_currency", testTitle: testInfo.title });

  await recorder.step("seed session and mocks", async () => {
    await setupAuthenticatedSession(page);
    await setupExpenseImportScenario(page, expenseImportFixtures.trailingIsoCurrencyParsed);
  });

  await recorder.step("upload trailing iso csv", async () => {
    await page.goto("/expenses/import");
    await page.locator("#expense-import-file").setInputFiles(makeCsvFilePayload("iso.csv", expenseImportFixtures.trailingIsoCurrencyParsed.csv));
    await page.getByRole("button", { name: "Preview Import" }).click();
  });

  await recorder.step("assert parsed preview and summary", async () => {
    await expect(page.getByText("Valid rows: 1")).toBeVisible();
    await page.getByRole("button", { name: "Confirm Import" }).click();
    await expect(page.getByRole("heading", { name: "Import complete" })).toBeVisible();
    await expect(page.getByText("Imported rows: 1")).toBeVisible();
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:csv_import_parsing_trailing_iso_currency");
  await recorder.save(testInfo);
});
