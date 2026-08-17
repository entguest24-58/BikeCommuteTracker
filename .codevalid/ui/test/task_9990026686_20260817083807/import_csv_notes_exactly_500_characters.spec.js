import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupUnauthenticatedSession } from "../../helpers/mock-api.js";

const SESSION_KEY = "bike_tracking_auth_session";
const note500 = "B".repeat(500);
const csv = ["Date,Miles,Notes", `2024-05-01T08:00:00,10,${note500}`].join("\n");

async function seedAuthenticatedSession(page) {
  await page.addInitScript((key) => {
    const now = new Date();
    const expires = new Date(now.getTime() + 3600000);
    window.sessionStorage.setItem(key, JSON.stringify({ userId: 1, userName: "Alice", lastActivityAtUtc: now.toISOString(), expiresAtUtc: expires.toISOString() }));
  }, SESSION_KEY);
}

test("import_csv_notes_exactly_500_characters", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("import_csv_notes_exactly_500_characters", "CSV with Notes exactly 500 characters imported successfully");

  await recorder.step("Prepare session", async () => {
    await setupUnauthenticatedSession(page);
    await seedAuthenticatedSession(page);
  });

  await recorder.step("Mock successful import flow", async () => {
    await page.route("**/api/imports/preview", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ importJobId: 108, totalRows: 1, validRows: 1, invalidRows: 0, duplicateRows: 0, requiresDuplicateResolution: false, rows: [{ rowNumber: 1, date: "2024-05-01T08:00:00", miles: 10, notes: note500, isValid: true, errors: [], duplicateMatches: [] }] }) });
    });
    await page.route("**/api/imports/start", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ importJobId: 108, status: "processing", startedAtUtc: "2024-05-01T08:00:00Z" }) });
    });
    await page.route("**/api/imports/108/status", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ importJobId: 108, status: "completed", totalRows: 1, processedRows: 1, importedRows: 1, skippedRows: 0, failedRows: 0, percentComplete: 100, etaMinutesRounded: null, createdAtUtc: "2024-05-01T08:00:00Z", startedAtUtc: "2024-05-01T08:00:01Z", completedAtUtc: "2024-05-01T08:00:02Z", lastError: null }) });
    });
  });

  await recorder.step("Upload, preview, and import", async () => {
    await page.goto("/rides/import");
    await page.locator("#csv-upload-input").setInputFiles({ name: "notes-500.csv", mimeType: "text/csv", buffer: Buffer.from(csv, "utf8") });
    await page.getByRole("button", { name: "Preview Import" }).click();
    await expect(page.getByText("Row 1: Valid")).toBeVisible();
    await page.getByRole("button", { name: "Start Import" }).click();
    await expect(page.getByRole("heading", { name: "Import Complete" })).toBeVisible();
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:import_csv_notes_exactly_500_characters");
  await recorder.save(testInfo);
});
