import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import {
  setupAuthenticatedBikeSession,
  mockRecordRidePage,
} from "../../helpers/mock-api.js";

test("Gas price field allows editing and stores any entered or cleared value", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "gas_price_is_editable_and_storable",
    testTitle: testInfo.title,
  });
  const seenPayloads = [];

  await recorder.step("seed auth and capture save payloads", async () => {
    await setupAuthenticatedBikeSession(page);
    await mockRecordRidePage(page, {
      gasPrice: 3.45,
      recordRideHandler: async (route) => {
        seenPayloads.push(route.request().postDataJSON());
        return route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify({
            rideId: 303 + seenPayloads.length,
            riderId: 101,
            savedAtUtc: "2026-08-17T08:00:00.000Z",
            eventStatus: "recorded",
          }),
        });
      },
    });
  });

  await recorder.step("save with edited gas price", async () => {
    await page.goto("/rides/record");
    await page.locator("#miles").fill("10");
    await page.locator("#gasPrice").fill("3.60");
    await page.getByRole("button", { name: "Record Ride" }).click();
    await expect(page.getByText(/Ride recorded successfully/)).toBeVisible();
  });

  await recorder.step("save with cleared gas price", async () => {
    await page.goto("/rides/record");
    await page.locator("#miles").fill("11");
    await page.locator("#gasPrice").fill("");
    await page.getByRole("button", { name: "Record Ride" }).click();
    await expect(page.getByText(/Ride recorded successfully/)).toBeVisible();
  });

  await recorder.step("assert stored payload values", async () => {
    expect(seenPayloads[0].gasPricePerGallon).toBe(3.6);
    expect(seenPayloads[1].gasPricePerGallon).toBeUndefined();
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:gas_price_is_editable_and_storable");
  await recorder.save(testInfo);
});
