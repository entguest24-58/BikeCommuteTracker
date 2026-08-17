import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import {
  setupAuthenticatedSession,
  mockExpenseHistoryScenario,
} from "../../helpers/mock-api.js";
import {
  expenseWithReceipt,
  expenseWithLongNote,
} from "../../mock/mock-data.js";

test("Expense list displays correct date, amount, note, and receipt indicator", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "expense_list_correctly_rendered",
    testTitle: testInfo.title,
  });

  await recorder.step("Set up authenticated rider with two expenses", async () => {
    await setupAuthenticatedSession(page);
    await mockExpenseHistoryScenario(page, {
      expenses: [expenseWithReceipt, expenseWithLongNote],
    });
  });

  await recorder.step("Load the ExpenseHistoryPage", async () => {
    await page.goto("/expenses/history");
  });

  await recorder.step("Assert both rows render expected values", async () => {
    await expect(page.getByRole("heading", { name: "Expense History" })).toBeVisible();
    await expect(page.getByRole("cell", { name: "2024-05-10" })).toBeVisible();
    await expect(page.getByRole("cell", { name: "$24.99" })).toBeVisible();
    await expect(page.getByRole("cell", { name: "New chain" })).toBeVisible();
    await expect(page.getByRole("link", { name: "View receipt" })).toBeVisible();

    await expect(page.getByRole("cell", { name: "2024-05-05" })).toBeVisible();
    await expect(page.getByRole("cell", { name: "$15.50" })).toBeVisible();
    await expect(page.getByText(expenseWithLongNote.notes)).toBeVisible();
    await expect(page.getByRole("cell", { name: "No" })).toBeVisible();
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:expense_list_correctly_rendered");
  await recorder.save(testInfo);
});
