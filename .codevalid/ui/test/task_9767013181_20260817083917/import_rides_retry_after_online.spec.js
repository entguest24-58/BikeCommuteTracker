import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupAuthenticatedSession } from "../../helpers/mock-api.js";

test("Ride import resumes successfully after connectivity restoration", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "import_rides_retry_after_online",
    testTitle: "Ride import resumes successfully after connectivity restoration",
  });

  let online = false;
  let previewPayload = null;

  await recorder.step("Seed authenticated session", async () => {
    await setupAuthenticatedSession(page);
  });

  await recorder.step("Mock startup and offline-then-online import APIs", async () => {
    await page.route("**/health", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ status: "ok" }),
      });
    });

    await page.route("**/api/imports/preview", async (route) => {
      if (!online) {
        await route.fulfill({
          status: 503,
          contentType: "application/json",
          body: JSON.stringify({
            message:
              "Ride operations require an online connection. Offline creation, editing, or viewing is not supported in v1.",
          }),
        });
        return;
      }

      previewPayload = route.request().postDataJSON();
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          importJobId: 4101,
          totalRows: 1,
          validRows: 1,
          invalidRows: 0,
          duplicateRows: 0,
          requiresDuplicateResolution: false,
          rows: [
            {
              rowNumber: 1,
              date: "2026-08-02",
              miles: 14.2,
              rideMinutes: 38,
              temperature: 69,
              tags: null,
              notes: null,
              isValid: true,
              errors: [],
              duplicateMatches: [],
            },
          ],
        }),
      });
    });

    await page.route("**/api/imports/start", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          importJobId: 4101,
          status: "processing",
          startedAtUtc: "2026-08-17T08:40:00.000Z",
        }),
      });
    });

    await page.route(/.*\/api\/imports\/\d+\/status$/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          importJobId: 4101,
          status: "processing",
          totalRows: 1,
          processedRows: 1,
          importedRows: 1,
          skippedRows: 0,
          failedRows: 0,
          percentComplete: 100,
          etaMinutesRounded: 0,
          createdAtUtc: "2026-08-17T08:39:00.000Z",
          startedAtUtc: "2026-08-17T08:40:00.000Z",
          completedAtUtc: null,
          lastError: null,
        }),
      });
    });
  });

  await recorder.step("Attempt import offline first", async () => {
    await page.goto("/rides/import");
    await expect(page.getByRole("heading", { name: "Import Rides" })).toBeVisible();

    await page.locator("#csv-upload-input").setInputFiles({
      name: "commute-rides.csv",
      mimeType: "text/csv",
      buffer: Buffer.from("date,miles\n2026-08-02,14.2\n"),
    });

    await expect(page.getByText("Selected file: commute-rides.csv")).toBeVisible();
    await page.getByRole("button", { name: "Preview Import" }).click();
    await expect(
      page.getByText(
        "Ride operations require an online connection. Offline creation, editing, or viewing is not supported in v1."
      )
    ).toBeVisible();
  });

  await recorder.step("Restore connectivity and retry", async () => {
    online = true;
    await page.getByRole("button", { name: "Retry Connection" }).click();
  });

  await recorder.step("Verify import resumes without losing selected file", async () => {
    await expect(page.getByText("Selected file: commute-rides.csv")).toBeVisible();
    await expect(page.getByRole("button", { name: "Start Import" })).toBeVisible();
    await expect(page.getByText("Row 1: Valid")).toBeVisible();

    await page.getByRole("button", { name: "Start Import" }).click();
    await expect(page.getByRole("heading", { name: "Import Progress" })).toBeVisible();
    expect(previewPayload.fileName).toBe("commute-rides.csv");
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:import_rides_retry_after_online");
  await recorder.save(testInfo);
});
