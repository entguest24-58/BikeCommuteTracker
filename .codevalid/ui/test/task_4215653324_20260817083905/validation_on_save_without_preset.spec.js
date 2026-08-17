import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupRideEntryScenario } from "../../mock/mock-server.js";

test("validation_on_save_without_preset", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("validation_on_save_without_preset", "Form validation blocks save when required values are missing or invalid");

  await recorder.step("Seed authenticated rider with no presets", async () => {
    await setupRideEntryScenario(page, { scenario: "emptyPresets" });
  });

  await recorder.step("Load ride entry page", async () => {
    await page.goto("/rides/record");
    await expect(page.getByRole("heading", { name: "Record a Ride" })).toBeVisible();
  });

  await recorder.step("Leave required mileage blank and submit", async () => {
    await page.locator("#rideDateTimeLocal").fill("");
    await page.getByRole("button", { name: /Save Ride/i }).click();
  });

  await recorder.step("Verify the form blocks submission and surfaces validation", async () => {
    await expect(page.getByText("Miles must be greater than 0")).toBeVisible();
    await expect(page.getByText(/Ride recorded successfully/i)).toHaveCount(0);
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:validation_on_save_without_preset");
  await recorder.save(testInfo);
});
