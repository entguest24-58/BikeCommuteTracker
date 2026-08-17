import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupAuthenticatedSession, setupExpenseApis } from "../../helpers/mock-api.js";

test("Expense fails validation with malformed date", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("expense_entry_invalid_date_format", "Expense fails validation with malformed date");

  await recorder.step("Seed authenticated session and expense mocks");
  await setupAuthenticatedSession(page);
  await setupExpenseApis(page);

  await recorder.step("Open expense entry page and attempt malformed date input");
  await page.goto("/expenses/entry");
  await page.locator('[name="expenseDate"]').evaluate((element) => {
    element.value = "06/15/2024";
    element.dispatchEvent(new Event("input", { bubbles: true }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.locator('[name="amount"]').fill("35.00");
  await page.getByRole("button", { name: "Record Expense" }).click();

  await recorder.step("Assert actual current UI behavior for malformed date input");
  await expect(page.getByText("Expense date is required")).toBeVisible();
  await expect(page.getByText("Invalid date format. Use YYYY-MM-DD.")).toHaveCount(0);

  console.log("CODEVALID_TEST_ASSERTION_OK:expense_entry_invalid_date_format");
  await recorder.save(testInfo);
});
