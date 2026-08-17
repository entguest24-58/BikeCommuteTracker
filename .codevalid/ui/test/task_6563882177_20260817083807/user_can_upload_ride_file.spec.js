import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import {
  setupAuthenticatedSession,
  setupImportRidesPageScenario,
} from "../../helpers/mock-api.js";

test("User can select and upload a ride file for import", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("user_can_upload_ride_file", "User can select and upload a ride file for import");

  await recorder.step("Seed authenticated session and import preview route", async () => {
    await setupAuthenticatedSession(page);
    await setupImportRidesPageScenario(page);
  });

  await recorder.step("Open the Import Rides page", async () => {
    await page.goto("/rides/import");
  });

  await recorder.step("Select a valid CSV ride file", async () => {
    await page.locator("#csv-upload-input").setInputFiles({
      name: "rides.csv",
      mimeType: "text/csv",
      buffer: Buffer.from("date,miles\n2026-08-01,12.4\n", "utf-8"),
    });
  });

  await recorder.step("Verify selected file is shown and preview action remains available", async () => {
    await expect(page.getByText("Selected file: rides.csv")).toBeVisible();
    await expect(page.getByRole("button", { name: "Preview Import" })).toBeEnabled();
    await expect(page.getByRole("alert")).toHaveCount(0);
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:user_can_upload_ride_file");
  await recorder.save(testInfo);
});
