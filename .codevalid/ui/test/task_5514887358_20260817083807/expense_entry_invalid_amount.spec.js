import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupAuthenticatedSession } from "../../helpers/mock-api.js";

test("Expense entry fails with error when amount is zero or negative", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "expense_entry_invalid_amount",
    testTitle: testInfo.title,
  });

  await recorder.step("Seed authenticated session", async () => {
    await setupAuthenticatedSession(page);
  });

  await recorder.step("Navigate to expense entry page", async () => {
    await page.goto("/expenses/entry");
    await expect(page.getByRole("heading", { name: "Record Expense" })).toBeVisible();
  });

  await recorder.step("Enter valid date and invalid amount", async () => {
    await page.locator('[name="expenseDate"]').fill("2024-06-15");
    await page.locator('[name="amount"]').fill("0");
    await page.locator('[name="note"]').fill("Flat repair");
  });

  await recorder.step("Submit and verify amount validation", async () => {
    await page.getByRole("button", { name: "Record Expense" }).click();
    await expect(page.getByText("Amount must be greater than zero")).toBeVisible();
    await expect(page.locator('[name="expenseDate"]')).toHaveValue("2024-06-15");
    await expect(page.locator('[name="note"]')).toHaveValue("Flat repair");
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:expense_entry_invalid_amount");
  await recorder.save(testInfo);
});
