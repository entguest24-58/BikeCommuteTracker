import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import {
  setupAuthenticatedSession,
  setupImportRidesPageScenario,
} from "../../helpers/mock-api.js";

test("User can cancel the import process at any stage and return to import screen", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("user_can_cancel_import_mid_flow", "User can cancel the import process at any stage and return to import screen");

  await recorder.step("Seed authenticated session and duplicate-processing scenario", async () => {
    await setupAuthenticatedSession(page);
    await setupImportRidesPageScenario(page, {
      preview: "duplicatesRequireResolution",
      start: "processing",
      statusSequence: "processingMidway",
      cancel: "cancelledMidway",
      enableRealtime: false,
    });
  });

  await recorder.step("Open page, upload CSV, and open duplicate resolution dialog", async () => {
    await page.goto("/rides/import");
    await page.locator("#csv-upload-input").setInputFiles({
      name: "cancel-flow.csv",
      mimeType: "text/csv",
      buffer: Buffer.from("date,miles\n2026-08-01,12.4\n", "utf-8"),
    });
    await page.getByRole("button", { name: "Preview Import" }).click();
    await page.getByRole("button", { name: "Start Import" }).click();
    await expect(page.getByRole("heading", { name: "Resolve duplicates" })).toBeVisible();
  });

  await recorder.step("Cancel from duplicate resolution and verify reset to initial state", async () => {
    await page.getByRole("button", { name: "Cancel" }).click();
    await expect(page.getByRole("heading", { name: "Resolve duplicates" })).toHaveCount(0);
    await expect(page.getByText("No file selected.")).toBeVisible();
    await expect(page.getByText("Start an import to see progress and cancellation controls.")).toBeVisible();
  });

  await recorder.step("Restart import flow and cancel from progress panel", async () => {
    await page.locator("#csv-upload-input").setInputFiles({
      name: "cancel-flow.csv",
      mimeType: "text/csv",
      buffer: Buffer.from("date,miles\n2026-08-01,12.4\n", "utf-8"),
    });
    await page.getByRole("button", { name: "Preview Import" }).click();
    await page.getByLabel("Override all duplicates").check();
    await page.getByRole("button", { name: "Start Import" }).click();
    await expect(page.getByRole("heading", { name: "Import Progress" })).toBeVisible();
    await expect(page.getByText(/Complete: 50%/i)).toBeVisible();
    await page.getByRole("button", { name: "Cancel Import" }).click();
  });

  await recorder.step("Verify cancellation halts processing and returns to clean import-ready state", async () => {
    await expect(page.getByText(/Status: cancelled/i)).toBeVisible();
    await expect(page.getByRole("button", { name: "Cancel Import" })).toHaveCount(0);
    await page.reload();
    await expect(page.getByText("Start an import to see progress and cancellation controls.")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Resolve duplicates" })).toHaveCount(0);
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:user_can_cancel_import_mid_flow");
  await recorder.save(testInfo);
});
