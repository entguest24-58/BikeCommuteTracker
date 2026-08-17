import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupUnauthenticatedSession } from "../../helpers/mock-api.js";

test("api_startup_retry_resets_polling: Retry button re-initiates health polling from the beginning", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder(
    "api_startup_retry_resets_polling",
    "Retry button re-initiates health polling from the beginning"
  );

  let healthCallCount = 0;

  await setupUnauthenticatedSession(page);

  recorder.recordStep("Mock /health to fail continuously so the timeout and retry cycle can be observed.");
  await page.route("**/health", async (route) => {
    healthCallCount += 1;
    await route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ message: "Unavailable" }),
    });
  });

  recorder.recordStep("Open the application and wait for the initial timeout error.");
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Unable to connect to BikeTracking API" })).toBeVisible({ timeout: 12000 });
  const callsBeforeRetry = healthCallCount;

  recorder.recordStep("Click Retry and verify the connecting state returns immediately.");
  await page.getByRole("button", { name: "Retry" }).click();
  await expect(page.getByText("Connecting…")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Unable to connect to BikeTracking API" })).not.toBeVisible();

  recorder.recordStep("Verify a new series of health requests begins after retry.");
  await expect.poll(() => healthCallCount).toBeGreaterThan(callsBeforeRetry);

  recorder.recordStep("Wait for the retry cycle to expire again.");
  await expect(page.getByRole("heading", { name: "Unable to connect to BikeTracking API" })).toBeVisible({ timeout: 12000 });
  await expect(page.getByRole("button", { name: "Retry" })).toBeVisible();

  console.log("CODEVALID_TEST_ASSERTION_OK:api_startup_retry_resets_polling");
  await recorder.save(testInfo);
});
