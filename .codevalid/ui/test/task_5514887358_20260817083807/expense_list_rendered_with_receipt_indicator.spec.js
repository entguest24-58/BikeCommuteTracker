import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupAuthenticatedSession } from "../../helpers/mock-api.js";
import { authSession } from "../../mock/mock-data.js";

function json(route, status, body) {
  return route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  });
}

test("Expense history lists expenses with receipt indicator", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "expense_list_rendered_with_receipt_indicator",
    testTitle: testInfo.title,
  });

  await recorder.step("seed authenticated session and expense history rows", async () => {
    await setupAuthenticatedSession(page, authSession);
    await page.route("**/api/expenses", async (route) =>
      json(route, 200, {
        expenses: [
          {
            expenseId: 1,
            expenseDate: "2024-06-15T00:00:00Z",
            amount: 24.5,
            notes: "Oil change for commuter bike with longer note",
            hasReceipt: true,
            version: 1,
            createdAtUtc: "2024-06-15T00:00:00Z",
          },
          {
            expenseId: 2,
            expenseDate: "2024-06-14T00:00:00Z",
            amount: 8,
            notes: "Tube",
            hasReceipt: false,
            version: 1,
            createdAtUtc: "2024-06-14T00:00:00Z",
          },
        ],
        totalAmount: 32.5,
        expenseCount: 2,
        generatedAtUtc: "2026-08-17T08:00:00.000Z",
      })
    );
    await page.route("**/api/expenses/1/receipt**", async (route) =>
      route.fulfill({ status: 200, body: "receipt" })
    );
  });

  await recorder.step("open expense history", async () => {
    await page.goto("/expenses/history");
  });

  await recorder.step("verify row rendering and actual receipt affordances", async () => {
    await expect(page.locator("tbody tr")).toHaveCount(2);
    const firstRow = page.locator("tbody tr").nth(0);
    const secondRow = page.locator("tbody tr").nth(1);

    await expect(firstRow).toContainText("2024-06-15");
    await expect(firstRow).toContainText("$24.50");
    await expect(firstRow).toContainText("Oil change for commuter bike with longer note");
    await expect(firstRow.getByRole("link", { name: "View receipt" })).toBeVisible();
    await expect(firstRow.getByRole("button", { name: "Download receipt" })).toBeVisible();

    await expect(secondRow).toContainText("2024-06-14");
    await expect(secondRow).toContainText("$8.00");
    await expect(secondRow).toContainText("Tube");
    await expect(secondRow.getByText("No")).toBeVisible();
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:expense_list_rendered_with_receipt_indicator");
  await recorder.save(testInfo);
});
