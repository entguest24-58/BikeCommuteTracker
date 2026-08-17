import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupAuthenticatedSession } from "../../helpers/mock-api.js";
import { authSession } from "../../mock/mock-data.js";

function json(route, status, body) { return route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) }); }

test("CSV import identifies duplicate expenses and presents per-row resolution", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({ testId: "csv_import_handles_duplicate_expenses_per_row", testTitle: testInfo.title });

  await recorder.step("seed preview duplicate conflict", async () => {
    await setupAuthenticatedSession(page, authSession);
    await page.route("**/api/expense-imports/preview", async (route) => json(route, 200, {
      jobId: 203,
      fileName: "expenses.csv",
      totalRows: 2,
      validRows: 2,
      invalidRows: 0,
      duplicateCount: 1,
      errors: [],
      duplicates: [
        {
          rowNumber: 1,
          expenseDate: "2024-06-15",
          amount: 15,
          note: null,
          existingMatches: [
            { expenseId: 9, expenseDate: "2024-06-15", amount: 15, note: "Oil change" },
          ],
        },
      ],
      canConfirmImport: true,
    }));
  });

  await recorder.step("upload file and preview duplicates", async () => {
    await page.goto("/expenses/import");
    await page.locator("#expense-import-file").setInputFiles({ name: "expenses.csv", mimeType: "text/csv", buffer: Buffer.from("Date,Amount\n2024-06-15,15.00\n2024-06-16,20.00") });
    await page.getByRole("button", { name: "Preview Import" }).click();
  });

  await recorder.step("verify duplicate controls from current UI", async () => {
    await expect(page.getByText("Duplicate rows: 1")).toBeVisible();
    await expect(page.getByText("Row 1: 2024-06-15 · $15.00")).toBeVisible();
    await expect(page.getByLabel("Keep Existing")).toBeVisible();
    await expect(page.getByLabel("Replace with Import")).toBeVisible();
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:csv_import_handles_duplicate_expenses_per_row");
  await recorder.save(testInfo);
});
