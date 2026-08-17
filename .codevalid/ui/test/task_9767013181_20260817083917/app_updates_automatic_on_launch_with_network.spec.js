import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupAuthenticatedSession } from "../../helpers/mock-api.js";

test("App automatically checks for and applies latest version on launch with network", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "app_updates_automatic_on_launch_with_network",
    testTitle: "App automatically checks for and applies latest version on launch with network",
  });

  await recorder.step("Seed authenticated session", async () => {
    await setupAuthenticatedSession(page);
  });

  await recorder.step("Delay startup so update-status UI can be observed", async () => {
    await page.route("**/health", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1200));
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ status: "ok" }),
      });
    });

    await page.goto("/rides/import");
  });

  await recorder.step("Verify distinct update status appears before main UI", async () => {
    await expect(
      page.getByText("Updating Commute Bike Tracker to the latest version...")
    ).toBeVisible();
    await expect(page.getByText("Connecting…")).not.toBeVisible();
  });

  await recorder.step("Verify main UI loads after update flow", async () => {
    await expect(page.getByRole("heading", { name: "Import Rides" })).toBeVisible();
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:app_updates_automatic_on_launch_with_network");
  await recorder.save(testInfo);
});
