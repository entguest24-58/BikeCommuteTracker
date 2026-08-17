import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupUnauthenticatedSession } from "../../helpers/mock-api.js";

test("Unauthenticated user is blocked from navigating to Record Ride page", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "unauthenticated_user_blocked_from_record_ride",
    testTitle: testInfo.title,
  });

  await recorder.step("Seed unauthenticated session", async () => {
    await setupUnauthenticatedSession(page);
  });

  await recorder.step("Attempt direct navigation to protected Record Ride route", async () => {
    await page.goto("/rides/record");
  });

  await recorder.step("Verify redirect to login and protected page is blocked", async () => {
    await expect(page).toHaveURL(/\/login$/);
    await expect(
      page.getByRole("heading", { name: "Log in" })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Record a Ride" })
    ).not.toBeVisible();
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:unauthenticated_user_blocked_from_record_ride");
  await recorder.save(testInfo);
});
