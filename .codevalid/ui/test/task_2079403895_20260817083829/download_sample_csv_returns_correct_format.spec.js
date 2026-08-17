import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import {
  setupUnauthenticatedSession,
  setupAuthenticatedSession,
  mockSuccessfulSigninFlow,
  mockFailedSigninFlow,
  mockDelayedSuccessfulSigninFlow,
  setupEventCreationScenario,
} from "../../helpers/mock-api.js";

function seedRepoAuthSession(page, session = { userId: 1, userName: "Test Rider" }) {
  return page.addInitScript((value) => {
    window.sessionStorage.setItem("bike_tracking_auth_session", JSON.stringify({
      ...value,
      lastActivityAtUtc: new Date().toISOString(),
      expiresAtUtc: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    }));
  }, session);
}

test("Download Sample CSV returns file with correct columns and legend", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "download_sample_csv_returns_correct_format",
    testTitle: "Download Sample CSV returns file with correct columns and legend",
  });

  const sampleCsv = [
    "# Difficulty: 1-5 | PrimaryTravelDirection/Direction: valid values are N, NE, E, SE, S, SW, W, NW or North, Northeast, East, Southeast, South, Southwest, West, Northwest | Notes: max 500 characters",
    "Date,Miles,RideMinutes,Temperature,Tags,Difficulty,PrimaryTravelDirection,Notes",
    '2026-06-15,12.4,48,68,commute,3,North,"Sunny morning ride to the office"',
    '2026-06-16,18.2,67,71,training,4,SE,"Steady headwind on the return trip"',
  ].join("\n");

  await recorder.step("prepare authenticated browser session", async () => {
    await setupAuthenticatedSession(page);
    await seedRepoAuthSession(page);
  });

  await recorder.step("mock sample CSV endpoint", async () => {
    await page.route("**/api/rides/csv-sample", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "text/csv",
        headers: {
          "content-disposition": 'attachment; filename="ride-import-sample.csv"',
        },
        body: sampleCsv,
      });
    });
  });

  await recorder.step("open import rides page", async () => {
    await page.goto("/rides/import");
    await expect(page.getByRole("heading", { name: "Import Rides" })).toBeVisible();
  });

  await recorder.step("download and inspect sample CSV", async () => {
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("button", { name: "Download sample CSV" }).click(),
    ]);

    const stream = await download.createReadStream();
    expect(stream).toBeTruthy();

    const chunks = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.from(chunk));
    }
    const content = Buffer.concat(chunks).toString("utf-8");
    const lines = content.trim().split(/\r?\n/);

    expect(lines[0].startsWith("#")).toBeTruthy();
    expect(lines[0]).toContain("Difficulty: 1-5");
    expect(lines[0]).toContain("PrimaryTravelDirection/Direction: valid values are N, NE, E, SE, S, SW, W, NW or North, Northeast, East, Southeast, South, Southwest, West, Northwest");
    expect(lines[0]).toContain("Notes: max 500 characters");
    expect(lines[1]).toContain("Difficulty");
    expect(lines[1]).toContain("PrimaryTravelDirection");
    expect(lines[1]).toContain("Notes");
    expect(lines.length).toBeGreaterThanOrEqual(3);
    expect(content).toContain("North");
    expect(content).toContain("SE");
  });

  await recorder.step("emit assertion marker", async () => {
    console.log("CODEVALID_TEST_ASSERTION_OK:download_sample_csv_returns_correct_format");
  });

  await recorder.save(testInfo);
});
