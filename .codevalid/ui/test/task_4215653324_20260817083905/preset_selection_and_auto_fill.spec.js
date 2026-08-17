import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupRideEntryScenario } from "../../mock/mock-server.js";

test("preset_selection_and_auto_fill", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("preset_selection_and_auto_fill", "Rider selects a preset and values are auto-filled in ride entry form");

  await recorder.step("Seed authenticated rider session and preset-backed ride entry mocks", async () => {
    await setupRideEntryScenario(page, { scenario: "commuteWest" });
  });

  await recorder.step("Load RecordRidePage", async () => {
    await page.goto("/rides/record");
    await expect(page.getByRole("heading", { name: "Record a Ride" })).toBeVisible();
    await expect(page.locator("#ridePreset")).toBeVisible();
  });

  await recorder.step("Select preset Commute West and apply it", async () => {
    await page.locator("#ridePreset").selectOption({ label: /Commute West/ });
    await page.getByRole("button", { name: "Apply Preset" }).click();
  });

  await recorder.step("Verify preset values auto-fill the ride form", async () => {
    await expect(page.locator("#primaryTravelDirection")).toHaveValue("SW");
    await expect(page.locator("#rideDateTimeLocal")).toHaveValue(/T07:30$/);
    await expect(page.locator("#rideMinutes")).toHaveValue("30");
    await expect(page.locator("#miles")).toHaveValue("5.2");
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:preset_selection_and_auto_fill");
  await recorder.save(testInfo);
});
