import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupUnauthenticatedSession, setupExpenseApis } from "../../helpers/mock-api.js";

test("Unauthenticated user redirected from expense entry page", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("expense_entry_auth_redirect", "Unauthenticated user redirected from expense entry page");

  await recorder.step("Seed unauthenticated browser session");
  await setupUnauthenticatedSession(page);
  await setupExpenseApis(page);

  await recorder.step("Navigate directly to the protected expense entry route");
  await page.goto("/expenses/entry");

  await recorder.step("Assert redirect to login and absence of expense entry heading");
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: "Log in" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Record Expense" })).toHaveCount(0);

  console.log("CODEVALID_TEST_ASSERTION_OK:expense_entry_auth_redirect");
  await recorder.save(testInfo);
});
