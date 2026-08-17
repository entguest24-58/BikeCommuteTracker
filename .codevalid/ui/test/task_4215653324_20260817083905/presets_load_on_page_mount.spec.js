import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupRideEntryScenario } from "../../mock/mock-server.js";

test("presets_load_on_page_mount", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("presets_load_on_page_mount", "Rider presets are loaded automatically when RecordRidePage mounts");

  await recorder.step("Seed authenticated rider with two presets and request tracking", async () => {
    await setupRideEntryScenario(page, { scenario: "twoPresets", trackPresetRequests: true });
  });

  await recorder.step("Load ride entry page", async () => {
    await page.goto("/rides/record");
    await expect(page.getByRole("heading", { name: "Record a Ride" })).toBeVisible();
  });

  await recorder.step("Verify presets request fired on mount and selector was populated", async () => {
    await expect.poll(async () => page.evaluate(() => window.__cvRidePresetRequestCount ?? 0)).toBeGreaterThan(0);
    await expect(page.locator("#ridePreset option")).toHaveCount(3);
    await expect(page.locator("#ridePreset")).toContainText("Commute West");
    await expect(page.locator("#ridePreset")).toContainText("Lunch Loop");
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:presets_load_on_page_mount");
  await recorder.save(testInfo);
});
