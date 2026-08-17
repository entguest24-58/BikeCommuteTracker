import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import {
  setupAuthenticatedBikeSession,
  mockRecordRidePage,
} from "../../helpers/mock-api.js";

test("Note field blocks input exceeding 500 characters", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "note_field_validates_500_char_limit",
    testTitle: testInfo.title,
  });
  const overLimitNote = "a".repeat(501);

  await recorder.step("seed auth and page mocks", async () => {
    await setupAuthenticatedBikeSession(page);
    await mockRecordRidePage(page);
  });

  await recorder.step("open page and enter over-limit note", async () => {
    await page.goto("/rides/record");
    await page.locator("#miles").fill("10");
    await page.locator("#notes").evaluate((el, value) => {
      el.value = value;
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
    }, overLimitNote);
    await page.getByRole("button", { name: "Record Ride" }).click();
  });

  await recorder.step("verify validation message and preserved note text", async () => {
    await expect(page.getByText("Note must be 500 characters or fewer")).toBeVisible();
    await expect(page.locator("#notes")).toHaveValue(overLimitNote);
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:note_field_validates_500_char_limit");
  await recorder.save(testInfo);
});
