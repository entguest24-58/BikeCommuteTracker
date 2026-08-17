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

function toBase64(content) {
  return Buffer.from(content, "utf-8").toString("base64");
}

function seedRepoAuthSession(page, session = { userId: 1, userName: "Test Rider" }) {
  return page.addInitScript((value) => {
    window.sessionStorage.setItem("bike_tracking_auth_session", JSON.stringify({
      ...value,
      lastActivityAtUtc: new Date().toISOString(),
      expiresAtUtc: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    }));
  }, session);
}

test("Import CSV with all optional fields correctly filled", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "import_valid_csv_with_all_fields",
    testTitle: "Import CSV with all optional fields correctly filled",
  });

  const validCsv = [
    "Date,Miles,RideMinutes,Temperature,Tags,Difficulty,PrimaryTravelDirection,Notes",
    '2026-06-15,12.4,48,68,commute,3,North,"Sunny morning ride"',
    '2026-06-16,18.2,67,71,training,4,SE,"Strong crosswind but manageable"',
  ].join("\n");

  const previewResponse = {
    importJobId: 101,
    totalRows: 2,
    validRows: 2,
    invalidRows: 0,
    duplicateRows: 0,
    requiresDuplicateResolution: false,
    rows: [
      { rowNumber: 1, date: "2026-06-15", miles: 12.4, rideMinutes: 48, temperature: 68, tags: "commute", notes: "Sunny morning ride", isValid: true, errors: [], duplicateMatches: [] },
      { rowNumber: 2, date: "2026-06-16", miles: 18.2, rideMinutes: 67, temperature: 71, tags: "training", notes: "Strong crosswind but manageable", isValid: true, errors: [], duplicateMatches: [] },
    ],
  };

  await recorder.step("prepare authenticated session", async () => {
    await setupAuthenticatedSession(page);
    await seedRepoAuthSession(page);
  });

  await recorder.step("mock preview start and status endpoints", async () => {
    await page.route("**/api/imports/preview", async (route) => {
      const payload = route.request().postDataJSON();
      expect(payload.fileName).toBe("valid-import.csv");
      expect(payload.contentBase64).toBe(toBase64(validCsv));
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(previewResponse),
      });
    });

    await page.route("**/api/imports/start", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          importJobId: 101,
          status: "processing",
          startedAtUtc: "2026-06-20T10:00:00.000Z",
        }),
      });
    });

    await page.route("**/api/imports/101/status", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          importJobId: 101,
          status: "completed",
          totalRows: 2,
          processedRows: 2,
          importedRows: 2,
          skippedRows: 0,
          failedRows: 0,
          percentComplete: 100,
          etaMinutesRounded: 0,
          createdAtUtc: "2026-06-20T10:00:00.000Z",
          startedAtUtc: "2026-06-20T10:00:00.000Z",
          completedAtUtc: "2026-06-20T10:00:02.000Z",
          lastError: null,
        }),
      });
    });
  });

  await recorder.step("open import page and upload CSV", async () => {
    await page.goto("/rides/import");
    await expect(page.getByRole("heading", { name: "Import Rides" })).toBeVisible();
    await page.locator("#csv-upload-input").setInputFiles({
      name: "valid-import.csv",
      mimeType: "text/csv",
      buffer: Buffer.from(validCsv, "utf-8"),
    });
    await expect(page.getByText("Selected file: valid-import.csv")).toBeVisible();
  });

  await recorder.step("preview the import", async () => {
    await page.getByRole("button", { name: "Preview Import" }).click();
    await expect(page.getByRole("heading", { name: "Preview Summary" })).toBeVisible();
    await expect(page.getByText("Total rows: 2 | Valid rows: 2 | Invalid rows: 0")).toBeVisible();
    await expect(page.getByText("Duplicate rows: 0 | No duplicate review required.")).toBeVisible();
    await expect(page.getByText("Row 1: Valid")).toBeVisible();
    await expect(page.getByText("Row 2: Valid")).toBeVisible();
  });

  await recorder.step("start import and verify completion", async () => {
    await page.getByRole("button", { name: "Start Import" }).click();
    await expect(page.getByRole("heading", { name: "Import Complete" })).toBeVisible();
    await expect(page.getByText("Nice work. 2 rides were imported successfully.")).toBeVisible();
  });

  await recorder.step("emit assertion marker", async () => {
    console.log("CODEVALID_TEST_ASSERTION_OK:import_valid_csv_with_all_fields");
  });

  await recorder.save(testInfo);
});
