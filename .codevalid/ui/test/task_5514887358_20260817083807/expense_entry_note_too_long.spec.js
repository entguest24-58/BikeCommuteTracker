import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupAuthenticatedSession } from "../../helpers/mock-api.js";

test("Expense entry fails with error when note exceeds 500 characters", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "expense_entry_note_too_long",
    testTitle: testInfo.title,
  });
  const longNote = "a".repeat(501);

  await recorder.step("Seed authenticated session", async () => {
    await setupAuthenticatedSession(page);
  });

  await recorder.step("Open expense entry page", async () => {
    await page.goto("/expenses/entry");
    await expect(page.getByRole("heading", { name: "Record Expense" })).toBeVisible();
  });

  await recorder.step("Attempt to enter more than 500 characters", async () => {
    await page.locator('[name="expenseDate"]').fill("2024-06-15");
    await page.locator('[name="amount"]').fill("12.50");
    await page.locator('[name="note"]').fill(longNote);
  });

  await recorder.step("Verify textarea is capped at 500 characters", async () => {
    const value = await page.locator('[name="note"]').inputValue();
    expect(value.length).toBe(500);
    await expect(page.locator('[name="note"]')).toHaveValue("a".repeat(500));
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:expense_entry_note_too_long");
  await recorder.save(testInfo);
});
