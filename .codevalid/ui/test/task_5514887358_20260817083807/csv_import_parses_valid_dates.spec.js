import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupAuthenticatedSession } from "../../helpers/mock-api.js";
import { authSession } from "../../mock/mock-data.js";

function json(route, status, body) { return route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) }); }

test("CSV import parses diverse date formats and validates validity", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({ testId: "csv_import_parses_valid_dates", testTitle: testInfo.title });

  await recorder.step("seed preview response with one invalid date row", async () => {
    await setupAuthenticatedSession(page, authSession);
    await page.route("**/api/expense-imports/preview", async (route) => json(route, 200, {
      jobId: 201,
      fileName: "expenses.csv",
      totalRows: 2,
      validRows: 1,
      invalidRows: 1,
      duplicateCount: 0,
      errors: [{ rowNumber: 2, field: "Date", message: "Invalid date format." }],
      duplicates: [],
      canConfirmImport: true,
    }));
  });

  await recorder.step("upload file and preview", async () => {
    await page.goto("/expenses/import");
    await page.locator("#expense-import-file").setInputFiles({ name: "expenses.csv", mimeType: "text/csv", buffer: Buffer.from("Date,Amount\n2024-06-15,15.00\ninvalid-date,20.00") });
    await page.getByRole("button", { name: "Preview Import" }).click();
  });

  await recorder.step("verify preview counters and invalid row message", async () => {
    await expect(page.getByText("Valid rows: 1")).toBeVisible();
    await expect(page.getByText("Invalid rows: 1")).toBeVisible();
    await expect(page.getByText("Row 2: Invalid date format.")).toBeVisible();
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:csv_import_parses_valid_dates");
  await recorder.save(testInfo);
});
