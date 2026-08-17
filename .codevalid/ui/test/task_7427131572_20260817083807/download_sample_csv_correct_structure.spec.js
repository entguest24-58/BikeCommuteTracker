import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";

const SESSION_KEY = "bike_tracking_auth_session";

function buildSession() {
  const now = new Date();
  return {
    userId: 101,
    userName: "Test Rider",
    lastActivityAtUtc: now.toISOString(),
    expiresAtUtc: new Date(now.getTime() + 30 * 60 * 1000).toISOString(),
  };
}

test("Download Sample CSV contains correct headers, sample rows, and legend", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("download_sample_csv_correct_structure", "Download Sample CSV contains correct headers, sample rows, and legend");

  const sampleCsv = [
    "# Difficulty: 1-5; Direction: N, NE, E, SE, S, SW, W, NW or full names like North, Northeast",
    "Date,Miles,Difficulty,PrimaryTravelDirection",
    "2023-10-01,10.5,3,NE",
    "2023-10-02,7.2,4,South"
  ].join("\n");

  await recorder.step("Seed authenticated session in sessionStorage");
  await page.addInitScript(({ key, session }) => {
    window.sessionStorage.setItem(key, JSON.stringify(session));
  }, { key: SESSION_KEY, session: buildSession() });

  await recorder.step("Mock sample CSV download endpoint");
  await page.route("**/api/rides/csv-sample", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "text/csv",
      body: sampleCsv,
      headers: {
        "content-disposition": 'attachment; filename="ride-import-sample.csv"'
      }
    });
  });

  await recorder.step("Open Import Rides page");
  await page.goto("/rides/import");
  await expect(page.getByRole("heading", { name: "Import Rides" })).toBeVisible();

  await recorder.step("Click Download sample CSV");
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download sample CSV" }).click();
  const download = await downloadPromise;

  await recorder.step("Verify downloaded CSV contents");
  expect(download.suggestedFilename()).toBe("ride-import-sample.csv");
  const stream = await download.createReadStream();
  let content = "";
  for await (const chunk of stream) {
    content += chunk.toString();
  }

  expect(content).toContain("Date,Miles,Difficulty,PrimaryTravelDirection");
  expect(content).toContain("2023-10-01,10.5,3,NE");
  expect(content).toContain("Difficulty: 1-5; Direction: N, NE, E, SE, S, SW, W, NW or full names like North, Northeast");

  console.log("CODEVALID_TEST_ASSERTION_OK:download_sample_csv_correct_structure");
  await recorder.save(testInfo);
});
