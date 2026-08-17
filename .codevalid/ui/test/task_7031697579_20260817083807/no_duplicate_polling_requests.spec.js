import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupUnauthenticatedSession, mockApiHealthPending } from "../../helpers/mock-api.js";

test("No duplicate health requests are sent during active polling", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("no_duplicate_polling_requests", "No duplicate health requests are sent during active polling");

  await recorder.step("Prepare unauthenticated session and slow unresolved /health handler", async () => {
    await setupUnauthenticatedSession(page);
    await mockApiHealthPending(page, { trackConcurrency: true });
  });

  await recorder.step("Launch application", async () => {
    await page.goto("/");
    await expect(page.getByText("Connecting…")).toBeVisible();
  });

  await recorder.step("Observe in-flight request concurrency", async () => {
    await page.waitForTimeout(2000);
    const maxConcurrent = await page.evaluate(() => window.__cvHealthMaxConcurrent ?? 0);
    expect(maxConcurrent).toBe(1);
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:no_duplicate_polling_requests");
  await recorder.save(testInfo);
});
