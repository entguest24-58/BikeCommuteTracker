import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupUnauthenticatedSession } from "../../helpers/mock-api.js";

test("api_startup_multiple_retry_cycles: User can invoke multiple retry cycles until API becomes ready", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder(
    "api_startup_multiple_retry_cycles",
    "User can invoke multiple retry cycles until API becomes ready"
  );

  let healthCallCount = 0;

  await setupUnauthenticatedSession(page);

  recorder.recordStep("Mock /health to fail continuously so repeated retry cycles can be exercised.");
  await page.route("**/health", async (route) => {
    healthCallCount += 1;
    await route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ message: "Unavailable" }),
    });
  });

  recorder.recordStep("Open the application and wait for the first timeout error.");
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Unable to connect to BikeTracking API" })).toBeVisible({ timeout: 12000 });

  recorder.recordStep("Click Retry, wait 3 seconds, and verify the error does not immediately reappear.");
  await page.getByRole("button", { name: "Retry" }).click();
  await expect(page.getByText("Connecting…")).toBeVisible();
  await page.waitForTimeout(3000);
  await expect(page.getByRole("heading", { name: "Unable to connect to BikeTracking API" })).not.toBeVisible();

  recorder.recordStep("Wait for the second timeout, retry again, and verify that timer reset is independent.");
  await expect(page.getByRole("heading", { name: "Unable to connect to BikeTracking API" })).toBeVisible({ timeout: 9000 });
  await page.getByRole("button", { name: "Retry" }).click();
  await expect(page.getByText("Connecting…")).toBeVisible();
  await page.waitForTimeout(3000);
  await expect(page.getByRole("heading", { name: "Unable to connect to BikeTracking API" })).not.toBeVisible();
  const callsAfterSecondRetry = healthCallCount;

  recorder.recordStep("Wait for the third timeout, retry once more, and confirm polling resumes again.");
  await expect(page.getByRole("heading", { name: "Unable to connect to BikeTracking API" })).toBeVisible({ timeout: 9000 });
  await page.getByRole("button", { name: "Retry" }).click();
  await expect(page.getByText("Connecting…")).toBeVisible();
  await expect.poll(() => healthCallCount).toBeGreaterThan(callsAfterSecondRetry);
  await page.waitForTimeout(3000);
  await expect(page.getByRole("heading", { name: "Unable to connect to BikeTracking API" })).not.toBeVisible();

  recorder.recordStep("Confirm the error returns only after the final retry cycle completes its own timeout window.");
  await expect(page.getByRole("heading", { name: "Unable to connect to BikeTracking API" })).toBeVisible({ timeout: 9000 });
  await expect(page.getByRole("button", { name: "Retry" })).toBeVisible();

  console.log("CODEVALID_TEST_ASSERTION_OK:api_startup_multiple_retry_cycles");
  await recorder.save(testInfo);
});
