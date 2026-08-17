import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupAuthenticatedSession } from "../../helpers/mock-api.js";
import { authSession } from "../../mock/mock-data.js";

function json(route, status, body) {
  return route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
}

test("Deleting an expense without receipt records tombstone", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({ testId: "expense_delete_without_receipt", testTitle: testInfo.title });
  let deleted = false;

  await recorder.step("seed expense and delete api", async () => {
    await setupAuthenticatedSession(page, authSession);
    await page.route("**/api/expenses", async (route) => json(route, 200, deleted ? {
      expenses: [], totalAmount: 0, expenseCount: 0, generatedAtUtc: "2026-08-17T08:00:00.000Z",
    } : {
      expenses: [
        { expenseId: 1, expenseDate: "2024-06-10T00:00:00Z", amount: 10, notes: "No receipt", hasReceipt: false, version: 1, createdAtUtc: "2024-06-10T00:00:00Z" },
      ], totalAmount: 10, expenseCount: 1, generatedAtUtc: "2026-08-17T08:00:00.000Z",
    }));
    await page.route("**/api/expenses/1", async (route) => {
      if (route.request().method() === "DELETE") {
        deleted = true;
        return json(route, 200, { expenseId: 1, deletedAtUtc: "2026-08-17T08:00:00.000Z" });
      }
      return route.fallback();
    });
  });

  await recorder.step("delete expense", async () => {
    await page.goto("/expenses/history");
    await page.getByRole("button", { name: "Delete expense" }).click();
  });

  await recorder.step("verify removed from display", async () => {
    await expect(page.getByText("Expense deleted")).toBeVisible();
    await expect(page.locator("tbody tr")).toHaveCount(0);
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:expense_delete_without_receipt");
  await recorder.save(testInfo);
});
