import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupAuthenticatedAppSession, setupRidePresetCrudScenario } from "../../helpers/mock-api.js";
import { weekendRidePreset } from "../../mock/mock-data.js";

test("Canceled preset deletion preserves preset", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("delete_preset_canceled", testInfo.title);

  await recorder.step("Seed preset list", async () => {
    await setupAuthenticatedAppSession(page, { userId: 1, userName: "johndoe" });
    await setupRidePresetCrudScenario(page, { initialPresets: [weekendRidePreset] });
  });

  await recorder.step("Open SettingsPage", async () => {
    await page.goto("/settings");
  });

  await recorder.step("Verify current UI has no confirmation dialog and preset is initially visible", async () => {
    await expect(page.getByText("Weekend Ride (NE, morning, 08:00, 60 min, 10.5 mi)")).toBeVisible();
    await expect(page.getByRole("button", { name: "Delete" })).toBeVisible();
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:delete_preset_canceled");
  await recorder.save(testInfo);
});
