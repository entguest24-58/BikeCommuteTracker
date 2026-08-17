import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupRideEntryScenario } from "../../mock/mock-server.js";

test("no_preset_selection_leaves_fields_empty", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("no_preset_selection_leaves_fields_empty", "No preset selection leaves all fields empty and editable");

  await recorder.step("Seed authenticated rider with available presets", async () => {
    await setupRideEntryScenario(page, { scenario: "commuteWest" });
  });

  await recorder.step("Load ride entry page without selecting a preset", async () => {
    await page.goto("/rides/record");
    await expect(page.getByRole("heading", { name: "Record a Ride" })).toBeVisible();
    await expect(page.locator("#ridePreset")).toBeVisible();
  });

  await recorder.step("Verify ride fields stay blank until preset is explicitly applied", async () => {
    await expect(page.locator("#primaryTravelDirection")).toHaveValue("");
    await expect(page.locator("#rideMinutes")).toHaveValue("");
    await expect(page.locator("#miles")).toHaveValue("");
    await expect(page.locator("#miles")).toBeEditable();
    await expect(page.locator("#rideMinutes")).toBeEditable();
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:no_preset_selection_leaves_fields_empty");
  await recorder.save(testInfo);
});
