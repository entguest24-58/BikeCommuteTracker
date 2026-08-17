import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupAuthenticatedSession, setupExpenseApis } from "../../helpers/mock-api.js";
import { expenseWithoutReceipt } from "../../mock/mock-data.js";

test("Valid expense with date and amount, no receipt", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("expense_entry_valid_input_no_receipt", "Valid expense with date and amount, no receipt");

  await recorder.step("Seed authenticated session and expense mocks");
  await setupAuthenticatedSession(page);
  await setupExpenseApis(page, {
    initialExpenses: [],
    createdExpenses: [expenseWithoutReceipt],
  });

  await recorder.step("Open expense entry page");
  await page.goto("/expenses/entry");
  await expect(page.getByRole("heading", { name: "Record Expense" })).toBeVisible();

  await recorder.step("Fill valid date and amount and submit without receipt");
  await page.locator('[name="expenseDate"]').fill("2024-06-15");
  await page.locator('[name="amount"]').fill("25.50");
  await page.locator('[name="note"]').fill("");
  await page.getByRole("button", { name: "Record Expense" }).click();

  await recorder.step("Assert successful save message and no validation errors");
  await expect(page.getByText("Expense recorded successfully")).toBeVisible();
  await expect(page.getByText("Expense date is required")).toHaveCount(0);
  await expect(page.getByText("Amount must be greater than zero")).toHaveCount(0);

  await recorder.step("Open history and verify new expense is visible without receipt indicator");
  await page.goto("/expenses/history");
  await expect(page.getByRole("heading", { name: "Expense History" })).toBeVisible();
  await expect(page.getByText("$25.50")).toBeVisible();
  await expect(page.getByText("No")).toBeVisible();

  console.log("CODEVALID_TEST_ASSERTION_OK:expense_entry_valid_input_no_receipt");
  await recorder.save(testInfo);
});
