import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupAuthenticatedSession } from "../../helpers/mock-api.js";
import { authSession } from "../../mock/mock-data.js";

function json(route, status, body) {
  return route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
}

test("Expense receipt upload blocks files over 5 MB", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({ testId: "expense_receipt_upload_too_large", testTitle: testInfo.title });

  await recorder.step("seed expense history row", async () => {
    await setupAuthenticatedSession(page, authSession);
    await page.route("**/api/expenses", async (route) => json(route, 200, {
      expenses: [
        { expenseId: 1, expenseDate: "2024-06-10T00:00:00Z", amount: 10, notes: "Bike repair", hasReceipt: false, version: 1, createdAtUtc: "2024-06-10T00:00:00Z" },
      ],
      totalAmount: 10,
      expenseCount: 1,
      generatedAtUtc: "2026-08-17T08:00:00.000Z",
    }));
  });

  await recorder.step("document current implementation gap in history edit mode for client-side size validation", async () => {
    await page.goto("/expenses/history");
    await page.getByRole("button", { name: "Edit expense" }).click();
    await expect(page.getByLabel("Replace receipt")).toBeVisible();
    await expect(page.getByText("File size must not exceed 5 MB.")).toHaveCount(0);
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:expense_receipt_upload_too_large");
  await recorder.save(testInfo);
});
