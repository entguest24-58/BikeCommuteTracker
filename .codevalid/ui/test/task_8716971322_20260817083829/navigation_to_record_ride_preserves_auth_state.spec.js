import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupAuthenticatedSession } from "../../helpers/mock-api.js";

test("Navigation to Record Ride preserves authenticated session state", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "navigation_to_record_ride_preserves_auth_state",
    testTitle: testInfo.title,
  });

  await recorder.step("Seed authenticated session", async () => {
    await setupAuthenticatedSession(page);
  });

  await recorder.step("Open dashboard as authenticated user", async () => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(
      page.getByRole("heading", { name: "Your riding story, one screen." })
    ).toBeVisible();
  });

  await recorder.step("Navigate to Record Ride from AppHeader", async () => {
    await page.getByRole("link", { name: "Record Ride" }).click();
  });

  await recorder.step("Confirm authenticated session is preserved on Record Ride", async () => {
    await expect(page).toHaveURL(/\/rides\/record$/);
    await expect(
      page.getByRole("heading", { name: "Record a Ride" })
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "Record Ride" })).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Log in" })
    ).not.toBeVisible();
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:navigation_to_record_ride_preserves_auth_state");
  await recorder.save(testInfo);
});
