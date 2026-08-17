import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupUnauthenticatedSession, mockLocalIdentitySequentialIdentifyResponses } from "../../helpers/mock-api.js";

test("Progressive retry delay increases after consecutive failed logins", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "login_progressive_retry_delay",
    testTitle: "Progressive retry delay increases after consecutive failed logins",
  });

  await recorder.step("setup sequential throttle responses", async () => {
    await setupUnauthenticatedSession(page);
    await mockLocalIdentitySequentialIdentifyResponses(page, [
      { status: 401, body: { code: "unauthorized", message: "Name or PIN is incorrect." } },
      { status: 429, body: { code: "throttled", message: "Too many attempts.", retryAfterSeconds: 2 }, headers: { "Retry-After": "2" } },
      { status: 429, body: { code: "throttled", message: "Too many attempts.", retryAfterSeconds: 8 }, headers: { "Retry-After": "8" } },
      { status: 429, body: { code: "throttled", message: "Too many attempts.", retryAfterSeconds: 30 }, headers: { "Retry-After": "30" } },
    ]);
  });

  await recorder.step("open login page", async () => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "Log in" })).toBeVisible();
  });

  await recorder.step("attempt 1 incorrect login", async () => {
    await page.locator("#login-name").fill("alex");
    await page.locator("#login-pin").fill("9999");
    await page.getByRole("button", { name: "Log in" }).click();
    await expect(page.getByText("Name or PIN is incorrect.")).toBeVisible();
  });

  await recorder.step("attempt 2 shows 2 second throttle message", async () => {
    await page.getByRole("button", { name: "Log in" }).click();
    await expect(page.getByText("Too many attempts. Try again in 2 seconds.")).toBeVisible();
  });

  await recorder.step("attempt 3 shows 8 second throttle message", async () => {
    await page.getByRole("button", { name: "Log in" }).click();
    await expect(page.getByText("Too many attempts. Try again in 8 seconds.")).toBeVisible();
  });

  await recorder.step("attempt 4 shows 30 second throttle message", async () => {
    await page.getByRole("button", { name: "Log in" }).click();
    await expect(page.getByText("Too many attempts. Try again in 30 seconds.")).toBeVisible();
    await expect(page.locator("#login-name")).toHaveValue("alex");
    await expect(page.locator("#login-pin")).toHaveValue("9999");
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:login_progressive_retry_delay");
  await recorder.save(testInfo);
});
