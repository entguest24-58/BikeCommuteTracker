import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupAuthenticatedSession } from "../../helpers/mock-api.js";
import { authSession } from "../../mock/mock-data.js";

function json(route, status, body) {
  return route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
}

test("Expense history filters list by date range and updates totals", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({ testId: "expense_history_filter_by_date_range", testTitle: testInfo.title });

  await recorder.step("seed authenticated session and conditional filter responses", async () => {
    await setupAuthenticatedSession(page, authSession);
    await page.route("**/api/expenses**", async (route) => {
      const url = new URL(route.request().url());
      const startDate = url.searchParams.get("startDate");
      const endDate = url.searchParams.get("endDate");
      if (startDate === "2024-06-10" && endDate === "2024-06-18") {
        return json(route, 200, {
          expenses: [
            { expenseId: 2, expenseDate: "2024-06-15T00:00:00Z", amount: 20, notes: "Mid-month", hasReceipt: false, version: 1, createdAtUtc: "2024-06-15T00:00:00Z" },
          ],
          totalAmount: 20,
          expenseCount: 1,
          generatedAtUtc: "2026-08-17T08:00:00.000Z",
        });
      }
      return json(route, 200, {
        expenses: [
          { expenseId: 1, expenseDate: "2024-06-20T00:00:00Z", amount: 30, notes: "Late month", hasReceipt: false, version: 1, createdAtUtc: "2024-06-20T00:00:00Z" },
          { expenseId: 2, expenseDate: "2024-06-15T00:00:00Z", amount: 20, notes: "Mid-month", hasReceipt: false, version: 1, createdAtUtc: "2024-06-15T00:00:00Z" },
          { expenseId: 3, expenseDate: "2024-06-01T00:00:00Z", amount: 10, notes: "Start month", hasReceipt: false, version: 1, createdAtUtc: "2024-06-01T00:00:00Z" },
        ],
        totalAmount: 60,
        expenseCount: 3,
        generatedAtUtc: "2026-08-17T08:00:00.000Z",
      });
    });
  });

  await recorder.step("load expense history and apply date range filter", async () => {
    await page.goto("/expenses/history");
    await page.locator("#expense-filter-from").fill("2024-06-10");
    await page.locator("#expense-filter-to").fill("2024-06-18");
    await page.getByRole("button", { name: "Apply Filter" }).click();
  });

  await recorder.step("verify filtered list and filtered total", async () => {
    await expect(page.locator("tbody tr")).toHaveCount(1);
    await expect(page.locator("tbody tr").first()).toContainText("2024-06-15");
    await expect(page.locator("tbody tr").first()).toContainText("$20.00");
    await expect(page.getByText("Filtered total: $20.00")).toBeVisible();
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:expense_history_filter_by_date_range");
  await recorder.save(testInfo);
});
