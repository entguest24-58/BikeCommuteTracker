import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupUnauthenticatedSession, mockApiHealthFlakySequence } from "../../helpers/mock-api.js";

test("User click on Retry triggers a new API health polling sequence", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("api_retry_triggers_new_polling_cycle", "User click on Retry triggers a new API health polling sequence");

  await recorder.step("Set unauthenticated session and mock timeout then pending retry cycle", async () => {
    await setupUnauthenticatedSession(page);
    await mockApiHealthFlakySequence(page, {
      sequence: Array.from({ length: 20 }, () => ({ type: "connection-refused" })),
      defaultMode: "pending",
    });
  });

  await recorder.step("Launch application", async () => {
    await page.goto("/");
  });

  await recorder.step("Wait for timeout error and click Retry", async () => {
    await expect(page.getByRole("heading", { name: "Unable to connect to BikeTracking API" })).toBeVisible({ timeout: 15000 });
    await page.getByRole("button", { name: "Retry" }).click();
  });

  await recorder.step("Verify a new polling cycle begins", async () => {
    await expect(page.getByRole("status", { name: "Connecting to BikeTracking API…" })).toBeVisible();
    await expect(page.getByText("Connecting…")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Unable to connect to BikeTracking API" })).not.toBeVisible();
    await expect.poll(async () => page.evaluate(() => window.__cvHealthRequestCount ?? 0)).toBeGreaterThan(20);
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:api_retry_triggers_new_polling_cycle");
  await recorder.save(testInfo);
});
