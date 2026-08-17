import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupAuthenticatedSession, setupRidePresetScenario } from "../../helpers/mock-api.js";

test("RecordRidePage shows empty state or placeholder when no presets exist", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "record_ride_no_presets_available",
    testTitle: testInfo.title,
  });

  await recorder.step("setup authenticated session with no ride presets", async () => {
    await setupAuthenticatedSession(page);
    await setupRidePresetScenario(page, { presets: [] });
  });

  await recorder.step("load the record ride page", async () => {
    await page.goto("/rides/record");
    await expect(page.getByRole("heading", { name: "Record a Ride" })).toBeVisible();
  });

  await recorder.step("verify preset UI is absent and manual fields remain blank", async () => {
    await expect(page.locator("#ridePreset")).toHaveCount(0);
    await expect(page.locator("#primaryTravelDirection")).toHaveValue("");
    await expect(page.locator("#miles")).toHaveValue("");
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:record_ride_no_presets_available");
  await recorder.save(testInfo);
});
