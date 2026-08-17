import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";

const SESSION_KEY = "bike_tracking_auth_session";

function buildSession() {
  const now = new Date();
  return {
    userId: 101,
    userName: "Test Rider",
    lastActivityAtUtc: now.toISOString(),
    expiresAtUtc: new Date(now.getTime() + 30 * 60 * 1000).toISOString(),
  };
}

test("Row with unrecognized direction value is rejected with accepted values list", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("import_csv_with_invalid_direction_value", "Row with unrecognized direction value is rejected with accepted values list");
  const directionMessage = "Direction must be one of: N, NE, E, SE, S, SW, W, NW, North, Northeast, East, Southeast, South, Southwest, West, Northwest.";

  await page.addInitScript(({ key, session }) => {
    window.sessionStorage.setItem(key, JSON.stringify(session));
  }, { key: SESSION_KEY, session: buildSession() });

  await page.route("**/api/imports/preview", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        importJobId: 5001,
        totalRows: 2,
        validRows: 0,
        invalidRows: 2,
        duplicateRows: 0,
        requiresDuplicateResolution: false,
        rows: [
          { rowNumber: 1, date: "2023-10-01", miles: 10.5, rideMinutes: null, temperature: null, tags: null, notes: null, isValid: false, errors: [{ rowNumber: 1, code: "direction_invalid", field: "Direction", message: directionMessage }], duplicateMatches: [] },
          { rowNumber: 2, date: "2023-10-02", miles: 6.1, rideMinutes: null, temperature: null, tags: null, notes: null, isValid: false, errors: [{ rowNumber: 2, code: "direction_invalid", field: "Direction", message: directionMessage }], duplicateMatches: [] }
        ]
      })
    });
  });

  await recorder.step("Open page and upload CSV with invalid directions");
  await page.goto("/rides/import");
  await page.locator("#csv-upload-input").setInputFiles({
    name: "invalid-direction.csv",
    mimeType: "text/csv",
    buffer: Buffer.from("Date,Miles,Direction\n2023-10-01,10.5,Up\n2023-10-02,8.0,BadDirection\n")
  });

  await recorder.step("Preview direction validation errors");
  await page.getByRole("button", { name: "Preview Import" }).click();
  await expect(page.getByText("Total rows: 2 | Valid rows: 0 | Invalid rows: 2")).toBeVisible();
  await expect(page.getByText(`Direction: ${directionMessage}`)).toHaveCount(2);

  console.log("CODEVALID_TEST_ASSERTION_OK:import_csv_with_invalid_direction_value");
  await recorder.save(testInfo);
});
