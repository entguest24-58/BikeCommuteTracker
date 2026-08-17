import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupRepoAppReady, setupUnauthenticatedSession } from "../../helpers/mock-api.js";

test("Unauthenticated user attempting to access /dashboard is automatically redirected to /login", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("unauthenticated_access_to_dashboard_redirects_to_login", "Unauthenticated user attempting to access /dashboard is automatically redirected to /login");

  await recorder.step("Mock startup and ensure no active auth session exists");
  await setupRepoAppReady(page);
  await setupUnauthenticatedSession(page);

  await recorder.step("Navigate directly to the protected dashboard route");
  await page.goto("/dashboard");

  await recorder.step("Verify redirect to login before dashboard content is shown");
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: "Log in" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Your riding story, one screen." })).toHaveCount(0);

  console.log("CODEVALID_TEST_ASSERTION_OK:unauthenticated_access_to_dashboard_redirects_to_login");
  await recorder.save(testInfo);
});
