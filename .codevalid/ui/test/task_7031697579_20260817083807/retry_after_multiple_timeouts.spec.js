import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupUnauthenticatedSession, mockApiHealthFailure } from "../../helpers/mock-api.js";

test("Retry can be used repeatedly after consecutive timeouts", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("retry_after_multiple_timeouts", "Retry can be used repeatedly after consecutive timeouts");

  await recorder.step("Set unauthenticated session and keep /health unreachable", async () => {
    await setupUnauthenticatedSession(page);
    await mockApiHealthFailure(page, { type: "connection-refused" });
  });

  await recorder.step("Launch application", async () => {
    await page.goto("/");
  });

  await recorder.step("Wait for first timeout and retry", async () => {
    await expect(page.getByRole("heading", { name: "Unable to connect to BikeTracking API" })).toBeVisible({ timeout: 15000 });
    await page.getByRole("button", { name: "Retry" }).click();
    await expect(page.getByText("Connecting…")).toBeVisible();
  });

  await recorder.step("Wait for second timeout and retry again", async () => {
    await expect(page.getByRole("heading", { name: "Unable to connect to BikeTracking API" })).toBeVisible({ timeout: 15000 });
    await page.getByRole("button", { name: "Retry" }).click();
    await expect(page.getByText("Connecting…")).toBeVisible();
  });

  await recorder.step("Verify retry remains functional after multiple failures", async () => {
    await expect(page.getByRole("button", { name: "Retry" })).not.toBeVisible();
    await expect.poll(async () => page.evaluate(() => window.__cvHealthRequestCount ?? 0)).toBeGreaterThan(40);
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:retry_after_multiple_timeouts");
  await recorder.save(testInfo);
});
