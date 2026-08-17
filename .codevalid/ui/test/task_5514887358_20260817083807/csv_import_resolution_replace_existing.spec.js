import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupAuthenticatedSession } from "../../helpers/mock-api.js";
import { authSession } from "../../mock/mock-data.js";

function json(route, status, body) { return route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) }); }

test("User resolves duplicate by selecting 'Replace with Import' and updates existing expense", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({ testId: "csv_import_resolution_replace_existing", testTitle: testInfo.title });
  let confirmRequest = null;

  await recorder.step("seed duplicate preview and summary", async () => {
    await setupAuthenticatedSession(page, authSession);
    await page.route("**/api/expense-imports/preview", async (route) => json(route, 200, {
      jobId: 205, fileName: "expenses.csv", totalRows: 1, validRows: 1, invalidRows: 0, duplicateCount: 1, errors: [],
      duplicates: [{ rowNumber: 1, expenseDate: "2024-06-15", amount: 20.5, note: "Flat tire", existingMatches: [{ expenseId: 1, expenseDate: "2024-06-15", amount: 15, note: "Oil change" }] }],
      canConfirmImport: true,
    }));
    await page.route("**/api/expense-imports/205/confirm", async (route) => {
      confirmRequest = route.request().postDataJSON();
      return json(route, 200, { jobId: 205, totalRows: 1, importedRows: 1, skippedRows: 0, failedRows: 0 });
    });
    await page.route("**/api/expense-imports/205", async (route) => route.fulfill({ status: 204, body: "" }));
  });

  await recorder.step("choose replace and confirm", async () => {
    await page.goto("/expenses/import");
    await page.locator("#expense-import-file").setInputFiles({ name: "expenses.csv", mimeType: "text/csv", buffer: Buffer.from("Date,Amount,Note\n2024-06-15,20.50,Flat tire") });
    await page.getByRole("button", { name: "Preview Import" }).click();
    await page.getByLabel("Replace with Import").check();
    await page.getByRole("button", { name: "Confirm Import" }).click();
  });

  await recorder.step("verify request payload and summary", async () => {
    expect(confirmRequest).toEqual({
      overrideAllDuplicates: false,
      duplicateChoices: [{ rowNumber: 1, resolution: "replace-with-import" }],
    });
    await expect(page.getByText("Imported rows: 1")).toBeVisible();
    await expect(page.getByText("Skipped rows: 0")).toBeVisible();
    await expect(page.getByText("Failed rows: 0")).toBeVisible();
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:csv_import_resolution_replace_existing");
  await recorder.save(testInfo);
});
