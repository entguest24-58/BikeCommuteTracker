import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupAuthenticatedSession, setupExpenseApis } from "../../helpers/mock-api.js";

test("Expense fails validation with negative amount", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("expense_entry_invalid_negative_amount", "Expense fails validation with negative amount");

  await recorder.step("Seed authenticated session and expense mocks");
  await setupAuthenticatedSession(page);
  await setupExpenseApis(page);

  await recorder.step("Open expense entry page and enter negative amount");
  await page.goto("/expenses/entry");
  await page.locator('[name="expenseDate"]').fill("2024-06-15");
  await page.locator('[name="amount"]').fill("-10.50");
  await page.getByRole("button", { name: "Record Expense" }).click();

  await recorder.step("Assert amount validation error and retained date");
  await expect(page.getByText("Amount must be greater than zero")).toBeVisible();
  await expect(page.locator('[name="expenseDate"]')).toHaveValue("2024-06-15");

  console.log("CODEVALID_TEST_ASSERTION_OK:expense_entry_invalid_negative_amount");
  await recorder.save(testInfo);
});
