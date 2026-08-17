import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupAuthenticatedSession, setupExpenseApis } from "../../helpers/mock-api.js";

test("Expense fails validation with note exceeding 500 characters", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("expense_entry_note_too_long", "Expense fails validation with note exceeding 500 characters");
  const tooLongNote = "a".repeat(501);

  await recorder.step("Seed authenticated session and expense mocks");
  await setupAuthenticatedSession(page);
  await setupExpenseApis(page);

  await recorder.step("Open expense entry page and inject a 501 character note");
  await page.goto("/expenses/entry");
  await page.locator('[name="expenseDate"]').fill("2024-06-15");
  await page.locator('[name="amount"]').fill("15.00");
  await page.locator('[name="note"]').evaluate((element, value) => {
    element.value = value;
    element.dispatchEvent(new Event("input", { bubbles: true }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
  }, tooLongNote);
  await page.getByRole("button", { name: "Record Expense" }).click();

  await recorder.step("Assert note length validation error");
  await expect(page.getByText("Note must be 500 characters or fewer")).toBeVisible();

  console.log("CODEVALID_TEST_ASSERTION_OK:expense_entry_note_too_long");
  await recorder.save(testInfo);
});
