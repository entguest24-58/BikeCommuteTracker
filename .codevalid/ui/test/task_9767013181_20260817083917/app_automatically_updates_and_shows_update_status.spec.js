import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import {
  setupUnauthenticatedSession,
  setupUpdateInProgressScenario,
} from "../../helpers/mock-api.js";

test("Installed app automatically checks for and shows update status on launch with network", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "app_automatically_updates_and_shows_update_status",
    testTitle: testInfo.title,
  });

  await recorder.step("Seed unauthenticated app launch with successful startup health");
  await setupUnauthenticatedSession(page);
  await page.route("**/health", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ status: "ok" }),
    });
  });

  await recorder.step("Inject installed-app update status surface");
  await setupUpdateInProgressScenario(page, {
    message: "Updating Commute Bike Tracker... Please wait.",
  });

  await recorder.step("Launch the app");
  await page.goto("/");

  await recorder.step("Verify dedicated update message is shown and distinct from normal connecting state");
  await expect(page.getByText("Updating Commute Bike Tracker... Please wait.")).toBeVisible();
  await expect(page.getByText("Connecting…")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Record a Ride" })).toHaveCount(0);

  console.log("CODEVALID_TEST_ASSERTION_OK:app_automatically_updates_and_shows_update_status");
  await recorder.save(testInfo);
});
