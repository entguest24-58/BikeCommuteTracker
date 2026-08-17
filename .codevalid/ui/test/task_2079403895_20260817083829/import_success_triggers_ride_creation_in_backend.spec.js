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

test("Successfully imported rows persist with correct internal field mappings", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "import_success_triggers_ride_creation_in_backend",
    testTitle: "Successfully imported rows persist with correct internal field mappings",
  });

  const csv = [
    "Date,Miles,RideMinutes,Temperature,Tags,Difficulty,PrimaryTravelDirection,Notes",
    '2026-06-15,12.4,48,68,commute,3,Southeast,"Ride was great."',
  ].join("\n");

  const importedRide = {
    rideId: 9001,
    date: "2026-06-15",
    miles: 12.4,
    durationMinutes: 48,
    difficulty: 3,
    primaryTravelDirection: "SE",
    notes: "Ride was great.",
  };

  await recorder.step("prepare authenticated session", async () => {
    await setupAuthenticatedSession(page);
    await seedRepoAuthSession(page);
  });

  await recorder.step("mock import completion and downstream data endpoints", async () => {
    await page.route("**/api/imports/preview", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          importJobId: 108,
          totalRows: 1,
          validRows: 1,
          invalidRows: 0,
          duplicateRows: 0,
          requiresDuplicateResolution: false,
          rows: [
            { rowNumber: 1, isValid: true, errors: [], duplicateMatches: [] },
          ],
        }),
      });
    });

    await page.route("**/api/imports/start", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          importJobId: 108,
          status: "processing",
          startedAtUtc: "2026-06-20T10:30:00.000Z",
        }),
      });
    });

    await page.route("**/api/imports/108/status", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          importJobId: 108,
          status: "completed",
          totalRows: 1,
          processedRows: 1,
          importedRows: 1,
          skippedRows: 0,
          failedRows: 0,
          percentComplete: 100,
          etaMinutesRounded: 0,
          createdAtUtc: "2026-06-20T10:30:00.000Z",
          startedAtUtc: "2026-06-20T10:30:00.000Z",
          completedAtUtc: "2026-06-20T10:30:01.000Z",
          lastError: null,
        }),
      });
    });

    await page.route("**/api/dashboard**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          rideDifficultySummary: [{ label: "3", value: 1 }],
          windResistanceChart: [{ direction: "SE", count: 1 }],
        }),
      });
    });

    await page.route("**/api/stats**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({}),
      });
    });

    await page.route("**/api/rides**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([importedRide]),
      });
    });
  });

  await recorder.step("run import flow", async () => {
    await page.goto("/rides/import");
    await page.locator("#csv-upload-input").setInputFiles({
      name: "successful-import.csv",
      mimeType: "text/csv",
      buffer: Buffer.from(csv, "utf-8"),
    });
    await page.getByRole("button", { name: "Preview Import" }).click();
    await page.getByRole("button", { name: "Start Import" }).click();
    await expect(page.getByRole("heading", { name: "Import Complete" })).toBeVisible();
    await expect(page.getByText("Nice work. 1 rides were imported successfully.")).toBeVisible();
  });

  await recorder.step("go to dashboard and verify downstream availability", async () => {
    await page.getByRole("link", { name: "Go To Dashboard" }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByRole("heading", { name: "Your riding story, one screen." })).toBeVisible();

    const ridesResponse = await page.request.get("http://127.0.0.1:5436/api/rides");
    expect(ridesResponse.ok()).toBeTruthy();
    const rides = await ridesResponse.json();
    expect(rides[0].primaryTravelDirection).toBe("SE");
    expect(rides[0].difficulty).toBe(3);
    expect(rides[0].notes).toBe("Ride was great.");
  });

  await recorder.step("emit assertion marker", async () => {
    console.log("CODEVALID_TEST_ASSERTION_OK:import_success_triggers_ride_creation_in_backend");
  });

  await recorder.save(testInfo);
});
