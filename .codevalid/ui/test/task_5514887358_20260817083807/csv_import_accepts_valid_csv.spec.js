import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupAuthenticatedSession } from "../../helpers/mock-api.js";
import { authSession } from "../../mock/mock-data.js";

function json(route, status, body) {
  return route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
}

test("CSV import page accepts valid .csv files under 5MB", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({ testId: "csv_import_accepts_valid_csv", testTitle: testInfo.title });

  await recorder.step("seed preview api", async () => {
    await setupAuthenticatedSession(page, authSession);
    await page.route("**/api/expense-imports/preview", async (route) => json(route, 200, {
      jobId: 101,
      fileName: "expenses.csv",
      totalRows: 2,
      validRows: 2,
      invalidRows: 0,
      duplicateCount: 0,
      errors: [],
      duplicates: [],
      canConfirmImport: true,
    }));
  });

  await recorder.step("upload valid csv and preview", async () => {
    await page.goto("/expenses/import");
    await page.locator("#expense-import-file").setInputFiles({
      name: "expenses.csv",
      mimeType: "text/csv",
      buffer: Buffer.from("Date,Amount,Note\n2024-06-15,15.00,Flat tire\n2024-06-16,20.00,Chain lube"),
    });
    await page.getByRole("button", { name: "Preview Import" }).click();
  });

  await recorder.step("verify preview counts rendered", async () => {
    await expect(page.getByRole("heading", { name: "Preview" })).toBeVisible();
    await expect(page.getByText("Selected: expenses.csv")).toBeVisible();
    await expect(page.getByText("Total rows: 2")).toBeVisible();
    await expect(page.getByText("Valid rows: 2")).toBeVisible();
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:csv_import_accepts_valid_csv");
  await recorder.save(testInfo);
});
