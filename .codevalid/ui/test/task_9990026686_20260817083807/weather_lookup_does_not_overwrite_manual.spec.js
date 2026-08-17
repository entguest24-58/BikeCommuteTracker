import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import {
  setupAuthenticatedBikeSession,
  mockRecordRidePage,
} from "../../helpers/mock-api.js";
import { weatherLookupAfternoonClear } from "../../mock/mock-data.js";

test("User-edited weather values are preserved over lookup", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "weather_lookup_does_not_overwrite_manual",
    testTitle: testInfo.title,
  });

  await recorder.step("seed auth and weather route", async () => {
    await setupAuthenticatedBikeSession(page);
    await mockRecordRidePage(page, {
      weatherResponse: weatherLookupAfternoonClear,
    });
  });

  await recorder.step("open page and manually enter temperature", async () => {
    await page.goto("/rides/record");
    await page.locator("#rideDateTimeLocal").fill("2024-06-10T14:25");
    await page.locator("#temperature").fill("72");
  });

  await recorder.step("trigger weather lookup and verify manual temperature remains", async () => {
    await page.getByRole("button", { name: "Load Weather" }).click();
    await expect(page.locator("#temperature")).toHaveValue("72");
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:weather_lookup_does_not_overwrite_manual");
  await recorder.save(testInfo);
});
