import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupAuthenticatedSession } from "../../helpers/mock-api.js";

test("Receipt exceeding 5 MB is rejected with clear error", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "expense_entry_receipt_too_large",
    testTitle: testInfo.title,
  });

  await recorder.step("Seed authenticated session", async () => {
    await setupAuthenticatedSession(page);
  });

  await recorder.step("Open page and fill valid required inputs", async () => {
    await page.goto("/expenses/entry");
    await page.locator('[name="expenseDate"]').fill("2024-06-15");
    await page.locator('[name="amount"]').fill("33.00");
  });

  await recorder.step("Upload oversized PDF receipt", async () => {
    await page.locator('[name="receipt"]').setInputFiles({
      name: "large.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.alloc(5 * 1024 * 1024 + 1, "a"),
    });
  });

  await recorder.step("Verify receipt validation and preserved data", async () => {
    await expect(page.getByText("Receipt must be JPEG, PNG, WEBP, or PDF and cannot exceed 5 MB.")).toBeVisible();
    await expect(page.locator('[name="expenseDate"]')).toHaveValue("2024-06-15");
    await expect(page.locator('[name="amount"]')).toHaveValue("33.00");
    await expect(page.locator('[name="receipt"]')).toHaveValue("");
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:expense_entry_receipt_too_large");
  await recorder.save(testInfo);
});
