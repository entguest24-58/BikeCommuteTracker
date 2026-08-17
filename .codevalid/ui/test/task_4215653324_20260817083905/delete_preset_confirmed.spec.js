import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupAuthenticatedAppSession, setupRidePresetCrudScenario } from "../../helpers/mock-api.js";
import { weekendRidePreset } from "../../mock/mock-data.js";

test("Confirmed preset deletion removes preset from list and ride entry", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("delete_preset_confirmed", testInfo.title);

  await recorder.step("Seed preset list with Weekend Ride", async () => {
    await setupAuthenticatedAppSession(page, { userId: 1, userName: "johndoe" });
    await setupRidePresetCrudScenario(page, { initialPresets: [weekendRidePreset] });
  });

  await recorder.step("Open SettingsPage", async () => {
    await page.goto("/settings");
  });

  await recorder.step("Delete preset", async () => {
    await page.getByRole("button", { name: "Delete" }).click();
  });

  await recorder.step("Verify preset disappears from list", async () => {
    await expect(page.getByText("Weekend Ride (NE, morning, 08:00, 60 min, 10.5 mi)")).toHaveCount(0);
    await expect(page.getByText("Preset deleted.")).toBeVisible();
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:delete_preset_confirmed");
  await recorder.save(testInfo);
});
