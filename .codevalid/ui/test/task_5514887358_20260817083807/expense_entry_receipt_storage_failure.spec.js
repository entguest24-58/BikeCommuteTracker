import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupAuthenticatedSession } from "../../helpers/mock-api.js";

test("Receipt storage failure allows expense save with notification", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "expense_entry_receipt_storage_failure",
    testTitle: testInfo.title,
  });

  await recorder.step("Seed authenticated session and non-fatal receipt warning response", async () => {
    await setupAuthenticatedSession(page);
    await page.route("**/api/expenses", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          expenseId: 103,
          riderId: 1,
          savedAtUtc: "2026-08-17T08:00:00.000Z",
          receiptAttached: false,
          receiptError: "Receipt could not be attached due to a storage issue. Expense recorded without receipt.",
        }),
      });
    });
  });

  await recorder.step("Fill valid form and attach receipt", async () => {
    await page.goto("/expenses/entry");
    await page.locator('[name="expenseDate"]').fill("2024-06-15");
    await page.locator('[name="amount"]').fill("20.00");
    await page.locator('[name="receipt"]').setInputFiles({
      name: "receipt.jpg",
      mimeType: "image/jpeg",
      buffer: Buffer.from("valid-image"),
    });
  });

  await recorder.step("Submit and verify warning with success", async () => {
    await page.getByRole("button", { name: "Record Expense" }).click();
    await expect(page.getByText("Expense recorded successfully")).toBeVisible();
    await expect(page.getByText("Receipt could not be attached due to a storage issue. Expense recorded without receipt.")).toBeVisible();
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:expense_entry_receipt_storage_failure");
  await recorder.save(testInfo);
});
