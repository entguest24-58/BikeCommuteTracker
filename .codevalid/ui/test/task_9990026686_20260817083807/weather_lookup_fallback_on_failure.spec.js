import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import {
  setupAuthenticatedBikeSession,
  mockRecordRidePage,
} from "../../helpers/mock-api.js";

test("Ride saves successfully on weather lookup failure", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "weather_lookup_fallback_on_failure",
    testTitle: testInfo.title,
  });

  await recorder.step("seed auth, failed weather route, and successful save route", async () => {
    await setupAuthenticatedBikeSession(page);
    await mockRecordRidePage(page, {
      weatherFailureMessage: "Failed to fetch ride weather",
      recordRideHandler: async (route) => {
        return route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify({
            rideId: 202,
            riderId: 101,
            savedAtUtc: "2026-08-17T08:00:00.000Z",
            eventStatus: "recorded",
          }),
        });
      },
    });
  });

  await recorder.step("open page and enter required ride fields", async () => {
    await page.goto("/rides/record");
    await page.locator("#rideDateTimeLocal").fill("2024-06-10T14:25");
    await page.locator("#miles").fill("10");
  });

  await recorder.step("weather lookup fails but save still succeeds", async () => {
    await page.getByRole("button", { name: "Load Weather" }).click();
    await expect(page.getByText("Failed to fetch ride weather")).toBeVisible();
    await page.getByRole("button", { name: "Record Ride" }).click();
    await expect(page.getByText("Ride recorded successfully (ID: 202)")).toBeVisible();
    await expect(page.locator("#temperature")).toHaveValue("");
    await expect(page.locator("#windSpeedMph")).toHaveValue("");
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:weather_lookup_fallback_on_failure");
  await recorder.save(testInfo);
});
