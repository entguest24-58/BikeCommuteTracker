import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupAuthenticatedSession } from "../../helpers/mock-api.js";
import { authSession } from "../../mock/mock-data.js";

function json(route, status, body) {
  return route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
}

test("Expense inline edit blocks notes longer than 500 characters", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({ testId: "expense_inline_edit_overlong_note", testTitle: testInfo.title });
  const longNote = "x".repeat(600);

  await recorder.step("seed history row", async () => {
    await setupAuthenticatedSession(page, authSession);
    await page.route("**/api/expenses", async (route) => json(route, 200, {
      expenses: [
        { expenseId: 1, expenseDate: "2024-06-10T00:00:00Z", amount: 10, notes: "Short note", hasReceipt: false, version: 1, createdAtUtc: "2024-06-10T00:00:00Z" },
      ],
      totalAmount: 10,
      expenseCount: 1,
      generatedAtUtc: "2026-08-17T08:00:00.000Z",
    }));
  });

  await recorder.step("enter overlong note into textarea", async () => {
    await page.goto("/expenses/history");
    await page.getByRole("button", { name: "Edit expense" }).click();
    await page.getByLabel("Edit notes").fill(longNote);
  });

  await recorder.step("verify current implementation truncates with maxLength instead of showing server-like field error", async () => {
    await expect(page.getByLabel("Edit notes")).toHaveValue("x".repeat(500));
    await expect(page.getByText("Note cannot exceed 500 characters.")).toHaveCount(0);
    await expect(page.getByLabel("Edit amount")).toHaveValue("10");
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:expense_inline_edit_overlong_note");
  await recorder.save(testInfo);
});
