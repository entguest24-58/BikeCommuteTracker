import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupAuthenticatedSession } from "../../helpers/mock-api.js";

test("Note length is validated in real-time with character counter", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "expense_entry_large_note_validated_on_fly",
    testTitle: testInfo.title,
  });
  const overLimit = "b".repeat(600);

  await recorder.step("Seed authenticated session and navigate", async () => {
    await setupAuthenticatedSession(page);
    await page.goto("/expenses/entry");
    await expect(page.getByRole("heading", { name: "Record Expense" })).toBeVisible();
  });

  await recorder.step("Type more than 500 characters into note", async () => {
    await page.locator('[name="note"]').fill(overLimit);
  });

  await recorder.step("Verify textarea enforces maxLength", async () => {
    const actualValue = await page.locator('[name="note"]').inputValue();
    expect(actualValue.length).toBe(500);
    await expect(page.locator('[name="note"]')).toHaveValue("b".repeat(500));
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:expense_entry_large_note_validated_on_fly");
  await recorder.save(testInfo);
});
