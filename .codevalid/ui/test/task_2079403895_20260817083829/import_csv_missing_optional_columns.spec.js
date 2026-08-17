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

test("Import CSV that omits one or more optional columns", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "import_csv_missing_optional_columns",
    testTitle: "Import CSV that omits one or more optional columns",
  });

  const csv = [
    "Date,Miles,RideMinutes,Temperature,Tags",
    "2026-06-15,12.4,48,68,commute",
    "2026-06-16,18.2,67,71,training",
  ].join("\n");

  await recorder.step("prepare authenticated session", async () => {
    await setupAuthenticatedSession(page);
    await seedRepoAuthSession(page);
  });

  await recorder.step("mock import endpoints", async () => {
    await page.route("**/api/imports/preview", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          importJobId: 102,
          totalRows: 2,
          validRows: 2,
          invalidRows: 0,
          duplicateRows: 0,
          requiresDuplicateResolution: false,
          rows: [
            { rowNumber: 1, date: "2026-06-15", miles: 12.4, rideMinutes: 48, temperature: 68, tags: "commute", notes: null, isValid: true, errors: [], duplicateMatches: [] },
            { rowNumber: 2, date: "2026-06-16", miles: 18.2, rideMinutes: 67, temperature: 71, tags: "training", notes: null, isValid: true, errors: [], duplicateMatches: [] },
          ],
        }),
      });
    });

    await page.route("**/api/imports/start", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          importJobId: 102,
          status: "processing",
          startedAtUtc: "2026-06-20T10:10:00.000Z",
        }),
      });
    });

    await page.route("**/api/imports/102/status", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          importJobId: 102,
          status: "completed",
          totalRows: 2,
          processedRows: 2,
          importedRows: 2,
          skippedRows: 0,
          failedRows: 0,
          percentComplete: 100,
          etaMinutesRounded: 0,
          createdAtUtc: "2026-06-20T10:10:00.000Z",
          startedAtUtc: "2026-06-20T10:10:00.000Z",
          completedAtUtc: "2026-06-20T10:10:02.000Z",
          lastError: null,
        }),
      });
    });
  });

  await recorder.step("upload file and preview import", async () => {
    await page.goto("/rides/import");
    await page.locator("#csv-upload-input").setInputFiles({
      name: "missing-optional-columns.csv",
      mimeType: "text/csv",
      buffer: Buffer.from(csv, "utf-8"),
    });
    await page.getByRole("button", { name: "Preview Import" }).click();
    await expect(page.getByText("Total rows: 2 | Valid rows: 2 | Invalid rows: 0")).toBeVisible();
    await expect(page.getByText("Row 1: Valid")).toBeVisible();
    await expect(page.getByText("Row 2: Valid")).toBeVisible();
  });

  await recorder.step("start import and verify success", async () => {
    await page.getByRole("button", { name: "Start Import" }).click();
    await expect(page.getByRole("heading", { name: "Import Complete" })).toBeVisible();
    await expect(page.getByText("Nice work. 2 rides were imported successfully.")).toBeVisible();
  });

  await recorder.step("emit assertion marker", async () => {
    console.log("CODEVALID_TEST_ASSERTION_OK:import_csv_missing_optional_columns");
  });

  await recorder.save(testInfo);
});
