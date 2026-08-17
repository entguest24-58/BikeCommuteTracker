import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupUnauthenticatedSession } from "../../helpers/mock-api.js";

test("api_startup_retry_after_success_does_not_retrigger: Retry button is not shown if API becomes healthy before timeout", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder(
    "api_startup_retry_after_success_does_not_retrigger",
    "Retry button is not shown if API becomes healthy before timeout"
  );

  let healthCallCount = 0;

  await setupUnauthenticatedSession(page);

  recorder.recordStep("Mock /health to become healthy before the 10 second timeout expires.");
  await page.route("**/health", async (route) => {
    healthCallCount += 1;

    if (healthCallCount <= 6) {
      await route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({ message: "Starting" }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ status: "ok" }),
    });
  });

  recorder.recordStep("Open the application.");
  await page.goto("/");

  recorder.recordStep("Wait for login to appear and confirm no retry UI is shown.");
  await expect(page.getByRole("heading", { name: "Log in" })).toBeVisible({ timeout: 5000 });
  await expect(page.getByText("Connecting…")).not.toBeVisible();
  await expect(page.getByRole("button", { name: "Retry" })).not.toBeVisible();
  await expect(page.getByRole("heading", { name: "Unable to connect to BikeTracking API" })).not.toBeVisible();

  recorder.recordStep("Wait beyond the original timeout window and confirm the error state never appears.");
  await page.waitForTimeout(6000);
  await expect(page.getByRole("heading", { name: "Log in" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Retry" })).not.toBeVisible();

  console.log("CODEVALID_TEST_ASSERTION_OK:api_startup_retry_after_success_does_not_retrigger");
  await recorder.save(testInfo);
});
