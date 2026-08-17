import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupUnauthenticatedSession, mockLocalIdentityLoginSuccess, mockProtectedUserSettingsAuthorized } from "../../helpers/mock-api.js";

test("Valid name and PIN authenticate user and redirect to dashboard", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "login_valid_credentials_authenticates_and_redirects",
    testTitle: "Valid name and PIN authenticate user and redirect to dashboard",
  });

  await recorder.step("setup login success and protected settings mocks", async () => {
    await setupUnauthenticatedSession(page);
    await mockLocalIdentityLoginSuccess(page, { userId: 101, userName: "alex" });
    await mockProtectedUserSettingsAuthorized(page);
  });

  await recorder.step("open login page", async () => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "Log in" })).toBeVisible();
  });

  await recorder.step("fill valid credentials", async () => {
    await page.locator("#login-name").fill("alex");
    await page.locator("#login-pin").fill("1234");
  });

  await recorder.step("submit login form", async () => {
    await page.getByRole("button", { name: "Log in" }).click();
  });

  await recorder.step("assert redirect to dashboard and preserved session navigation", async () => {
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByRole("heading", { name: "Your riding story, one screen." })).toBeVisible();

    await page.goto("/settings");
    await expect(page).toHaveURL(/\/settings$/);
    await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:login_valid_credentials_authenticates_and_redirects");
  await recorder.save(testInfo);
});
