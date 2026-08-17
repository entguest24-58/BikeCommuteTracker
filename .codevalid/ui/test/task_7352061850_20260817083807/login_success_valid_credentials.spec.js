import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import {
  setupUnauthenticatedSession,
  mockLocalIdentityLoginSuccess,
  mockProtectedAppShell,
} from "../../helpers/mock-api.js";

test("Successful login with valid name and PIN redirects to dashboard", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("login_success_valid_credentials", test.info().title);

  await recorder.step("Prepare unauthenticated browser session and login success mocks");
  await setupUnauthenticatedSession(page);
  await mockLocalIdentityLoginSuccess(page, {
    user: { userId: 1, userName: "Alice" },
  });
  await mockProtectedAppShell(page);

  await recorder.step("Open the login page");
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Log in" })).toBeVisible();

  await recorder.step("Enter valid rider name");
  await page.locator("#login-name").fill("Alice");

  await recorder.step("Enter valid PIN");
  await page.locator("#login-pin").fill("1234");

  await recorder.step("Submit the login form");
  await page.getByRole("button", { name: "Log in" }).click();

  await recorder.step("Verify redirect to dashboard and authenticated session");
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("heading", { name: "Your riding story, one screen." })).toBeVisible();

  await recorder.step("Navigate to settings and confirm session persists");
  await page.goto("/settings");
  await expect(page).toHaveURL(/\/settings$/);
  await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();

  await recorder.step("Navigate to advanced dashboard and confirm session persists");
  await page.goto("/dashboard/advanced");
  await expect(page).toHaveURL(/\/dashboard\/advanced$/);
  await expect(page.getByRole("heading", { name: "Savings Breakdown" })).toBeVisible();

  console.log("CODEVALID_TEST_ASSERTION_OK:login_success_valid_credentials");
  await recorder.save(testInfo);
});
