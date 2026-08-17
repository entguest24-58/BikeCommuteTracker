import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupRideEntryScenario } from "../../mock/mock-server.js";

test("invalid_preset_data_handling", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("invalid_preset_data_handling", "Current UI applies invalid preset data directly when selected");

  await recorder.step("Seed authenticated rider with invalid preset fixture", async () => {
    await setupRideEntryScenario(page, { scenario: "invalidPreset" });
  });

  await recorder.step("Open ride entry page", async () => {
    await page.goto("/rides/record");
    await expect(page.getByRole("heading", { name: "Record a Ride" })).toBeVisible();
    await expect(page.locator("#ridePreset")).toBeVisible();
  });

  await recorder.step("Select invalid preset and apply it", async () => {
    await page.locator("#ridePreset").selectOption({ label: /Broken Preset/ });
    await page.getByRole("button", { name: "Apply Preset" }).click();
  });

  await recorder.step("Verify current implementation reflects backend values and shows no warning", async () => {
    await expect(page.locator("#rideMinutes")).toHaveValue("0");
    await expect(page.locator("#miles")).toHaveValue("-1");
    await expect(page.getByText("This preset has invalid values and cannot be applied.")).toHaveCount(0);
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:invalid_preset_data_handling");
  await recorder.save(testInfo);
});
