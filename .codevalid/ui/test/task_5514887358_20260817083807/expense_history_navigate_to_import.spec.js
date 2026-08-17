import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import {
  setupAuthenticatedSession,
  mockExpenseHistoryScenario,
  mockExpenseImportPageScenario,
} from "../../helpers/mock-api.js";

test("User can navigate from expense history to CSV import page", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "expense_history_navigate_to_import",
    testTitle: testInfo.title,
  });

  await recorder.step("Set up authenticated rider and page mocks", async () => {
    await setupAuthenticatedSession(page);
    await mockExpenseHistoryScenario(page, { expenses: [] });
    await mockExpenseImportPageScenario(page);
  });

  await recorder.step("Open expense history", async () => {
    await page.goto('/expenses/history');
  });

  await recorder.step("Click Import Expenses link", async () => {
    await page.getByRole('link', { name: 'Import Expenses' }).click();
  });

  await recorder.step("Assert import page is displayed", async () => {
    await expect(page).toHaveURL(/\/expenses\/import$/);
    await expect(page.getByRole('heading', { name: 'Import Expenses' })).toBeVisible();
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:expense_history_navigate_to_import");
  await recorder.save(testInfo);
});
