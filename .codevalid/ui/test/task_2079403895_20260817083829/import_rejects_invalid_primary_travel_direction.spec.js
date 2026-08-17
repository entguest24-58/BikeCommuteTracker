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

test("Import rejects rows with unrecognized PrimaryTravelDirection/Direction values", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "import_rejects_invalid_primary_travel_direction",
    testTitle: "Import rejects rows with unrecognized PrimaryTravelDirection/Direction values",
  });

  const csv = [
    "Date,Miles,RideMinutes,Temperature,Tags,Difficulty,PrimaryTravelDirection,Notes",
    '2026-06-15,12.4,48,68,commute,3,Foo,"Invalid direction one"',
    '2026-06-16,13.1,52,69,commute,2,XX,"Invalid direction two"',
    '2026-06-17,9.3,35,70,errand,1,N,"Valid row one"',
    '2026-06-18,15.8,58,72,training,2,North,"Valid row two"',
    '2026-06-19,21.2,75,74,long,3,SE,"Valid row three"',
  ].join("\n");

  const expectedMessage = "Invalid PrimaryTravelDirection/Direction value: must be one of N, NE, E, SE, S, SW, W, NW or North, Northeast, East, Southeast, South, Southwest, West, Northwest.";

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
          importJobId: 105,
          totalRows: 5,
          validRows: 3,
          invalidRows: 2,
          duplicateRows: 0,
          requiresDuplicateResolution: false,
          rows: [
            { rowNumber: 1, isValid: false, errors: [{ rowNumber: 1, code: "invalid_direction", message: expectedMessage, field: "PrimaryTravelDirection/Direction" }], duplicateMatches: [] },
            { rowNumber: 2, isValid: false, errors: [{ rowNumber: 2, code: "invalid_direction", message: expectedMessage, field: "PrimaryTravelDirection/Direction" }], duplicateMatches: [] },
            { rowNumber: 3, isValid: true, errors: [], duplicateMatches: [] },
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
      name: "invalid-direction.csv",
      mimeType: "text/csv",
      buffer: Buffer.from(csv, "utf-8"),
    });
    await page.getByRole("button", { name: "Preview Import" }).click();
  });

  await recorder.step("assert direction validation details", async () => {
    await expect(page.getByText("Total rows: 5 | Valid rows: 3 | Invalid rows: 2")).toBeVisible();
    await expect(page.getByText(`PrimaryTravelDirection/Direction: ${expectedMessage}`).first()).toBeVisible();
    await expect(page.getByText(`PrimaryTravelDirection/Direction: ${expectedMessage}`).nth(1)).toBeVisible();
    await expect(page.getByText("Row 3: Valid")).toBeVisible();
    await expect(page.getByText("Row 4: Valid")).toBeVisible();
    await expect(page.getByText("Row 5: Valid")).toBeVisible();
  });

  await recorder.step("emit assertion marker", async () => {
    console.log("CODEVALID_TEST_ASSERTION_OK:import_rejects_invalid_primary_travel_direction");
  });

  await recorder.save(testInfo);
});
