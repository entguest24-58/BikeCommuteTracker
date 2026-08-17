import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import {
  setupAuthenticatedSession,
  setupRecordRidePageScenario,
} from "../../helpers/mock-api.js";

test("backend save failure retains all form values and shows error, allowing retry", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "save_failure_retains_all_form_values",
    testTitle: testInfo.title,
  });

  await recorder.step("setup failing save scenario with presets", async () => {
    await setupAuthenticatedSession(page);
    await setupRecordRidePageScenario(page, {
      presets: [
        {
          presetId: 101,
          name: "Trail Loop",
          primaryDirection: "South",
          periodTag: "morning",
          exactStartTimeLocal: "08:00",
          durationMinutes: 60,
          miles: 15.2,
          lastUsedAtUtc: "2024-06-10T12:00:00Z",
          updatedAtUtc: "2024-06-10T12:00:00Z",
        },
      ],
      saveFailure: { status: 500, message: "Failed to save ride. Please try again." },
    });
  });

  await recorder.step("fill form and submit failing save", async () => {
    await page.goto("/rides/record");
    await page.locator("#ridePreset").selectOption("101");
    await page.locator("#miles").fill("12.3");
    await page.locator("#rideMinutes").fill("44");
    await page.locator("#temperature").fill("81");
    await page.locator("#windSpeedMph").fill("12");
    await page.locator("#windDirectionDeg").fill("45");
    await page.locator("#relativeHumidityPercent").fill("60");
    await page.locator("#cloudCoverPercent").fill("20");
    await page.locator("#precipitationType").fill("Rain");
    await page.locator("#gasPrice").fill("3.45");
    await page.locator("#notes").fill("Keep all values");
    await page.locator("#primaryTravelDirection").selectOption("South");
    await page.locator("#difficulty").selectOption("3");
    await page.getByRole("button", { name: "Record Ride" }).click();
  });

  await recorder.step("assert error and preserved values", async () => {
    await expect(page.getByText("Failed to save ride. Please try again.")).toBeVisible();
    await expect(page.locator("#ridePreset")).toHaveValue("101");
    await expect(page.locator("#miles")).toHaveValue("12.3");
    await expect(page.locator("#rideMinutes")).toHaveValue("44");
    await expect(page.locator("#temperature")).toHaveValue("81");
    await expect(page.locator("#windSpeedMph")).toHaveValue("12");
    await expect(page.locator("#windDirectionDeg")).toHaveValue("45");
    await expect(page.locator("#relativeHumidityPercent")).toHaveValue("60");
    await expect(page.locator("#cloudCoverPercent")).toHaveValue("20");
    await expect(page.locator("#precipitationType")).toHaveValue("Rain");
    await expect(page.locator("#gasPrice")).toHaveValue("3.45");
    await expect(page.locator("#notes")).toHaveValue("Keep all values");
    await expect(page.locator("#primaryTravelDirection")).toHaveValue("South");
    await expect(page.locator("#difficulty")).toHaveValue("3");
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:save_failure_retains_all_form_values");
  await recorder.save(testInfo);
});
