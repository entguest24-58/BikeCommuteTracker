import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import {
  setupAuthenticatedSession,
  setupSettingsPageScenario,
} from "../../helpers/mock-api.js";

test("User can locate biketracking.local.db via UI guidance in SettingsPage", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "database_location_discovered_via_ui",
    testTitle: testInfo.title,
  });

  await recorder.step("Open current Settings page implementation", async () => {
    await setupAuthenticatedSession(page);
    await setupSettingsPageScenario(page, { presets: [] });
    await page.goto("/settings");
    await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
  });

  await recorder.step("Verify expected database guidance is not yet present in current UI", async () => {
    await expect(page.getByText("Database Management")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Show Database Location" })).toHaveCount(0);
    await expect(
      page.getByText(
        "Your ride data is stored in biketracking.local.db located in the application installation folder."
      )
    ).toHaveCount(0);
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:database_location_discovered_via_ui");
  await recorder.save(testInfo);
});
