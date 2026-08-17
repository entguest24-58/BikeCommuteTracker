import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupUnauthenticatedSession, mockApiHealthSuccess } from "../../helpers/mock-api.js";

test("App transitions to login page when API becomes healthy", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("api_startup_success_transition", "App transitions to login page when API becomes healthy");

  await recorder.step("Set unauthenticated session and mock healthy API startup", async () => {
    await setupUnauthenticatedSession(page);
    await mockApiHealthSuccess(page);
  });

  await recorder.step("Launch application", async () => {
    await page.goto("/");
  });

  await recorder.step("Wait for startup guard to transition to login page", async () => {
    await expect(page.getByRole("heading", { name: "Log in" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Commute Bike Tracker" })).toBeVisible();
    await expect(page.getByText("Connecting…")).not.toBeVisible();
    await expect(page.getByRole("heading", { name: "Unable to connect to BikeTracking API" })).not.toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:api_startup_success_transition");
  await recorder.save(testInfo);
});
