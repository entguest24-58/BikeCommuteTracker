import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupUnauthenticatedSession } from "../../helpers/mock-api.js";

test("api_startup_timeout_fallback_to_error: Error state with Retry button appears after 10 seconds of failed health checks", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder(
    "api_startup_timeout_fallback_to_error",
    "Error state with Retry button appears after 10 seconds of failed health checks"
  );

  await setupUnauthenticatedSession(page);

  recorder.recordStep("Mock /health to fail for every poll attempt.");
  await page.route("**/health", async (route) => {
    await route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ message: "BikeTracking.Api failed to start" }),
    });
  });

  recorder.recordStep("Open the application.");
  await page.goto("/");

  recorder.recordStep("Wait for the 10 second polling window to expire and verify the error state.");
  await expect(page.getByRole("heading", { name: "Unable to connect to BikeTracking API" })).toBeVisible({ timeout: 12000 });
  await expect(page.getByRole("button", { name: "Retry" })).toBeVisible();
  await expect(page.getByText("The app was unable to start the local API after 10 seconds.")).toBeVisible();
  await expect(page.getByText("Connecting…")).not.toBeVisible();

  console.log("CODEVALID_TEST_ASSERTION_OK:api_startup_timeout_fallback_to_error");
  await recorder.save(testInfo);
});
