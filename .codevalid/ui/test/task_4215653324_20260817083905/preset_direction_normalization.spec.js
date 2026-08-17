import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupRideEntryScenario } from "../../mock/mock-server.js";

test("preset_direction_normalization", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("preset_direction_normalization", "Canonical preset direction is rendered when backend preset already provides SW");

  await recorder.step("Seed authenticated rider with canonicalized preset response", async () => {
    await setupRideEntryScenario(page, { scenario: "normalizedDirection" });
  });

  await recorder.step("Load ride entry page", async () => {
    await page.goto("/rides/record");
    await expect(page.getByRole("heading", { name: "Record a Ride" })).toBeVisible();
  });

  await recorder.step("Apply normalized direction preset", async () => {
    await page.locator("#ridePreset").selectOption({ label: /South West Commute/ });
    await page.getByRole("button", { name: "Apply Preset" }).click();
  });

  await recorder.step("Verify canonical SW value is filled", async () => {
    await expect(page.locator("#primaryTravelDirection")).toHaveValue("SW");
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:preset_direction_normalization");
  await recorder.save(testInfo);
});
