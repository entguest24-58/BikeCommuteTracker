import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import {
  setupUnauthenticatedSession,
  mockLocalIdentityLoginSuccess,
  mockProtectedAppShell,
} from "../../helpers/mock-api.js";

test("Authenticated session is preserved across protected page navigation", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("login_session_persists_across_navigation", test.info().title);

  await recorder.step("Prepare unauthenticated browser session and successful login mocks");
  await setupUnauthenticatedSession(page);
  await mockLocalIdentityLoginSuccess(page, {
    user: { userId: 1, userName: "Alice" },
  });
  await mockProtectedAppShell(page);

  await recorder.step("Open login page and authenticate");
  await page.goto("/login");
  await page.locator("#login-name").fill("Alice");
  await page.locator("#login-pin").fill("1234");
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);

  await recorder.step("Navigate to settings and confirm still authenticated");
  await page.goto("/settings");
  await expect(page).toHaveURL(/\/settings$/);
  await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();

  await recorder.step("Navigate to advanced dashboard and confirm still authenticated");
  await page.goto("/dashboard/advanced");
  await expect(page).toHaveURL(/\/dashboard\/advanced$/);
  await expect(page.getByRole("heading", { name: "Savings Breakdown" })).toBeVisible();

  await recorder.step("Return to dashboard and confirm protected content remains visible");
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("heading", { name: "Your riding story, one screen." })).toBeVisible();

  console.log("CODEVALID_TEST_ASSERTION_OK:login_session_persists_across_navigation");
  await recorder.save(testInfo);
});
