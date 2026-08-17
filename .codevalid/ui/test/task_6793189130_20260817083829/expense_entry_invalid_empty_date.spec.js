import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupAuthenticatedSession, setupExpenseApis } from "../../helpers/mock-api.js";

test("Expense fails validation with empty date", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("expense_entry_invalid_empty_date", "Expense fails validation with empty date");

  await recorder.step("Seed authenticated session and expense mocks");
  await setupAuthenticatedSession(page);
  await setupExpenseApis(page);

  await recorder.step("Open expense entry page");
  await page.goto("/expenses/entry");

  await recorder.step("Leave date empty, fill amount and note, then submit");
  await page.locator('[name="amount"]').fill("30.00");
  await page.locator('[name="note"]').fill("Lube");
  await page.getByRole("button", { name: "Record Expense" }).click();

  await recorder.step("Assert date validation message and preserved entered values");
  await expect(page.getByText("Expense date is required")).toBeVisible();
  await expect(page.locator('[name="expenseDate"]')).toHaveValue("");
  await expect(page.locator('[name="amount"]')).toHaveValue("30.00");
  await expect(page.locator('[name="note"]')).toHaveValue("Lube");

  console.log("CODEVALID_TEST_ASSERTION_OK:expense_entry_invalid_empty_date");
  await recorder.save(testInfo);
});
