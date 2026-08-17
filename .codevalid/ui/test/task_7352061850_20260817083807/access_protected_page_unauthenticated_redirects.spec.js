import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupUnauthenticatedSession } from "../../helpers/mock-api.js";

test("Unauthenticated access to dashboard redirects to login", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "access_protected_page_unauthenticated_redirects",
    testTitle: "Unauthenticated access to dashboard redirects to login",
  });

  await recorder.step("setup unauthenticated session", async () => {
    await setupUnauthenticatedSession(page);
  });

  await recorder.step("navigate directly to dashboard", async () => {
    await page.goto("/dashboard");
  });

  await recorder.step("assert redirect to login", async () => {
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole("heading", { name: "Log in" })).toBeVisible();
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:access_protected_page_unauthenticated_redirects");
  await recorder.save(testInfo);
});
