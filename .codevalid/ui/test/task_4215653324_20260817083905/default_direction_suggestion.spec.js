import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupRideEntryScenario } from "../../mock/mock-server.js";

test("default_direction_suggestion", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("default_direction_suggestion", "Backend-provided preset uses default morning SW direction when direction would otherwise be empty");

  await recorder.step("Seed authenticated rider with preset fixture using SW default", async () => {
    await setupRideEntryScenario(page, { scenario: "defaultMorningDirection" });
  });

  await recorder.step("Open ride entry page", async () => {
    await page.goto("/rides/record");
    await expect(page.getByRole("heading", { name: "Record a Ride" })).toBeVisible();
  });

  await recorder.step("Apply preset with defaulted direction", async () => {
    await page.locator("#ridePreset").selectOption({ label: /Morning Default/ });
    await page.getByRole("button", { name: "Apply Preset" }).click();
  });

  await recorder.step("Verify SW is filled as the direction", async () => {
    await expect(page.locator("#primaryTravelDirection")).toHaveValue("SW");
    await expect(page.locator("#rideDateTimeLocal")).toHaveValue(/T08:00$/);
    await expect(page.locator("#rideMinutes")).toHaveValue("25");
    await expect(page.locator("#miles")).toHaveValue("4.5");
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:default_direction_suggestion");
  await recorder.save(testInfo);
});
