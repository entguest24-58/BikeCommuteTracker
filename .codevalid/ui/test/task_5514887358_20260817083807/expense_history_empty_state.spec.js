import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import {
  setupAuthenticatedSession,
  mockExpenseHistoryScenario,
} from "../../helpers/mock-api.js";

test("Empty state is displayed when no expenses exist", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "expense_history_empty_state",
    testTitle: testInfo.title,
  });

  await recorder.step("Set up authenticated rider with empty expense history", async () => {
    await setupAuthenticatedSession(page);
    await mockExpenseHistoryScenario(page, { expenses: [] });
  });

  await recorder.step("Load the ExpenseHistoryPage", async () => {
    await page.goto("/expenses/history");
  });

  await recorder.step("Assert empty state and no expense rows", async () => {
    await expect(page.getByRole("heading", { name: "Expense History" })).toBeVisible();
    await expect(page.getByText("No expenses found.")).toBeVisible();
    await expect(page.getByRole("row")).toHaveCount(1);
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:expense_history_empty_state");
  await recorder.save(testInfo);
});
