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

test("Import handles files with mixed valid and invalid rows without blocking entire batch", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "import_handles_mixed_valid_and_invalid_rows",
    testTitle: "Import handles files with mixed valid and invalid rows without blocking entire batch",
  });

  const csv = [
    "Date,Miles,RideMinutes,Temperature,Tags,Difficulty,PrimaryTravelDirection,Notes",
    '2026-06-15,12.4,48,68,commute,0,N,"Invalid difficulty"',
    '2026-06-16,13.1,52,69,commute,2,Foo,"Invalid direction"',
    `2026-06-17,9.3,35,70,errand,3,SE,"${"c".repeat(501)}"`,
    '2026-06-18,15.8,58,72,training,2,North,"Valid row one"',
    '2026-06-19,21.2,75,74,long,4,SW,"Valid row two"',
  ].join("\n");

  await recorder.step("prepare authenticated session", async () => {
    await setupAuthenticatedSession(page);
    await seedRepoAuthSession(page);
  });

  await recorder.step("mock mixed validation preview response", async () => {
    await page.route("**/api/imports/preview", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          importJobId: 107,
          totalRows: 5,
          validRows: 2,
          invalidRows: 3,
          duplicateRows: 0,
          requiresDuplicateResolution: false,
          rows: [
            { rowNumber: 1, isValid: false, errors: [{ rowNumber: 1, code: "invalid_difficulty", message: "Invalid Difficulty value: must be between 1 and 5.", field: "Difficulty" }], duplicateMatches: [] },
            { rowNumber: 2, isValid: false, errors: [{ rowNumber: 2, code: "invalid_direction", message: "Invalid PrimaryTravelDirection/Direction value: must be one of N, NE, E, SE, S, SW, W, NW or North, Northeast, East, Southeast, South, Southwest, West, Northwest.", field: "PrimaryTravelDirection/Direction" }], duplicateMatches: [] },
            { rowNumber: 3, isValid: false, errors: [{ rowNumber: 3, code: "notes_too_long", message: "Notes exceed maximum length of 500 characters.", field: "Notes" }], duplicateMatches: [] },
            { rowNumber: 4, isValid: true, errors: [], duplicateMatches: [] },
            { rowNumber: 5, isValid: true, errors: [], duplicateMatches: [] },
          ],
        }),
      });
    });
  });

  await recorder.step("open page upload csv and preview", async () => {
    await page.goto("/rides/import");
    await page.locator("#csv-upload-input").setInputFiles({
      name: "mixed-valid-invalid.csv",
      mimeType: "text/csv",
      buffer: Buffer.from(csv, "utf-8"),
    });
    await page.getByRole("button", { name: "Preview Import" }).click();
  });

  await recorder.step("assert mixed row outcomes", async () => {
    await expect(page.getByText("Total rows: 5 | Valid rows: 2 | Invalid rows: 3")).toBeVisible();
    await expect(page.getByText("Difficulty: Invalid Difficulty value: must be between 1 and 5.")).toBeVisible();
    await expect(page.getByText("PrimaryTravelDirection/Direction: Invalid PrimaryTravelDirection/Direction value: must be one of N, NE, E, SE, S, SW, W, NW or North, Northeast, East, Southeast, South, Southwest, West, Northwest.")).toBeVisible();
    await expect(page.getByText("Notes: Notes exceed maximum length of 500 characters.")).toBeVisible();
    await expect(page.getByText("Row 4: Valid")).toBeVisible();
    await expect(page.getByText("Row 5: Valid")).toBeVisible();
  });

  await recorder.step("emit assertion marker", async () => {
    console.log("CODEVALID_TEST_ASSERTION_OK:import_handles_mixed_valid_and_invalid_rows");
  });

  await recorder.save(testInfo);
});
