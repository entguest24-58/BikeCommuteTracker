import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupAuthenticatedSession } from "../../helpers/mock-api.js";

test("Update failure allows continued app use with retry option", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "update_failure_allows_continue_with_retry_option",
    testTitle: "Update failure allows continued app use with retry option",
  });

  await recorder.step("Seed authenticated session", async () => {
    await setupAuthenticatedSession(page);
  });

  await recorder.step("Mock startup success so current app remains usable", async () => {
    await page.route("**/health", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ status: "ok" }),
      });
    });

    await page.goto("/rides/import");
  });

  await recorder.step("Verify update failure banner and retry option while main UI is accessible", async () => {
    await expect(page.getByRole("heading", { name: "Import Rides" })).toBeVisible();
    await expect(
      page.getByText(
        "Update failed. Could not download latest version. Please check your connection and try again later."
      )
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Retry Update" })).toBeVisible();
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:update_failure_allows_continue_with_retry_option");
  await recorder.save(testInfo);
});
