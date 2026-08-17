import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import {
  setupUnauthenticatedSession,
  mockExpenseHistoryScenario,
} from "../../helpers/mock-api.js";

test("Unauthenticated user is redirected from expense history page", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "expense_history_authenticated_access",
    testTitle: testInfo.title,
  });

  await recorder.step("Set up unauthenticated session", async () => {
    await setupUnauthenticatedSession(page);
    await mockExpenseHistoryScenario(page);
  });

  await recorder.step("Navigate directly to expense history", async () => {
    await page.goto("/expenses/history");
  });

  await recorder.step("Assert redirect to login and expense history not rendered", async () => {
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole("heading", { name: "Log in" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Expense History" })).toHaveCount(0);
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:expense_history_authenticated_access");
  await recorder.save(testInfo);
});
