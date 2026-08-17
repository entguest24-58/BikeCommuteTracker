import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupAuthenticatedSession } from "../../helpers/mock-api.js";
import { setupExpenseImportScenario, makeCsvFilePayload } from "../../helpers/expense-import-mock-api.js";
import { expenseImportFixtures } from "../../mock/expense-import-fixtures.js";

test("csv_import_parsing_currency_symbols", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({ testId: "csv_import_parsing_currency_symbols", testTitle: testInfo.title });

  await recorder.step("seed session and mocks", async () => {
    await setupAuthenticatedSession(page);
    await setupExpenseImportScenario(page, expenseImportFixtures.currencySymbolsParsed);
  });

  await recorder.step("upload formatted currency csv", async () => {
    await page.goto("/expenses/import");
    await page.locator("#expense-import-file").setInputFiles(makeCsvFilePayload("currency.csv", expenseImportFixtures.currencySymbolsParsed.csv));
    await page.getByRole("button", { name: "Preview Import" }).click();
  });

  await recorder.step("assert parsed amount preview and import", async () => {
    await expect(page.getByText("Valid rows: 1")).toBeVisible();
    await expect(page.getByText("Invalid rows: 0")).toBeVisible();
    await page.getByRole("button", { name: "Confirm Import" }).click();
    await expect(page.getByRole("heading", { name: "Import complete" })).toBeVisible();
    await expect(page.getByText("Imported rows: 1")).toBeVisible();
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:csv_import_parsing_currency_symbols");
  await recorder.save(testInfo);
});
