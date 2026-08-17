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

test("Import rejects rows where Notes exceed 500 characters", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "import_rejects_notes_exceeding_500_characters",
    testTitle: "Import rejects rows where Notes exceed 500 characters",
  });

  const tooLong = "a".repeat(501);
  const validNote = "b".repeat(100);
  const csv = [
    "Date,Miles,RideMinutes,Temperature,Tags,Difficulty,PrimaryTravelDirection,Notes",
    `2026-06-15,12.4,48,68,commute,3,N,${tooLong}`,
    `2026-06-16,13.1,52,69,commute,2,SE,${validNote}`,
  ].join("\n");

  await recorder.step("prepare authenticated session", async () => {
    await setupAuthenticatedSession(page);
    await seedRepoAuthSession(page);
  });

  await recorder.step("mock preview validation response", async () => {
    await page.route("**/api/imports/preview", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          importJobId: 106,
          totalRows: 2,
          validRows: 1,
          invalidRows: 1,
          duplicateRows: 0,
          requiresDuplicateResolution: false,
          rows: [
            { rowNumber: 1, isValid: false, errors: [{ rowNumber: 1, code: "notes_too_long", message: "Notes exceed maximum length of 500 characters.", field: "Notes" }], duplicateMatches: [] },
            { rowNumber: 2, isValid: true, errors: [], duplicateMatches: [] },
          ],
        }),
      });
    });
  });

  await recorder.step("open page upload csv and preview", async () => {
    await page.goto("/rides/import");
    await page.locator("#csv-upload-input").setInputFiles({
      name: "notes-too-long.csv",
      mimeType: "text/csv",
      buffer: Buffer.from(csv, "utf-8"),
    });
    await page.getByRole("button", { name: "Preview Import" }).click();
  });

  await recorder.step("assert notes length validation failure", async () => {
    await expect(page.getByText("Total rows: 2 | Valid rows: 1 | Invalid rows: 1")).toBeVisible();
    await expect(page.getByText("Notes: Notes exceed maximum length of 500 characters.")).toBeVisible();
    await expect(page.getByText("Row 2: Valid")).toBeVisible();
  });

  await recorder.step("emit assertion marker", async () => {
    console.log("CODEVALID_TEST_ASSERTION_OK:import_rejects_notes_exceeding_500_characters");
  });

  await recorder.save(testInfo);
});
