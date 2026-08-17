import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupUnauthenticatedSession, mockLocalIdentitySequentialIdentifyResponses, mockProtectedUserSettingsAuthorized, clearBikeTrackingSession } from "../../helpers/mock-api.js";

test("Progressive retry delay resets after successful login", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "login_retry_reset_on_success",
    testTitle: "Progressive retry delay resets after successful login",
  });

  await recorder.step("setup identify sequence with throttles, success, then fresh failure", async () => {
    await setupUnauthenticatedSession(page);
    await mockProtectedUserSettingsAuthorized(page);
    await mockLocalIdentitySequentialIdentifyResponses(page, [
      { status: 429, body: { code: "throttled", message: "Too many attempts.", retryAfterSeconds: 2 }, headers: { "Retry-After": "2" } },
      { status: 429, body: { code: "throttled", message: "Too many attempts.", retryAfterSeconds: 8 }, headers: { "Retry-After": "8" } },
      { status: 429, body: { code: "throttled", message: "Too many attempts.", retryAfterSeconds: 30 }, headers: { "Retry-After": "30" } },
      { status: 200, body: { userId: 101, userName: "alex", authorized: true } },
      { status: 401, body: { code: "unauthorized", message: "Name or PIN is incorrect." } },
    ]);
  });

  await recorder.step("open login page and produce delayed state", async () => {
    await page.goto("/login");
    await page.locator("#login-name").fill("alex");
    await page.locator("#login-pin").fill("9999");
    await page.getByRole("button", { name: "Log in" }).click();
    await expect(page.getByText("Too many attempts. Try again in 2 seconds.")).toBeVisible();
    await page.getByRole("button", { name: "Log in" }).click();
    await expect(page.getByText("Too many attempts. Try again in 8 seconds.")).toBeVisible();
    await page.getByRole("button", { name: "Log in" }).click();
    await expect(page.getByText("Too many attempts. Try again in 30 seconds.")).toBeVisible();
  });

  await recorder.step("successfully log in", async () => {
    await page.locator("#login-pin").fill("1234");
    await page.getByRole("button", { name: "Log in" }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByRole("heading", { name: "Your riding story, one screen." })).toBeVisible();
  });

  await recorder.step("clear session and verify next failure has no throttle delay message", async () => {
    await clearBikeTrackingSession(page);
    await page.goto("/login");
    await page.locator("#login-name").fill("alex");
    await page.locator("#login-pin").fill("9999");
    await page.getByRole("button", { name: "Log in" }).click();
    await expect(page.getByText("Name or PIN is incorrect.")).toBeVisible();
    await expect(page.getByText(/Too many attempts\. Try again in/i)).toHaveCount(0);
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:login_retry_reset_on_success");
  await recorder.save(testInfo);
});
