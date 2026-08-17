import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupUnauthenticatedSession, mockApiHealthFailure } from "../../helpers/mock-api.js";

test("Error UI is shown when API fails to start within 10 seconds", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("api_startup_timeout_error_shown", "Error UI is shown when API fails to start within 10 seconds");

  await recorder.step("Set unauthenticated session and keep /health unready", async () => {
    await setupUnauthenticatedSession(page);
    await mockApiHealthFailure(page, { type: "connection-refused" });
  });

  await recorder.step("Launch application", async () => {
    await page.goto("/");
  });

  await recorder.step("Wait for 10-second timeout error UI", async () => {
    await expect(page.getByRole("heading", { name: "Unable to connect to BikeTracking API" })).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole("button", { name: "Retry" })).toBeVisible();
    await expect(page.getByText("The app was unable to start the local API after 10 seconds.")).toBeVisible();
    await expect(page.getByText("Connecting…")).not.toBeVisible();
    await expect(page.getByRole("heading", { name: "Log in" })).not.toBeVisible();
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:api_startup_timeout_error_shown");
  await recorder.save(testInfo);
});
