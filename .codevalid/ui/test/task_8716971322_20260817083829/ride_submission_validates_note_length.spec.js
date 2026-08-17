import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import {
  setupAuthenticatedSession,
  setupRecordRidePageScenario,
} from "../../helpers/mock-api.js";

test("ride submission validates note text is ≤ 500 characters", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "ride_submission_validates_note_length",
    testTitle: testInfo.title,
  });

  await recorder.step("setup session and open page", async () => {
    await setupAuthenticatedSession(page);
    await setupRecordRidePageScenario(page);
    await page.goto("/rides/record");
    await page.locator("#miles").fill("10");
  });

  await recorder.step("browser maxLength prevents more than 500 chars", async () => {
    const longNote = "a".repeat(501);
    await page.locator("#notes").fill(longNote);
    const noteValue = await page.locator("#notes").inputValue();
    expect(noteValue.length).toBe(500);
    await page.getByRole("button", { name: "Record Ride" }).click();
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:ride_submission_validates_note_length");
  await recorder.save(testInfo);
});
