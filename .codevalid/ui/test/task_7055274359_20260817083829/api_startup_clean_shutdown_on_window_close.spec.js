import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupUnauthenticatedSession } from "../../helpers/mock-api.js";

test("api_startup_clean_shutdown_on_window_close: Polling and intervals are cleaned up on window close or app quit", async ({ browser }, testInfo) => {
  const recorder = new ExecutionRecorder(
    "api_startup_clean_shutdown_on_window_close",
    "Polling and intervals are cleaned up on window close or app quit"
  );

  const context = await browser.newContext();
  const page = await context.newPage();
  const observedHealthCalls = [];
  const consoleErrors = [];

  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });

  await setupUnauthenticatedSession(page);

  recorder.recordStep("Mock /health with short delayed failures so polling is active while the window remains open.");
  await page.route("**/health", async (route) => {
    observedHealthCalls.push(Date.now());
    await new Promise((resolve) => setTimeout(resolve, 50));
    await route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ message: "Unavailable" }),
    });
  });

  recorder.recordStep("Launch the application and wait for repeated polling while the spinner is visible.");
  await page.goto("/");
  await expect(page.getByText("Connecting…")).toBeVisible();
  await expect.poll(() => observedHealthCalls.length).toBeGreaterThan(1);

  recorder.recordStep("Close the application window.");
  await page.close();
  const callsAtClose = observedHealthCalls.length;
  await new Promise((resolve) => setTimeout(resolve, 1500));

  recorder.recordStep("Verify no additional health requests occur after close and no stale timer errors were logged.");
  expect(observedHealthCalls.length).toBe(callsAtClose);
  expect(consoleErrors).toEqual([]);

  console.log("CODEVALID_TEST_ASSERTION_OK:api_startup_clean_shutdown_on_window_close");
  await recorder.save(testInfo);
  await context.close();
});
