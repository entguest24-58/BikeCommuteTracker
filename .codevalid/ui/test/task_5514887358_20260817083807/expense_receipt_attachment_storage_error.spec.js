import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupAuthenticatedSession } from "../../helpers/mock-api.js";
import { authSession } from "../../mock/mock-data.js";

function json(route, status, body) {
  return route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
}

test("Receipt attachment fails gracefully on non-fatal storage errors", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({ testId: "expense_receipt_attachment_storage_error", testTitle: testInfo.title });

  await recorder.step("seed expense row with upload failure api", async () => {
    await setupAuthenticatedSession(page, authSession);
    await page.route("**/api/expenses", async (route) => json(route, 200, {
      expenses: [
        { expenseId: 1, expenseDate: "2024-06-10T00:00:00Z", amount: 10, notes: "Bike repair", hasReceipt: false, version: 1, createdAtUtc: "2024-06-10T00:00:00Z" },
      ],
      totalAmount: 10,
      expenseCount: 1,
      generatedAtUtc: "2026-08-17T08:00:00.000Z",
    }));
    await page.route("**/api/expenses/1", async (route) => {
      if (route.request().method() === "PUT") return json(route, 200, { expenseId: 1, savedAtUtc: "2026-08-17T08:00:00.000Z", newVersion: 2 });
      return route.fallback();
    });
    await page.route("**/api/expenses/1/receipt", async (route) => {
      if (route.request().method() === "PUT") {
        return json(route, 500, { message: "Receipt attachment failed. Expense saved without receipt." });
      }
      return route.fulfill({ status: 404, contentType: "application/json", body: JSON.stringify({ message: "Not found" }) });
    });
  });

  await recorder.step("save edit with valid receipt and failing upload", async () => {
    await page.goto("/expenses/history");
    await page.getByRole("button", { name: "Edit expense" }).click();
    await page.getByLabel("Replace receipt").setInputFiles({ name: "receipt.jpg", mimeType: "image/jpeg", buffer: Buffer.from("jpeg") });
    await page.getByRole("button", { name: "Save" }).click();
  });

  await recorder.step("verify actual current ui behavior on upload failure", async () => {
    await expect(page.getByText("Receipt attachment failed. Expense saved without receipt.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Save" })).toBeVisible();
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:expense_receipt_attachment_storage_error");
  await recorder.save(testInfo);
});
