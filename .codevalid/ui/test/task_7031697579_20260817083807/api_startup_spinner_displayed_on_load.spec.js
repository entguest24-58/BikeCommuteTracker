import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupUnauthenticatedSession, mockApiHealthPending } from "../../helpers/mock-api.js";

test("Connecting spinner is displayed during API startup", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("api_startup_spinner_displayed_on_load", "Connecting spinner is displayed during API startup");

  await recorder.step("Set unauthenticated session and keep /health pending", async () => {
    await setupUnauthenticatedSession(page);
    await mockApiHealthPending(page);
  });

  await recorder.step("Launch application", async () => {
    await page.goto("/");
  });

  await recorder.step("Verify connecting UI is visible and app pages are hidden", async () => {
    await expect(page.getByRole("status", { name: "Connecting to BikeTracking API…" })).toBeVisible();
    await expect(page.getByText("Connecting…")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Log in" })).not.toBeVisible();
    await expect(page.getByRole("heading", { name: "Unable to connect to BikeTracking API" })).not.toBeVisible();
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:api_startup_spinner_displayed_on_load");
  await recorder.save(testInfo);
});
