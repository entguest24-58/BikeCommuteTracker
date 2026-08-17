import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupAuthenticatedSession } from "../../helpers/mock-api.js";

test("Submission is blocked if all fields are empty", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "expense_entry_empty_fields_reject",
    testTitle: testInfo.title,
  });

  await recorder.step("Seed authenticated session and navigate", async () => {
    await setupAuthenticatedSession(page);
    await page.goto("/expenses/entry");
    await expect(page.getByRole("heading", { name: "Record Expense" })).toBeVisible();
  });

  await recorder.step("Submit empty form", async () => {
    await page.getByRole("button", { name: "Record Expense" }).click();
  });

  await recorder.step("Verify required validation errors", async () => {
    await expect(page.getByText("Expense date is required")).toBeVisible();
    await expect(page.getByText("Amount must be greater than zero")).toBeVisible();
    await expect(page.locator('[name="expenseDate"]')).toHaveValue("");
    await expect(page.locator('[name="amount"]')).toHaveValue("");
    await expect(page.locator('[name="receipt"]')).toHaveValue("");
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:expense_entry_empty_fields_reject");
  await recorder.save(testInfo);
});
