import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupUnauthenticatedSession } from "../../helpers/mock-api.js";

test("api_startup_connecting_spinner_displayed: Connecting spinner is displayed during API health polling", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder(
    "api_startup_connecting_spinner_displayed",
    "Connecting spinner is displayed during API health polling"
  );

  await setupUnauthenticatedSession(page);

  recorder.recordStep("Register a never-resolving health route so the startup guard remains in the connecting state.");
  await page.route("**/health", async () => {
    await new Promise(() => {});
  });

  recorder.recordStep("Open the application.");
  await page.goto("/");

  recorder.recordStep("Verify the connecting spinner is visible and login or error UI is not rendered.");
  await expect(page.getByRole("status", { name: "Connecting to BikeTracking API…" })).toBeVisible();
  await expect(page.getByText("Connecting…")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Log in" })).not.toBeVisible();
  await expect(page.getByRole("heading", { name: "Commute Bike Tracker" })).not.toBeVisible();
  await expect(page.getByRole("heading", { name: "Unable to connect to BikeTracking API" })).not.toBeVisible();

  console.log("CODEVALID_TEST_ASSERTION_OK:api_startup_connecting_spinner_displayed");
  await recorder.save(testInfo);
});
