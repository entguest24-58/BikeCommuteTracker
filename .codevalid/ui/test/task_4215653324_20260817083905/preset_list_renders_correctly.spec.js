import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupAuthenticatedAppSession, setupRidePresetCrudScenario } from "../../helpers/mock-api.js";
import { morningCommutePreset, afternoonRunPreset } from "../../mock/mock-data.js";

test("Preset list displays all user-specific presets with correct metadata", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("preset_list_renders_correctly", testInfo.title);

  await recorder.step("Seed authenticated rider and preset list", async () => {
    await setupAuthenticatedAppSession(page, { userId: 1, userName: "johndoe" });
    await setupRidePresetCrudScenario(page, {
      initialPresets: [morningCommutePreset, afternoonRunPreset],
    });
  });

  await recorder.step("Open SettingsPage", async () => {
    await page.goto("/settings");
    await expect(page.getByRole("heading", { name: "Ride Presets" })).toBeVisible();
  });

  await recorder.step("Verify both presets render with metadata", async () => {
    await expect(page.getByText("Morning Commute (SW, morning, 07:00, 30 min, 5.2 mi)")).toBeVisible();
    await expect(page.getByText("Afternoon Run (NE, afternoon, 17:30, 45 min, 6.1 mi)")).toBeVisible();
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:preset_list_renders_correctly");
  await recorder.save(testInfo);
});
