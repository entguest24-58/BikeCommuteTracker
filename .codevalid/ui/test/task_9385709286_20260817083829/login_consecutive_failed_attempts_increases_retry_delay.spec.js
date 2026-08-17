import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import {
  setupRepoAppReady,
  setupUnauthenticatedSession,
  mockIdentifyThrottleSequence,
} from "../../helpers/mock-api.js";

test("Consecutive failed login attempts trigger progressive retry delays up to 30 seconds", async ({ page }, testInfo) => {
  test.setTimeout(70000);
  const recorder = new ExecutionRecorder("login_consecutive_failed_attempts_increases_retry_delay", "Consecutive failed login attempts trigger progressive retry delays up to 30 seconds");
  const delays = [1000, 5000, 15000, 30000];

  await recorder.step("Mock API startup and progressive throttled identify responses");
  await setupRepoAppReady(page);
  await setupUnauthenticatedSession(page);
  await mockIdentifyThrottleSequence(page, { delaysMs: delays, retryAfterSeconds: [1, 5, 15, 30] });

  await recorder.step("Open the login page");
  await page.goto("/login");
  await page.locator("#login-name").fill("BobSmith");

  const observed = [];
  for (let index = 0; index < delays.length; index += 1) {
    await recorder.step(`Submit failed attempt ${index + 1}`);
    await page.locator("#login-pin").fill("0000");
    const startedAt = Date.now();
    await page.getByRole("button", { name: "Log in" }).click();
    const message = page.getByText(new RegExp(`Too many attempts\\. Try again in ${[1, 5, 15, 30][index]} seconds\\.`));
    await expect(message).toBeVisible();
    observed.push(Date.now() - startedAt);
  }

  await recorder.step("Verify each observed delay increases and reaches roughly 30 seconds on the fourth failure");
  expect(observed[0]).toBeGreaterThanOrEqual(900);
  expect(observed[1]).toBeGreaterThanOrEqual(4800);
  expect(observed[2]).toBeGreaterThanOrEqual(14800);
  expect(observed[3]).toBeGreaterThanOrEqual(29800);
  expect(observed[1]).toBeGreaterThan(observed[0]);
  expect(observed[2]).toBeGreaterThan(observed[1]);
  expect(observed[3]).toBeGreaterThan(observed[2]);
  await expect(page).toHaveURL(/\/login$/);

  console.log("CODEVALID_TEST_ASSERTION_OK:login_consecutive_failed_attempts_increases_retry_delay");
  await recorder.save(testInfo);
});
