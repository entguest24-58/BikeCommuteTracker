import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupAuthenticatedSession } from "../../helpers/mock-api.js";

test("Invalid receipt file type (e.g., TXT, MP4) is rejected with error", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "expense_entry_invalid_receipt_type",
    testTitle: testInfo.title,
  });

  await recorder.step("Seed authenticated session", async () => {
    await setupAuthenticatedSession(page);
  });

  await recorder.step("Open expense entry page and fill required fields", async () => {
    await page.goto("/expenses/entry");
    await page.locator('[name="expenseDate"]').fill("2024-06-15");
    await page.locator('[name="amount"]').fill("10.00");
  });

  await recorder.step("Attempt unsupported file upload", async () => {
    await page.locator('[name="receipt"]').setInputFiles({
      name: "note.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("invalid"),
    });
  });

  await recorder.step("Verify clear receipt error and preserved fields", async () => {
    await expect(page.getByText("Receipt must be JPEG, PNG, WEBP, or PDF and cannot exceed 5 MB.")).toBeVisible();
    await expect(page.locator('[name="expenseDate"]')).toHaveValue("2024-06-15");
    await expect(page.locator('[name="amount"]')).toHaveValue("10.00");
    await expect(page.locator('[name="receipt"]')).toHaveValue("");
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:expense_entry_invalid_receipt_type");
  await recorder.save(testInfo);
});
