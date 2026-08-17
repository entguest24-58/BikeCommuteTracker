import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupAuthenticatedSession } from "../../helpers/mock-api.js";

test("App allows continued use and provides retry option when update fails", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("update_failure_allows_continued_use_with_retry_option", "App allows continued use and provides retry option when update fails");

  await recorder.step("Seed authenticated session so protected core routes remain reachable if update recovery is implemented.");
  await setupAuthenticatedSession(page);

  await recorder.step("Mock startup health and general API responses.");
  await page.route("**/health", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ status: "ok" }),
    });
  });
  await page.route("**/api/**", async (route) => {
    const url = route.request().url();
    if (url.includes("/api/rides/presets")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ presets: [] }),
      });
    }
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({}),
    });
  });

  await recorder.step("Open the app and verify the required update-failure recovery message and action.");
  await page.goto("/");
  await expect(
    page.getByText("Could not update to the latest version. You may continue using version 1.2.0. Click Retry to try again.")
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Retry Update" })).toBeVisible();

  await recorder.step("Verify core functionality remains accessible by navigating to a protected ride page.");
  await page.goto("/rides/record");
  await expect(page.getByRole("heading", { name: "Record a Ride" })).toBeVisible();

  console.log("CODEVALID_TEST_ASSERTION_OK:update_failure_allows_continued_use_with_retry_option");
  await recorder.save(testInfo);
});
