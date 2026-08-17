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

test("Row with non-integer Difficulty (e.g., string, decimal) is rejected", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("import_csv_with_non_integer_difficulty", "Row with non-integer Difficulty (e.g., string, decimal) is rejected");

  await page.addInitScript(({ key, session }) => {
    window.sessionStorage.setItem(key, JSON.stringify(session));
  }, { key: SESSION_KEY, session: buildSession() });

  await page.route("**/api/imports/preview", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        importJobId: 8001,
        totalRows: 1,
        validRows: 0,
        invalidRows: 1,
        duplicateRows: 0,
        requiresDuplicateResolution: false,
        rows: [
          {
            rowNumber: 1,
            date: "2023-10-01",
            miles: 10.5,
            rideMinutes: null,
            temperature: null,
            tags: null,
            notes: null,
            isValid: false,
            errors: [{ rowNumber: 1, code: "difficulty_invalid", field: "Difficulty", message: "Difficulty must be an integer between 1 and 5." }],
            duplicateMatches: []
          }
        ]
      })
    });
  });

  await recorder.step("Open page and upload non-integer difficulty CSV");
  await page.goto("/rides/import");
  await page.locator("#csv-upload-input").setInputFiles({
    name: "non-integer-difficulty.csv",
    mimeType: "text/csv",
    buffer: Buffer.from("Date,Miles,Difficulty\n2023-10-01,10.5,3.5\n")
  });

  await recorder.step("Preview validation error");
  await page.getByRole("button", { name: "Preview Import" }).click();
  await expect(page.getByText("Difficulty: Difficulty must be an integer between 1 and 5.")).toBeVisible();

  console.log("CODEVALID_TEST_ASSERTION_OK:import_csv_with_non_integer_difficulty");
  await recorder.save(testInfo);
});
