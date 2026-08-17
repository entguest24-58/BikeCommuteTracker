import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupAuthenticatedSession, setupRidePresetScenario } from "../../helpers/mock-api.js";

test("Editing ride fields after preset application does not alter the preset definition", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "editing_ride_does_not_change_preset",
    testTitle: testInfo.title,
  });

  await recorder.step("setup authenticated session and ride preset scenario", async () => {
    await setupAuthenticatedSession(page);
    await setupRidePresetScenario(page, {
      presets: [
        {
          presetId: 701,
          name: "Commute Home",
          primaryDirection: "SW",
          periodTag: "morning",
          exactStartTimeLocal: "07:00",
          durationMinutes: 30,
          miles: 5.2,
          lastUsedAtUtc: null,
          updatedAtUtc: "2026-08-17T08:00:00.000Z",
        },
      ],
      recordRideResponse: {
        rideId: 9001,
        riderId: 1,
        savedAtUtc: "2026-08-17T09:00:00.000Z",
        eventStatus: "saved",
      },
    });
  });

  await recorder.step("apply the preset", async () => {
    await page.goto("/rides/record");
    await page.locator("#ridePreset").selectOption("701");
    await page.getByRole("button", { name: "Apply Preset" }).click();
    await expect(page.locator("#primaryTravelDirection")).toHaveValue("SW");
    await expect(page.locator("#miles")).toHaveValue("5.2");
  });

  await recorder.step("edit ride fields and submit the ride", async () => {
    await page.locator("#primaryTravelDirection").selectOption("NW");
    await page.locator("#miles").fill("6.0");
    await page.getByRole("button", { name: "Save Ride" }).click();
    await expect(page.getByText("Ride recorded successfully (ID: 9001)")).toBeVisible();
  });

  await recorder.step("revisit record ride page and verify preset remains unchanged", async () => {
    await page.goto("/rides/record");
    await page.locator("#ridePreset").selectOption("701");
    await page.getByRole("button", { name: "Apply Preset" }).click();
    await expect(page.locator("#primaryTravelDirection")).toHaveValue("SW");
    await expect(page.locator("#rideDateTimeLocal")).toHaveValue(/T07:00$/);
    await expect(page.locator("#rideMinutes")).toHaveValue("30");
    await expect(page.locator("#miles")).toHaveValue("5.2");
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:editing_ride_does_not_change_preset");
  await recorder.save(testInfo);
});
