import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupAuthenticatedSession } from "../../helpers/mock-api.js";
import { authSession } from "../../mock/mock-data.js";

function json(route, status, body) { return route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) }); }

test("CSV import parses and validates amounts including formatting cleanup", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({ testId: "csv_import_parses_valid_amounts", testTitle: testInfo.title });

  await recorder.step("seed amount parsing preview response", async () => {
    await setupAuthenticatedSession(page, authSession);
    await page.route("**/api/expense-imports/preview", async (route) => json(route, 200, {
      jobId: 202,
      fileName: "expenses.csv",
      totalRows: 3,
      validRows: 2,
      invalidRows: 1,
      duplicateCount: 0,
      errors: [{ rowNumber: 3, field: "Amount", message: "Amount must be greater than zero." }],
      duplicates: [],
      canConfirmImport: true,
    }));
  });

  await recorder.step("preview csv", async () => {
    await page.goto("/expenses/import");
    await page.locator("#expense-import-file").setInputFiles({ name: "expenses.csv", mimeType: "text/csv", buffer: Buffer.from("Date,Amount\n2024-06-15,$15.75\n2024-06-16,1200.00 USD\n2024-06-17,-10.50") });
    await page.getByRole("button", { name: "Preview Import" }).click();
  });

  await recorder.step("verify counters and failed amount row", async () => {
    await expect(page.getByText("Total rows: 3")).toBeVisible();
    await expect(page.getByText("Valid rows: 2")).toBeVisible();
    await expect(page.getByText("Row 3: Amount must be greater than zero.")).toBeVisible();
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:csv_import_parses_valid_amounts");
  await recorder.save(testInfo);
});
