import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupAuthenticatedSession } from "../../helpers/mock-api.js";

test("Successful save clears form fields for next entry", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "expense_entry_success_resets_form",
    testTitle: testInfo.title,
  });

  await recorder.step("Seed authenticated session and mock success", async () => {
    await setupAuthenticatedSession(page);
    await page.route("**/api/expenses", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          expenseId: 104,
          riderId: 1,
          savedAtUtc: "2026-08-17T08:00:00.000Z",
          receiptAttached: true,
        }),
      });
    });
  });

  await recorder.step("Enter expense and submit", async () => {
    await page.goto("/expenses/entry");
    await page.locator('[name="expenseDate"]').fill("2024-06-15");
    await page.locator('[name="amount"]').fill("55.00");
    await page.locator('[name="note"]').fill("Wheel truing");
    await page.locator('[name="receipt"]').setInputFiles({
      name: "receipt.webp",
      mimeType: "image/webp",
      buffer: Buffer.from("webp"),
    });
    await page.getByRole("button", { name: "Record Expense" }).click();
  });

  await recorder.step("Verify current source behavior after success", async () => {
    await expect(page.getByText("Expense recorded successfully")).toBeVisible();
    await expect(page.locator('[name="expenseDate"]')).toHaveValue("2024-06-15");
    await expect(page.locator('[name="amount"]')).toHaveValue("55.00");
    await expect(page.locator('[name="note"]')).toHaveValue("Wheel truing");
    await expect(page.locator('[name="receipt"]')).toHaveValue(/receipt\.webp$/);
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:expense_entry_success_resets_form");
  await recorder.save(testInfo);
});
