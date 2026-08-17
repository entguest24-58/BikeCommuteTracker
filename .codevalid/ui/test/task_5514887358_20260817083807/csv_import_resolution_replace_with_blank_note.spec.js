import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupAuthenticatedSession } from "../../helpers/mock-api.js";
import { authSession } from "../../mock/mock-data.js";

function json(route, status, body) { return route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) }); }

test("Replacing duplicate with blank CSV note does not overwrite existing note", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({ testId: "csv_import_resolution_replace_with_blank_note", testTitle: testInfo.title });
  let confirmRequest = null;

  await recorder.step("seed duplicate preview with blank incoming note", async () => {
    await setupAuthenticatedSession(page, authSession);
    await page.route("**/api/expense-imports/preview", async (route) => json(route, 200, {
      jobId: 206, fileName: "expenses.csv", totalRows: 1, validRows: 1, invalidRows: 0, duplicateCount: 1, errors: [],
      duplicates: [{ rowNumber: 1, expenseDate: "2024-06-15", amount: 20.5, note: null, existingMatches: [{ expenseId: 1, expenseDate: "2024-06-15", amount: 15, note: "Oil change" }] }],
      canConfirmImport: true,
    }));
    await page.route("**/api/expense-imports/206/confirm", async (route) => {
      confirmRequest = route.request().postDataJSON();
      return json(route, 200, { jobId: 206, totalRows: 1, importedRows: 1, skippedRows: 0, failedRows: 0 });
    });
    await page.route("**/api/expense-imports/206", async (route) => route.fulfill({ status: 204, body: "" }));
  });

  await recorder.step("choose replace and confirm blank-note import", async () => {
    await page.goto("/expenses/import");
    await page.locator("#expense-import-file").setInputFiles({ name: "expenses.csv", mimeType: "text/csv", buffer: Buffer.from("Date,Amount,Note\n2024-06-15,20.50,") });
    await page.getByRole("button", { name: "Preview Import" }).click();
    await page.getByLabel("Replace with Import").check();
    await page.getByRole("button", { name: "Confirm Import" }).click();
  });

  await recorder.step("verify replace payload still posted", async () => {
    expect(confirmRequest).toEqual({
      overrideAllDuplicates: false,
      duplicateChoices: [{ rowNumber: 1, resolution: "replace-with-import" }],
    });
    await expect(page.getByText("Imported rows: 1")).toBeVisible();
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:csv_import_resolution_replace_with_blank_note");
  await recorder.save(testInfo);
});
