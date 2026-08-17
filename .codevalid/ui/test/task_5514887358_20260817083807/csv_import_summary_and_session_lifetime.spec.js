import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupAuthenticatedSession } from "../../helpers/mock-api.js";
import { authSession } from "../../mock/mock-data.js";

function json(route, status, body) { return route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) }); }

test("CSV import shows summary and deletes job records after exiting page", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({ testId: "csv_import_summary_and_session_lifetime", testTitle: testInfo.title });
  let deleteCalls = 0;

  await recorder.step("seed preview, confirm, and delete endpoints", async () => {
    await setupAuthenticatedSession(page, authSession);
    await page.route("**/api/expense-imports/preview", async (route) => json(route, 200, {
      jobId: 208, fileName: "expenses.csv", totalRows: 2, validRows: 2, invalidRows: 0, duplicateCount: 1, errors: [],
      duplicates: [{ rowNumber: 1, expenseDate: "2024-06-15", amount: 15, note: null, existingMatches: [{ expenseId: 1, expenseDate: "2024-06-15", amount: 15, note: "Oil change" }] }],
      canConfirmImport: true,
    }));
    await page.route("**/api/expense-imports/208/confirm", async (route) => json(route, 200, {
      jobId: 208, totalRows: 2, importedRows: 1, skippedRows: 1, failedRows: 0,
    }));
    await page.route("**/api/expense-imports/208", async (route) => {
      if (route.request().method() === "DELETE") {
        deleteCalls += 1;
        return route.fulfill({ status: 204, body: "" });
      }
      return route.fallback();
    });
    await page.route("**/api/expenses", async (route) => json(route, 200, {
      expenses: [{ expenseId: 2, expenseDate: "2024-06-16T00:00:00Z", amount: 20, notes: "Imported", hasReceipt: false, version: 1, createdAtUtc: "2024-06-16T00:00:00Z" }],
      totalAmount: 20, expenseCount: 1, generatedAtUtc: "2026-08-17T08:00:00.000Z",
    }));
  });

  await recorder.step("complete import and navigate back to history", async () => {
    await page.goto("/expenses/import");
    await page.locator("#expense-import-file").setInputFiles({ name: "expenses.csv", mimeType: "text/csv", buffer: Buffer.from("Date,Amount\n2024-06-15,15.00\n2024-06-16,20.00") });
    await page.getByRole("button", { name: "Preview Import" }).click();
    await page.getByLabel("Keep Existing").check();
    await page.getByRole("button", { name: "Confirm Import" }).click();
    await expect(page.getByRole("heading", { name: "Import complete" })).toBeVisible();
    await page.getByRole("link", { name: "Back to Expense History" }).click();
  });

  await recorder.step("verify cleanup call occurred and history remains", async () => {
    expect(deleteCalls).toBeGreaterThan(0);
    await expect(page).toHaveURL(/\/expenses\/history$/);
    await expect(page.locator("tbody tr")).toHaveCount(1);
    await expect(page.locator("tbody tr").first()).toContainText("Imported");
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:csv_import_summary_and_session_lifetime");
  await recorder.save(testInfo);
});
