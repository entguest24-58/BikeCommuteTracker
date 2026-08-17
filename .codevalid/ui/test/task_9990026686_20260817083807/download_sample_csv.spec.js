import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupUnauthenticatedSession } from "../../helpers/mock-api.js";

const SESSION_KEY = "bike_tracking_auth_session";
const sampleCsv = [
  "# Valid Difficulty: 1–5. Accepted Directions: N, NE, E, SE, S, SW, W, NW or full names. Notes ≤ 500 chars.",
  "Date,Miles,Minutes,Temperature,WindSpeed,PrimaryTravelDirection,Difficulty,Notes",
  "2024-05-01T08:00:00,14.2,42,65,10,NE,3,Morning commute",
].join("\n");

async function seedAuthenticatedSession(page) {
  await page.addInitScript((key) => {
    const now = new Date();
    const expires = new Date(now.getTime() + 3600000);
    window.sessionStorage.setItem(key, JSON.stringify({ userId: 1, userName: "Alice", lastActivityAtUtc: now.toISOString(), expiresAtUtc: expires.toISOString() }));
  }, SESSION_KEY);
}

test("download_sample_csv", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("download_sample_csv", "User can download and view the sample CSV file with correct legend");

  await recorder.step("Prepare session", async () => {
    await setupUnauthenticatedSession(page);
    await seedAuthenticatedSession(page);
  });

  await recorder.step("Mock sample CSV download", async () => {
    await page.route("**/api/rides/csv-sample", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "text/csv",
        headers: { "Content-Disposition": 'attachment; filename="ride-import-sample.csv"' },
        body: sampleCsv,
      });
    });
  });

  await recorder.step("Download and inspect sample CSV", async () => {
    await page.goto("/rides/import");
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Download sample CSV" }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe("ride-import-sample.csv");
    const path = await download.path();
    expect(path).toBeTruthy();
    const fs = await import("node:fs/promises");
    const content = await fs.readFile(path, "utf8");
    expect(content).toContain("# Valid Difficulty: 1–5. Accepted Directions: N, NE, E, SE, S, SW, W, NW or full names. Notes ≤ 500 chars.");
    expect(content).toContain("Date,Miles,Minutes,Temperature,WindSpeed,PrimaryTravelDirection,Difficulty,Notes");
    expect(content).toContain("2024-05-01T08:00:00,14.2,42,65,10,NE,3,Morning commute");
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:download_sample_csv");
  await recorder.save(testInfo);
});
