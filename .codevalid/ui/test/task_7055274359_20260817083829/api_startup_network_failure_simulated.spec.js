import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupUnauthenticatedSession } from "../../helpers/mock-api.js";

test("api_startup_network_failure_simulated: Error state displayed when network connection is blocked during polling", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder(
    "api_startup_network_failure_simulated",
    "Error state displayed when network connection is blocked during polling"
  );

  let healthCallCount = 0;

  await setupUnauthenticatedSession(page);

  recorder.recordStep("Mock the first health response as successful and all later launches as blocked network failures.");
  await page.route("**/health", async (route) => {
    healthCallCount += 1;

    if (healthCallCount === 1) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ status: "ok" }),
      });
      return;
    }

    await route.abort("failed");
  });

  recorder.recordStep("Open the application and verify the initial health check succeeds.");
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Log in" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Retry" })).not.toBeVisible();

  recorder.recordStep("Simulate a fresh application launch after connectivity is blocked.");
  await page.goto("/signup");
  await page.reload();

  recorder.recordStep("Verify the startup guard eventually falls into the error state with Retry.");
  await expect(page.getByRole("heading", { name: "Unable to connect to BikeTracking API" })).toBeVisible({ timeout: 12000 });
  await expect(page.getByRole("button", { name: "Retry" })).toBeVisible();

  console.log("CODEVALID_TEST_ASSERTION_OK:api_startup_network_failure_simulated");
  await recorder.save(testInfo);
});
