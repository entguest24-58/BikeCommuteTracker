import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupUnauthenticatedSession } from "../../helpers/mock-api.js";

test("api_startup_success_after_polling: Application proceeds to login when API becomes healthy", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder(
    "api_startup_success_after_polling",
    "Application proceeds to login when API becomes healthy"
  );

  let healthCallCount = 0;

  await setupUnauthenticatedSession(page);

  recorder.recordStep("Mock /health to fail for roughly 3 seconds and then return success.");
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

  recorder.recordStep("Confirm startup begins in connecting state.");
  await expect(page.getByText("Connecting…")).toBeVisible();

  recorder.recordStep("Wait for the health endpoint to succeed and login UI to render.");
  await expect(page.getByRole("heading", { name: "Log in" })).toBeVisible({ timeout: 5000 });
  await expect(page.getByRole("heading", { name: "Commute Bike Tracker" })).toBeVisible();
  await expect(page.getByText("Connecting…")).not.toBeVisible();
  await expect(page.getByRole("heading", { name: "Unable to connect to BikeTracking API" })).not.toBeVisible();
  await expect(page).toHaveURL(/\/login$/);

  console.log("CODEVALID_TEST_ASSERTION_OK:api_startup_success_after_polling");
  await recorder.save(testInfo);
});
