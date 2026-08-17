import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupUnauthenticatedSession } from "../../helpers/mock-api.js";

const SESSION_KEY = "bike_tracking_auth_session";

async function seedAuthenticatedSession(page) {
  await page.addInitScript((sessionKey) => {
    const now = new Date();
    const expires = new Date(now.getTime() + 60 * 60 * 1000);
    window.sessionStorage.setItem(
      sessionKey,
      JSON.stringify({
        userId: 1,
        userName: "Alice",
        lastActivityAtUtc: now.toISOString(),
        expiresAtUtc: expires.toISOString(),
      })
    );
  }, SESSION_KEY);
}

function csvToBase64(csv) {
  return Buffer.from(csv, "utf8").toString("base64");
}

test("import_csv_with_all_valid_fields", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("import_csv_with_all_valid_fields", "Valid CSV with all optional fields imported successfully");

  await recorder.step("Prepare authenticated import session", async () => {
    await setupUnauthenticatedSession(page);
    await seedAuthenticatedSession(page);
  });

  const sampleCsv = [
    "# Valid Difficulty: 1–5. Accepted Directions: N, NE, E, SE, S, SW, W, NW or full names. Notes ≤ 500 chars.",
    "Date,Miles,Minutes,Temperature,WindSpeed,PrimaryTravelDirection,Difficulty,Notes",
    "2024-05-01T08:00:00,12.5,45,68,9,N,3,Great ride!",
  ].join("\n");

  await recorder.step("Mock sample download and successful import endpoints", async () => {
    await page.route("**/api/rides/csv-sample", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "text/csv",
        headers: {
          "Content-Disposition": 'attachment; filename="ride-import-sample.csv"',
        },
        body: sampleCsv,
      });
    });

    await page.route("**/api/imports/preview", async (route) => {
      const body = route.request().postDataJSON();
      expect(body.fileName).toBe("valid-import.csv");
      expect(body.contentBase64).toBe(csvToBase64(sampleCsv));
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          importJobId: 101,
          totalRows: 1,
          validRows: 1,
          invalidRows: 0,
          duplicateRows: 0,
          requiresDuplicateResolution: false,
          rows: [
            {
              rowNumber: 1,
              date: "2024-05-01T08:00:00",
              miles: 12.5,
              rideMinutes: 45,
              temperature: 68,
              notes: "Great ride!",
              isValid: true,
              errors: [],
              duplicateMatches: [],
            },
          ],
        }),
      });
    });

    await page.route("**/api/imports/start", async (route) => {
      const body = route.request().postDataJSON();
      expect(body.importJobId).toBe(101);
      expect(body.overrideAllDuplicates).toBe(false);
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          importJobId: 101,
          status: "processing",
          startedAtUtc: "2024-05-01T08:05:00Z",
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
          totalRows: 1,
          processedRows: 1,
          importedRows: 1,
          skippedRows: 0,
          failedRows: 0,
          percentComplete: 100,
          etaMinutesRounded: null,
          createdAtUtc: "2024-05-01T08:00:00Z",
          startedAtUtc: "2024-05-01T08:05:00Z",
          completedAtUtc: "2024-05-01T08:06:00Z",
          lastError: null,
        }),
      });
    });
  });

  await recorder.step("Open Import Rides page", async () => {
    await page.goto("/rides/import");
    await expect(page.getByRole("heading", { name: "Import Rides" })).toBeVisible();
  });

  await recorder.step("Download sample CSV", async () => {
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Download sample CSV" }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe("ride-import-sample.csv");
    const content = await download.createReadStream();
    expect(content).not.toBeNull();
  });

  await recorder.step("Upload valid CSV and preview", async () => {
    await page.locator("#csv-upload-input").setInputFiles({
      name: "valid-import.csv",
      mimeType: "text/csv",
      buffer: Buffer.from(sampleCsv, "utf8"),
    });
    await expect(page.getByText("Selected file: valid-import.csv")).toBeVisible();
    await page.getByRole("button", { name: "Preview Import" }).click();
    await expect(page.getByText("Total rows: 1 | Valid rows: 1 | Invalid rows: 0")).toBeVisible();
    await expect(page.getByText("Duplicate rows: 0 | No duplicate review required.")).toBeVisible();
    await expect(page.getByText("Row 1: Valid")).toBeVisible();
  });

  await recorder.step("Start import and verify success", async () => {
    await page.getByRole("button", { name: "Start Import" }).click();
    await expect(page.getByRole("heading", { name: "Import Complete" })).toBeVisible();
    await expect(page.getByText("Nice work. 1 rides were imported successfully.")).toBeVisible();
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:import_csv_with_all_valid_fields");
  await recorder.save(testInfo);
});
