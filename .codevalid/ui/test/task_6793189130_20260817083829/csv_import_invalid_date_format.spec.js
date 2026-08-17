import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupAuthenticatedSession } from "../../helpers/mock-api.js";
import { setupExpenseImportScenario, makeCsvFilePayload } from "../../helpers/expense-import-mock-api.js";
import { expenseImportFixtures } from "../../mock/expense-import-fixtures.js";

test("csv_import_invalid_date_format", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({ testId: "csv_import_invalid_date_format", testTitle: testInfo.title });

  await recorder.step("seed session and invalid date mock", async () => {
    await setupAuthenticatedSession(page);
    await setupExpenseImportScenario(page, expenseImportFixtures.invalidDateFormat);
  });

  await recorder.step("upload unsupported date format csv", async () => {
    await page.goto("/expenses/import");
    await page.locator("#expense-import-file").setInputFiles(makeCsvFilePayload("invalid-date.csv", expenseImportFixtures.invalidDateFormat.csv));
    await page.getByRole("button", { name: "Preview Import" }).click();
  });

  await recorder.step("assert invalid date message", async () => {
    await expect(page.getByText("Invalid rows: 1")).toBeVisible();
    await expect(page.getByText(/Date format not recognized\. Use MM\/DD\/YYYY or YYYY-MM-DD\./)).toBeVisible();
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:csv_import_invalid_date_format");
  await recorder.save(testInfo);
});
