import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupAuthenticatedSession } from "../../helpers/mock-api.js";
import { authSession } from "../../mock/mock-data.js";

function json(route, status, body) { return route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) }); }

test("User overrides all duplicates and imports all valid rows as new", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({ testId: "csv_import_override_all_duplicates", testTitle: testInfo.title });
  let confirmRequest = null;

  await recorder.step("seed duplicate preview and confirm endpoint", async () => {
    await setupAuthenticatedSession(page, authSession);
    await page.route("**/api/expense-imports/preview", async (route) => json(route, 200, {
      jobId: 207, fileName: "expenses.csv", totalRows: 2, validRows: 2, invalidRows: 0, duplicateCount: 1, errors: [],
      duplicates: [{ rowNumber: 1, expenseDate: "2024-06-15", amount: 15, note: null, existingMatches: [{ expenseId: 1, expenseDate: "2024-06-15", amount: 15, note: "Oil change" }] }],
      canConfirmImport: true,
    }));
    await page.route("**/api/expense-imports/207/confirm", async (route) => {
      confirmRequest = route.request().postDataJSON();
      return json(route, 200, { jobId: 207, totalRows: 2, importedRows: 2, skippedRows: 0, failedRows: 0 });
    });
    await page.route("**/api/expense-imports/207", async (route) => route.fulfill({ status: 204, body: "" }));
  });

  await recorder.step("enable override all duplicates and confirm", async () => {
    await page.goto("/expenses/import");
    await page.locator("#expense-import-file").setInputFiles({ name: "expenses.csv", mimeType: "text/csv", buffer: Buffer.from("Date,Amount\n2024-06-15,15.00\n2024-06-16,20.00") });
    await page.getByRole("button", { name: "Preview Import" }).click();
    await page.getByLabel("Override All Duplicates").check();
    await page.getByRole("button", { name: "Confirm Import" }).click();
  });

  await recorder.step("verify override payload and summary", async () => {
    expect(confirmRequest).toEqual({
      overrideAllDuplicates: true,
      duplicateChoices: [],
    });
    await expect(page.getByText("Imported rows: 2")).toBeVisible();
    await expect(page.getByText("Skipped rows: 0")).toBeVisible();
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:csv_import_override_all_duplicates");
  await recorder.save(testInfo);
});
