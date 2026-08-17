import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupAuthenticatedSession, setupExpenseApis } from "../../helpers/mock-api.js";

test("Expense fails validation with zero amount", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("expense_entry_invalid_zero_amount", "Expense fails validation with zero amount");

  await recorder.step("Seed authenticated session and expense mocks");
  await setupAuthenticatedSession(page);
  await setupExpenseApis(page);

  await recorder.step("Open expense entry page and enter zero amount");
  await page.goto("/expenses/entry");
  await page.locator('[name="expenseDate"]').fill("2024-06-15");
  await page.locator('[name="amount"]').fill("0");
  await page.getByRole("button", { name: "Record Expense" }).click();

  await recorder.step("Assert zero amount validation error");
  await expect(page.getByText("Amount must be greater than zero")).toBeVisible();

  console.log("CODEVALID_TEST_ASSERTION_OK:expense_entry_invalid_zero_amount");
  await recorder.save(testInfo);
});
