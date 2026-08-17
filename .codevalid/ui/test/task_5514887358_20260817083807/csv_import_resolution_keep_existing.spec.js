import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupAuthenticatedSession } from "../../helpers/mock-api.js";
import { authSession } from "../../mock/mock-data.js";

function json(route, status, body) { return route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) }); }

test("User resolves duplicate by selecting 'Keep Existing' and skips import", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({ testId: "csv_import_resolution_keep_existing", testTitle: testInfo.title });
  let confirmRequest = null;

  await recorder.step("seed duplicate preview and confirm summary", async () => {
    await setupAuthenticatedSession(page, authSession);
    await page.route("**/api/expense-imports/preview", async (route) => json(route, 200, {
      jobId: 204, fileName: "expenses.csv", totalRows: 2, validRows: 2, invalidRows: 0, duplicateCount: 1, errors: [],
      duplicates: [{ rowNumber: 1, expenseDate: "2024-06-15", amount: 15, note: null, existingMatches: [{ expenseId: 1, expenseDate: "2024-06-15", amount: 15, note: "Oil change" }] }],
      canConfirmImport: true,
    }));
    await page.route("**/api/expense-imports/204/confirm", async (route) => {
      confirmRequest = route.request().postDataJSON();
      return json(route, 200, { jobId: 204, totalRows: 2, importedRows: 1, skippedRows: 1, failedRows: 0 });
    });
    await page.route("**/api/expense-imports/204", async (route) => route.fulfill({ status: 204, body: "" }));
  });

  await recorder.step("choose keep existing and confirm import", async () => {
    await page.goto("/expenses/import");
    await page.locator("#expense-import-file").setInputFiles({ name: "expenses.csv", mimeType: "text/csv", buffer: Buffer.from("Date,Amount\n2024-06-15,15.00\n2024-06-16,20.00") });
    await page.getByRole("button", { name: "Preview Import" }).click();
    await page.getByLabel("Keep Existing").check();
    await page.getByRole("button", { name: "Confirm Import" }).click();
  });

  await recorder.step("verify summary and duplicate resolution payload", async () => {
    expect(confirmRequest).toEqual({
      overrideAllDuplicates: false,
      duplicateChoices: [{ rowNumber: 1, resolution: "keep-existing" }],
    });
    await expect(page.getByRole("heading", { name: "Import complete" })).toBeVisible();
    await expect(page.getByText("Imported rows: 1")).toBeVisible();
    await expect(page.getByText("Skipped rows: 1")).toBeVisible();
    await expect(page.getByText("Failed rows: 0")).toBeVisible();
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:csv_import_resolution_keep_existing");
  await recorder.save(testInfo);
});
