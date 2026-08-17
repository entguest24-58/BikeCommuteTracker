import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupAuthenticatedSession } from "../../helpers/mock-api.js";

test("Valid expense entry with receipt is saved successfully", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "expense_entry_valid_submission",
    testTitle: testInfo.title,
  });

  await recorder.step("Seed authenticated session and expense save route", async () => {
    await setupAuthenticatedSession(page);
    await page.route("**/api/expenses", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          expenseId: 101,
          riderId: 1,
          savedAtUtc: "2026-08-17T08:00:00.000Z",
          receiptAttached: true,
        }),
      });
    });
  });

  await recorder.step("Navigate to expense entry page", async () => {
    await page.goto("/expenses/entry");
    await expect(page.getByRole("heading", { name: "Record Expense" })).toBeVisible();
  });

  await recorder.step("Fill valid form including receipt", async () => {
    await page.locator('[name="expenseDate"]').fill("2024-06-15");
    await page.locator('[name="amount"]').fill("45.50");
    await page.locator('[name="note"]').fill("New bike chain");
    await page.locator('[name="receipt"]').setInputFiles({
      name: "image.jpg",
      mimeType: "image/jpeg",
      buffer: Buffer.from("fake-jpeg-content"),
    });
    await expect(page.locator('[name="receipt"]')).toHaveValue(/image\.jpg$/);
  });

  await recorder.step("Submit and verify successful save", async () => {
    await page.getByRole("button", { name: "Record Expense" }).click();
    await expect(page.getByText("Expense recorded successfully")).toBeVisible();
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:expense_entry_valid_submission");
  await recorder.save(testInfo);
});
