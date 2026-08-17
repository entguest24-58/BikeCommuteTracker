import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupAuthenticatedSession } from "../../helpers/mock-api.js";

test("Authenticated user navigates to Record Ride page", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "authenticated_user_navigates_to_record_ride",
    testTitle: testInfo.title,
  });

  await recorder.step("Seed authenticated session", async () => {
    await setupAuthenticatedSession(page);
  });

  await recorder.step("Open dashboard with authenticated header", async () => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(
      page.getByRole("heading", { name: "Your riding story, one screen." })
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "Record Ride" })).toBeVisible();
  });

  await recorder.step("Click Record Ride in AppHeader", async () => {
    await page.getByRole("link", { name: "Record Ride" }).click();
  });

  await recorder.step("Verify Record Ride page loads without auth errors", async () => {
    await expect(page).toHaveURL(/\/rides\/record$/);
    await expect(
      page.getByRole("heading", { name: "Record a Ride" })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Log in" })
    ).not.toBeVisible();
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:authenticated_user_navigates_to_record_ride");
  await recorder.save(testInfo);
});
