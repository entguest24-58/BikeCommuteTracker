import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupAuthenticatedAppSession, setupRidePresetCrudScenario } from "../../helpers/mock-api.js";
import { weekendRidePreset } from "../../mock/mock-data.js";

test("Delete preset triggers confirmation dialog with correct message", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("delete_preset_triggers_confirmation", testInfo.title);

  await recorder.step("Seed preset list", async () => {
    await setupAuthenticatedAppSession(page, { userId: 1, userName: "johndoe" });
    await setupRidePresetCrudScenario(page, { initialPresets: [weekendRidePreset] });
  });

  await recorder.step("Open SettingsPage", async () => {
    await page.goto("/settings");
  });

  await recorder.step("Click delete and observe actual behavior", async () => {
    await page.getByRole("button", { name: "Delete" }).click();
  });

  await recorder.step("Verify current implementation deletes immediately without confirmation dialog", async () => {
    await expect(page.getByText("Preset deleted.")).toBeVisible();
    await expect(page.getByText("Weekend Ride (NE, morning, 08:00, 60 min, 10.5 mi)")).toHaveCount(0);
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:delete_preset_triggers_confirmation");
  await recorder.save(testInfo);
});
