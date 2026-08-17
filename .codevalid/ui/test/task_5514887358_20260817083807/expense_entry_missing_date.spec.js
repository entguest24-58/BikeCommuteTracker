import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupAuthenticatedSession } from "../../helpers/mock-api.js";

test("Expense entry fails with error when date is missing", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "expense_entry_missing_date",
    testTitle: testInfo.title,
  });

  await recorder.step("Seed authenticated session", async () => {
    await setupAuthenticatedSession(page);
  });

  await recorder.step("Open expense entry page", async () => {
    await page.goto("/expenses/entry");
    await expect(page.getByRole("heading", { name: "Record Expense" })).toBeVisible();
  });

  await recorder.step("Fill valid amount and note without date", async () => {
    await page.locator('[name="amount"]').fill("25.00");
    await page.locator('[name="note"]').fill("Brake pads");
  });

  await recorder.step("Submit and verify validation with preserved data", async () => {
    await page.getByRole("button", { name: "Record Expense" }).click();
    await expect(page.getByText("Expense date is required")).toBeVisible();
    await expect(page.locator('[name="expenseDate"]')).toHaveValue("");
    await expect(page.locator('[name="amount"]')).toHaveValue("25.00");
    await expect(page.locator('[name="note"]')).toHaveValue("Brake pads");
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:expense_entry_missing_date");
  await recorder.save(testInfo);
});
