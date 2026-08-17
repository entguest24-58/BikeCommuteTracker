import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import {
  setupAuthenticatedSession,
  mockBrowserModeCoreFeaturesScenario,
  mockUnsupportedPwaEnvironment,
} from "../../helpers/mock-api.js";

test("System detects unsupported PWA environment and displays clear guidance", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "pwa_unsupported_environment_detection",
    testTitle: "System detects unsupported PWA environment and displays clear guidance",
  });

  await recorder.step("seed authenticated session and unsupported PWA environment", async () => {
    await setupAuthenticatedSession(page);
    await mockUnsupportedPwaEnvironment(page, { reasonCode: "unsupported_browser" });
    await mockBrowserModeCoreFeaturesScenario(page);
  });

  await recorder.step("open settings install section", async () => {
    await page.goto("/settings");
    await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Install App" })).toBeVisible();
  });

  await recorder.step("verify unsupported install guidance is shown and browser mode remains available", async () => {
    await expect(
      page.getByText(
        "Installation is not available in this browser in v1. Use current Chrome or Edge on Windows, or continue using browser mode."
      )
    ).toBeVisible();
    await expect(page.getByText("Current mode: Browser tab")).toBeVisible();
  });

  await recorder.step("verify core flow page remains reachable", async () => {
    await page.goto("/rides/record");
    await expect(page.getByRole("heading", { name: "Record a Ride" })).toBeVisible();
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:pwa_unsupported_environment_detection");
  await recorder.save(testInfo);
});
