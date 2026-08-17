import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupUnauthenticatedSession, mockProtectedAppShell } from "../../helpers/mock-api.js";

test("Unauthenticated access to DashboardPage redirects to LoginPage", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("login_redirects_to_login_from_protected_page", test.info().title);

  await recorder.step("Prepare unauthenticated browser session and protected page shell mocks");
  await setupUnauthenticatedSession(page);
  await mockProtectedAppShell(page);

  await recorder.step("Navigate directly to the protected dashboard route");
  await page.goto("/dashboard");

  await recorder.step("Verify redirect to login and absence of dashboard content");
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: "Log in" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Your riding story, one screen." })).toHaveCount(0);

  console.log("CODEVALID_TEST_ASSERTION_OK:login_redirects_to_login_from_protected_page");
  await recorder.save(testInfo);
});
