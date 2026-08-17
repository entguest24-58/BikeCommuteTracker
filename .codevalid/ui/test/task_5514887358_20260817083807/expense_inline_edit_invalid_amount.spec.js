import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupAuthenticatedSession } from "../../helpers/mock-api.js";
import { authSession } from "../../mock/mock-data.js";

function json(route, status, body) {
  return route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
}

test("Expense inline edit blocks invalid (non-positive) amounts", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({ testId: "expense_inline_edit_invalid_amount", testTitle: testInfo.title });

  await recorder.step("seed expense history", async () => {
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

  await recorder.step("attempt invalid save", async () => {
    await page.goto("/expenses/history");
    await page.getByRole("button", { name: "Edit expense" }).click();
    await page.getByLabel("Edit amount").fill("-5.00");
    await page.getByRole("button", { name: "Save" }).click();
  });

  await recorder.step("verify error and unchanged original values", async () => {
    await expect(page.getByText("Amount must be greater than zero")).toBeVisible();
    await expect(page.getByLabel("Edit amount")).toHaveValue("-5.00");
    await expect(page.getByRole("button", { name: "Save" })).toBeVisible();
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:expense_inline_edit_invalid_amount");
  await recorder.save(testInfo);
});
