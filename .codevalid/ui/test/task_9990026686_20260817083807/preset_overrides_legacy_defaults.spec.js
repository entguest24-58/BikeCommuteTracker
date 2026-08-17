import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import {
  setupAuthenticatedBikeSession,
  mockRecordRidePage,
} from "../../helpers/mock-api.js";
import { morningCommutePreset, lunchRidePreset } from "../../mock/mock-data.js";

test("Preset flow disables legacy quick-entry automagic", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "preset_overrides_legacy_defaults",
    testTitle: testInfo.title,
  });

  await recorder.step("seed auth and preset list", async () => {
    await setupAuthenticatedBikeSession(page);
    await mockRecordRidePage(page, {
      presets: [morningCommutePreset, lunchRidePreset],
      gasPrice: 3.45,
    });
  });

  await recorder.step("open record ride page", async () => {
    await page.goto("/rides/record");
    await expect(page.getByRole("heading", { name: "Record a Ride" })).toBeVisible();
  });

  await recorder.step("verify preset UI appears and legacy quick-entry UI does not", async () => {
    await expect(page.locator("#ridePreset")).toBeVisible();
    await expect(page.getByRole("button", { name: "Apply Preset" })).toBeVisible();
    await expect(page.getByText("Last 5 Rides")).toHaveCount(0);
    await expect(page.getByText("quick-entry", { exact: false })).toHaveCount(0);
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:preset_overrides_legacy_defaults");
  await recorder.save(testInfo);
});
