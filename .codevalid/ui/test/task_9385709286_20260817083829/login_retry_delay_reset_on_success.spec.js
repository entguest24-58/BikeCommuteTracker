import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import {
  setupRepoAppReady,
  setupUnauthenticatedSession,
  clearAuthSession,
  mockIdentifyThrottleThenSuccessThenThrottle,
  mockDashboardSuccess,
} from "../../helpers/mock-api.js";

test("Retry delay is reset to zero after a successful login", async ({ page }, testInfo) => {
  test.setTimeout(45000);
  const recorder = new ExecutionRecorder("login_retry_delay_reset_on_success", "Retry delay is reset to zero after a successful login");

  await recorder.step("Mock startup, repeated throttled failures, success, and a reset throttled failure");
  await setupRepoAppReady(page);
  await setupUnauthenticatedSession(page);
  await mockIdentifyThrottleThenSuccessThenThrottle(page, {
    beforeSuccessDelaysMs: [1000, 5000, 15000, 30000],
    resetDelayMs: 1000,
    successSession: { userId: 202, userName: "AliceLee", authorized: true },
  });
  await mockDashboardSuccess(page);

  await recorder.step("Open the login page");
  await page.goto("/login");
  await page.locator("#login-name").fill("AliceLee");

  for (const seconds of [1, 5, 15, 30]) {
    await recorder.step(`Trigger throttled failure with ${seconds}s retry message`);
    await page.locator("#login-pin").fill("2222");
    await page.getByRole("button", { name: "Log in" }).click();
    await expect(page.getByText(`Too many attempts. Try again in ${seconds} seconds.`)).toBeVisible();
  }

  await recorder.step("Log in successfully with the correct PIN");
  await page.locator("#login-pin").fill("1111");
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("heading", { name: "Your riding story, one screen." })).toBeVisible();

  await recorder.step("Clear the active browser session to simulate logout or session end");
  await clearAuthSession(page);

  await recorder.step("Return to login and verify the next failure is back to the initial short delay");
  await page.goto("/login");
  await page.locator("#login-name").fill("AliceLee");
  await page.locator("#login-pin").fill("2222");
  const startedAt = Date.now();
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page.getByText("Too many attempts. Try again in 1 seconds.")).toBeVisible();
  const elapsed = Date.now() - startedAt;
  expect(elapsed).toBeGreaterThanOrEqual(900);
  expect(elapsed).toBeLessThan(3000);
  await expect(page).toHaveURL(/\/login$/);

  console.log("CODEVALID_TEST_ASSERTION_OK:login_retry_delay_reset_on_success");
  await recorder.save(testInfo);
});
