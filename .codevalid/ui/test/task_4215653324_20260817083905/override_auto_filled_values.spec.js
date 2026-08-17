import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupRideEntryScenario } from "../../mock/mock-server.js";

test("override_auto_filled_values", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("override_auto_filled_values", "Rider can override auto-filled preset values before submitting ride");

  await recorder.step("Seed authenticated rider session and preset-backed routes", async () => {
    await setupRideEntryScenario(page, { scenario: "commuteWest" });
  });

  await recorder.step("Open ride entry page", async () => {
    await page.goto("/rides/record");
    await expect(page.getByRole("heading", { name: "Record a Ride" })).toBeVisible();
  });

  await recorder.step("Apply preset values", async () => {
    await page.locator("#ridePreset").selectOption({ label: /Commute West/ });
    await page.getByRole("button", { name: "Apply Preset" }).click();
    await expect(page.locator("#primaryTravelDirection")).toHaveValue("SW");
    await expect(page.locator("#rideMinutes")).toHaveValue("30");
    await expect(page.locator("#miles")).toHaveValue("5.2");
  });

  await recorder.step("Override preset-backed values", async () => {
    await page.locator("#primaryTravelDirection").selectOption("NE");
    await page.locator("#rideMinutes").fill("45");
  });

  await recorder.step("Submit ride and verify overridden payload is preserved", async () => {
    await page.getByRole("button", { name: /Save Ride/i }).click();
    await expect(page.getByText(/Ride recorded successfully/i)).toBeVisible();
    await expect(page.locator("#primaryTravelDirection")).toHaveValue("NE");
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:override_auto_filled_values");
  await recorder.save(testInfo);
});
