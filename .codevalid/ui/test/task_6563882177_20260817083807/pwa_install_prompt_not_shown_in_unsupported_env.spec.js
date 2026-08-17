import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import {
  setupAuthenticatedSession,
  mockBrowserModeCoreFeaturesScenario,
  mockUnsupportedPwaEnvironment,
} from "../../helpers/mock-api.js";

test("PWA install prompt is suppressed when environment does not support it", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "pwa_install_prompt_not_shown_in_unsupported_env",
    testTitle: "PWA install prompt is suppressed when environment does not support it",
  });

  await recorder.step("seed authenticated session and unsupported install state", async () => {
    await setupAuthenticatedSession(page);
    await mockUnsupportedPwaEnvironment(page, { reasonCode: "unsupported_browser" });
    await mockBrowserModeCoreFeaturesScenario(page);
  });

  await recorder.step("open settings and observe install section", async () => {
    await page.goto("/settings");
    await expect(page.getByRole("heading", { name: "Install App" })).toBeVisible();
  });

  await recorder.step("verify no install button is rendered in unsupported environment", async () => {
    await expect(page.getByRole("button", { name: "Install on this computer" })).toHaveCount(0);
    await expect(
      page.getByText(
        "Installation is not available in this browser in v1. Use current Chrome or Edge on Windows, or continue using browser mode."
      )
    ).toBeVisible();
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:pwa_install_prompt_not_shown_in_unsupported_env");
  await recorder.save(testInfo);
});
