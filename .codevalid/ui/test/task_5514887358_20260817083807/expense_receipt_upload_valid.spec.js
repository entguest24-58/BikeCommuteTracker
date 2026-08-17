import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupAuthenticatedSession } from "../../helpers/mock-api.js";
import { authSession } from "../../mock/mock-data.js";

function json(route, status, body) {
  return route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
}

test("Expense receipt upload accepts valid files and stores reference", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({ testId: "expense_receipt_upload_valid", testTitle: testInfo.title });
  let expense = { expenseId: 1, expenseDate: "2024-06-10T00:00:00Z", amount: 10, notes: "Bike repair", hasReceipt: false, version: 1, createdAtUtc: "2024-06-10T00:00:00Z" };

  await recorder.step("seed expense row and receipt upload api", async () => {
    await setupAuthenticatedSession(page, authSession);
    await page.route("**/api/expenses", async (route) => json(route, 200, {
      expenses: [expense], totalAmount: 10, expenseCount: 1, generatedAtUtc: "2026-08-17T08:00:00.000Z",
    }));
    await page.route("**/api/expenses/1", async (route) => {
      if (route.request().method() === "PUT") return json(route, 200, { expenseId: 1, savedAtUtc: "2026-08-17T08:00:00.000Z", newVersion: 2 });
      return route.fallback();
    });
    await page.route("**/api/expenses/1/receipt", async (route) => {
      if (route.request().method() === "PUT") {
        expense = { ...expense, hasReceipt: true, version: 2 };
        return route.fulfill({ status: 200, body: "" });
      }
      return route.fulfill({ status: 200, body: "receipt" });
    });
  });

  await recorder.step("replace receipt with valid jpeg and save", async () => {
    await page.goto("/expenses/history");
    await page.getByRole("button", { name: "Edit expense" }).click();
    await page.getByLabel("Replace receipt").setInputFiles({
      name: "receipt.jpg",
      mimeType: "image/jpeg",
      buffer: Buffer.from("jpeg"),
    });
    await page.getByRole("button", { name: "Save" }).click();
  });

  await recorder.step("verify receipt actions now visible", async () => {
    await expect(page.getByText("Expense updated")).toBeVisible();
    const row = page.locator("tbody tr").first();
    await expect(row.getByRole("link", { name: "View receipt" })).toBeVisible();
    await expect(row.getByRole("button", { name: "Download receipt" })).toBeVisible();
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:expense_receipt_upload_valid");
  await recorder.save(testInfo);
});
