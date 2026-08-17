import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupUnauthenticatedSession, mockApiHealthPending } from "../../helpers/mock-api.js";

test("Polling stops when ApiStartupGuard unmounts", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("component_unmount_stops_polling", "Polling stops when ApiStartupGuard unmounts");

  await recorder.step("Prepare unauthenticated session and long-running health request", async () => {
    await setupUnauthenticatedSession(page);
    await mockApiHealthPending(page, { recordAbort: true });
  });

  await recorder.step("Launch application and confirm spinner", async () => {
    await page.goto("/");
    await expect(page.getByText("Connecting…")).toBeVisible();
  });

  await recorder.step("Unmount startup guard subtree", async () => {
    await page.evaluate(() => {
      const status = document.querySelector('[role="status"]');
      status?.parentElement?.remove();
    });
  });

  await recorder.step("Verify polling stops and abort is observed", async () => {
    await expect.poll(async () => page.evaluate(() => window.__cvHealthAbortCount ?? 0)).toBeGreaterThan(0);
    const countAfterUnmount = await page.evaluate(() => window.__cvHealthRequestCount ?? 0);
    await page.waitForTimeout(1200);
    const countLater = await page.evaluate(() => window.__cvHealthRequestCount ?? 0);
    expect(countLater).toBe(countAfterUnmount);
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:component_unmount_stops_polling");
  await recorder.save(testInfo);
});
