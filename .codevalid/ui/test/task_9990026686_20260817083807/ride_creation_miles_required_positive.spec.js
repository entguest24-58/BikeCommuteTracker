import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import {
  setupAuthenticatedBikeSession,
  mockRecordRidePage,
} from "../../helpers/mock-api.js";

test("Ride creation requires miles between 0.1 and 200", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "ride_creation_miles_required_positive",
    testTitle: testInfo.title,
  });

  await recorder.step("seed authenticated session and page mocks", async () => {
    await setupAuthenticatedBikeSession(page);
    await mockRecordRidePage(page, {
      presets: [],
      gasPrice: null,
      recordRideHandler: async (route) => {
        const body = route.request().postDataJSON();
        const miles = Number(body.miles);
        if (!Number.isFinite(miles) || miles <= 0 || miles > 200) {
          return route.fulfill({
            status: 400,
            contentType: "application/json",
            body: JSON.stringify({
              message: "Miles must be greater than 0 and no more than 200",
            }),
          });
        }
        return route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify({
            rideId: 101,
            riderId: 101,
            savedAtUtc: "2026-08-17T08:00:00.000Z",
            eventStatus: "recorded",
          }),
        });
      },
    });
  });

  await recorder.step("open record ride page", async () => {
    await page.goto("/rides/record");
    await expect(page.getByRole("heading", { name: "Record a Ride" })).toBeVisible();
  });

  await recorder.step("preserve other fields while miles blank is rejected", async () => {
    await page.locator("#notes").fill("Great ride!");
    await page.locator("#gasPrice").fill("3.50");
    await page.getByRole("button", { name: "Record Ride" }).click();
    await expect(page.getByText("Miles must be greater than 0")).toBeVisible();
    await expect(page.locator("#notes")).toHaveValue("Great ride!");
    await expect(page.locator("#gasPrice")).toHaveValue("3.50");
  });

  await recorder.step("reject negative miles", async () => {
    await page.locator("#miles").fill("-5");
    await page.getByRole("button", { name: "Record Ride" }).click();
    await expect(page.getByText("Miles must be greater than 0")).toBeVisible();
    await expect(page.locator("#notes")).toHaveValue("Great ride!");
    await expect(page.locator("#gasPrice")).toHaveValue("3.50");
  });

  await recorder.step("reject zero miles", async () => {
    await page.locator("#miles").fill("0");
    await page.getByRole("button", { name: "Record Ride" }).click();
    await expect(page.getByText("Miles must be greater than 0")).toBeVisible();
  });

  await recorder.step("reject miles above max", async () => {
    await page.locator("#miles").fill("201");
    await page.getByRole("button", { name: "Record Ride" }).click();
    await expect(page.getByText("Miles must be less than or equal to 200")).toBeVisible();
    await expect(page.locator("#notes")).toHaveValue("Great ride!");
    await expect(page.locator("#gasPrice")).toHaveValue("3.50");
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:ride_creation_miles_required_positive");
  await recorder.save(testInfo);
});
