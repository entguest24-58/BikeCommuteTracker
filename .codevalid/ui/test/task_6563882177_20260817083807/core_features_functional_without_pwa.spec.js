import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import {
  setupAuthenticatedSession,
  mockBrowserModeCoreFeaturesScenario,
  mockUnsupportedPwaEnvironment,
} from "../../helpers/mock-api.js";

test("Core functionality remains fully accessible even when PWA installation is unavailable", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "core_features_functional_without_pwa",
    testTitle: "Core functionality remains fully accessible even when PWA installation is unavailable",
  });

  await recorder.step("seed authenticated session and unsupported PWA state", async () => {
    await setupAuthenticatedSession(page);
    await mockUnsupportedPwaEnvironment(page, { reasonCode: "unsupported_os" });
    await mockBrowserModeCoreFeaturesScenario(page);
  });

  await recorder.step("verify unsupported install guidance in settings", async () => {
    await page.goto("/settings");
    await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Install App" })).toBeVisible();
    await expect(
      page.getByText(
        "Installation is not available on this operating system in v1. Continue using browser mode."
      )
    ).toBeVisible();
  });

  await recorder.step("verify dashboard remains accessible", async () => {
    await page.goto("/dashboard");
    await expect(page.getByRole("heading", { name: "Your riding story, one screen." })).toBeVisible();
  });

  await recorder.step("verify ride recording page remains accessible", async () => {
    await page.goto("/rides/record");
    await expect(page.getByRole("heading", { name: "Record a Ride" })).toBeVisible();
  });

  await recorder.step("verify export and import related flows remain accessible", async () => {
    await page.goto("/settings");
    await expect(page.getByRole("heading", { name: "Export Data" })).toBeVisible();
    await page.goto("/rides/import");
    await expect(page.getByRole("heading", { name: "Import Rides" })).toBeVisible();
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:core_features_functional_without_pwa");
  await recorder.save(testInfo);
});
