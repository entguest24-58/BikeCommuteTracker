import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupRideEntryScenario } from "../../mock/mock-server.js";

test("no_presets_available", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("no_presets_available", "Rider sees no preset controls when no presets exist");

  await recorder.step("Seed authenticated rider with empty presets response", async () => {
    await setupRideEntryScenario(page, { scenario: "emptyPresets" });
  });

  await recorder.step("Load ride entry page", async () => {
    await page.goto("/rides/record");
    await expect(page.getByRole("heading", { name: "Record a Ride" })).toBeVisible();
  });

  await recorder.step("Verify preset UI is absent and fields remain blank/editable", async () => {
    await expect(page.locator("#ridePreset")).toHaveCount(0);
    await expect(page.locator("#primaryTravelDirection")).toHaveValue("");
    await expect(page.locator("#rideMinutes")).toHaveValue("");
    await expect(page.locator("#miles")).toHaveValue("");
    await expect(page.locator("#miles")).toBeEditable();
    await expect(page.locator("#rideMinutes")).toBeEditable();
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:no_presets_available");
  await recorder.save(testInfo);
});
