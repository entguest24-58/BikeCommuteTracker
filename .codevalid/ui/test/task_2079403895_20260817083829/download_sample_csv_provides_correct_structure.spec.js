import { test, expect } from "@playwright/test";
import fs from "node:fs/promises";
import path from "node:path";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import {
  setupAuthenticatedImportSession,
  mockRideImportPageShell,
  mockSampleRideCsvDownload,
} from "../../helpers/mock-api.js";

test("Download Sample CSV returns file with sample data and legend", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "download_sample_csv_provides_correct_structure",
    testTitle: testInfo.title,
  });

  await recorder.step("Set up authenticated import session and mock sample CSV download.");
  await setupAuthenticatedImportSession(page);
  await mockRideImportPageShell(page);
  await mockSampleRideCsvDownload(page);

  await recorder.step("Open the ride CSV import page.");
  await page.goto("/rides/import");
  await expect(page.getByRole("heading", { name: "Import Rides" })).toBeVisible();

  const downloadPromise = page.waitForEvent("download");

  await recorder.step("Click the Download sample CSV button.");
  await page.getByRole("button", { name: "Download sample CSV" }).click();

  await recorder.step("Verify the downloaded file is a CSV.");
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("ride-import-sample.csv");
  expect(download.suggestedFilename().endsWith(".csv")).toBeTruthy();

  await recorder.step("Open the downloaded file and inspect its contents.");
  const downloadDir = await testInfo.outputPath("downloads");
  await fs.mkdir(downloadDir, { recursive: true });
  const savedPath = path.join(downloadDir, download.suggestedFilename());
  await download.saveAs(savedPath);
  const csv = await fs.readFile(savedPath, "utf8");

  expect(csv).toContain("# Difficulty: valid values 1-5");
  expect(csv).toContain("# PrimaryTravelDirection/Direction: accepted values are N, NE, E, SE, S, SW, W, NW or full names North, Northeast, East, Southeast, South, Southwest, West, Northwest");
  expect(csv).toContain("# Notes: maximum length 500 characters");
  expect(csv).toContain("Date,Distance,RideMinutes,Difficulty,PrimaryTravelDirection,Notes");
  expect(csv).toContain("2026-04-12,18.4,52,3,NE,Sunny ride");

  console.log("CODEVALID_TEST_ASSERTION_OK:download_sample_csv_provides_correct_structure");
  await recorder.save(testInfo);
});
