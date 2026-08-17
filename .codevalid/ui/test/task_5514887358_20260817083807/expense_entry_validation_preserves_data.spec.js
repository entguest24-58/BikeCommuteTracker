import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupAuthenticatedSession } from "../../helpers/mock-api.js";

test("Form data is preserved across validation failures", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "expense_entry_validation_preserves_data",
    testTitle: testInfo.title,
  });

  await recorder.step("Seed authenticated session", async () => {
    await setupAuthenticatedSession(page);
  });

  await recorder.step("Open page and enter invalid submission with receipt", async () => {
    await page.goto("/expenses/entry");
    await page.locator('[name="amount"]').fill("30.00");
    await page.locator('[name="note"]').fill("Bike tune-up");
    await page.locator('[name="receipt"]').setInputFiles({
      name: "receipt.png",
      mimeType: "image/png",
      buffer: Buffer.from("png"),
    });
  });

  await recorder.step("Submit without date and verify preserved values", async () => {
    await page.getByRole("button", { name: "Record Expense" }).click();
    await expect(page.getByText("Expense date is required")).toBeVisible();
    await expect(page.locator('[name="expenseDate"]')).toHaveValue("");
    await expect(page.locator('[name="amount"]')).toHaveValue("30.00");
    await expect(page.locator('[name="note"]')).toHaveValue("Bike tune-up");
    await expect(page.locator('[name="receipt"]')).toHaveValue(/receipt\.png$/);
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:expense_entry_validation_preserves_data");
  await recorder.save(testInfo);
});
